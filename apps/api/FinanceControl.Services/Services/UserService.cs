using FinanceControl.Data.Data;
using FinanceControl.Domain.Entities;
using FinanceControl.Domain.Interfaces.Service;
using FinanceControl.Shared.Dtos;
using FinanceControl.Shared.Dtos.Request;
using FinanceControl.Shared.Dtos.Response;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.IdentityModel.Tokens;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Security.Cryptography;
using System.Text;

namespace FinanceControl.Services.Services
{
    public class UserService : IUserService
    {
        private readonly ApplicationDbContext _context;
        private readonly IConfiguration _configuration;

        public UserService(
            ApplicationDbContext context,
            IConfiguration configuration)
        {
            _context = context;
            _configuration = configuration;
        }

        public async Task<User?> RegisterUserAsync(CreateUserRequestDto requestDto)
        {
            requestDto.Email = requestDto.Email.ToLower();

            if (await _context.Users.AnyAsync(u => u.Email == requestDto.Email))
                return null;

            var user = new User();
            var hasedPassword = new PasswordHasher<User>().HashPassword(user, requestDto.Password);

            user.Email = requestDto.Email;
            user.Name = requestDto.Name;
            user.PasswordHash = hasedPassword;

            _context.Add(user);
            await _context.SaveChangesAsync();

            var systemCategory = new Category
            {
                UserId = user.Id,
                Name = "BalanceUpdate",
                IsSystem = true
            };
            _context.Categories.Add(systemCategory);
            await _context.SaveChangesAsync();

            var systemSubCategory = new SubCategory
            {
                UserId = user.Id,
                CategoryId = systemCategory.Id,
                Name = "BalanceUpdate",
                IsSystem = true
            };
            _context.SubCategories.Add(systemSubCategory);
            await _context.SaveChangesAsync();

            return user;
        }

        public async Task<AuthResponseDto?> UserLoginAsync(UserLoginRequestDto requestDto)
        {
            requestDto.Email = requestDto.Email.ToLower();

            var user = await _context.Users.FirstOrDefaultAsync(u => u.Email == requestDto.Email);
            if (user is null)
                return null;

            if (new PasswordHasher<User>().VerifyHashedPassword(user, user.PasswordHash, requestDto.Password) == PasswordVerificationResult.Failed)
                return null;

            return await CreateAuthResponseAsync(user);
        }

        public async Task<AuthResponseDto?> RefreshTokenAsync(string refreshToken)
        {
            var stored = await _context.RefreshTokens
                .Include(r => r.User)
                .FirstOrDefaultAsync(r => r.Token == refreshToken);

            if (stored is null || stored.IsRevoked || stored.ExpiresAt <= DateTime.UtcNow)
                return null;

            stored.IsRevoked = true;
            await _context.SaveChangesAsync();

            return await CreateAuthResponseAsync(stored.User);
        }

        private async Task<AuthResponseDto> CreateAuthResponseAsync(User user)
        {
            var accessToken = CreateAccessToken(user);
            var refreshToken = await CreateRefreshTokenAsync(user.Id);

            return new AuthResponseDto
            {
                AccessToken = accessToken,
                RefreshToken = refreshToken
            };
        }

        private string CreateAccessToken(User user)
        {
            var claims = new List<Claim>
            {
                new Claim(ClaimTypes.NameIdentifier, user.Id.ToString()),
                new Claim(ClaimTypes.Email, user.Email)
            };

            var key = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(_configuration.GetValue<string>("AppSettings:Token")!));
            var creds = new SigningCredentials(key, SecurityAlgorithms.HmacSha512);

            var tokenDescriptor = new JwtSecurityToken(
                issuer: _configuration.GetValue<string>("AppSettings:Issuer"),
                audience: _configuration.GetValue<string>("AppSettings:Audience"),
                claims: claims,
                expires: DateTime.UtcNow.AddMinutes(30),
                signingCredentials: creds
            );

            return new JwtSecurityTokenHandler().WriteToken(tokenDescriptor);
        }

        private async Task<string> CreateRefreshTokenAsync(int userId)
        {
            var token = Convert.ToBase64String(RandomNumberGenerator.GetBytes(64));

            var refreshToken = new RefreshToken
            {
                UserId = userId,
                Token = token,
                ExpiresAt = DateTime.UtcNow.AddDays(30),
                CreatedAt = DateTime.UtcNow
            };

            _context.RefreshTokens.Add(refreshToken);
            await _context.SaveChangesAsync();

            return token;
        }
    }
}

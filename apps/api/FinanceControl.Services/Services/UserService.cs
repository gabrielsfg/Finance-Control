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

            _context.UserPreferences.Add(new UserPreferences { UserId = user.Id });

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

        public async Task<UserPreferencesResponseDto?> GetPreferencesAsync(int userId)
        {
            var prefs = await _context.UserPreferences.FirstOrDefaultAsync(p => p.UserId == userId);
            if (prefs is null)
                return null;

            return new UserPreferencesResponseDto
            {
                CurrencyCode = prefs.CurrencyCode,
                Locale = prefs.Locale
            };
        }

        public async Task<UserPreferencesResponseDto?> UpdatePreferencesAsync(int userId, UpdateUserPreferencesRequestDto requestDto)
        {
            var prefs = await _context.UserPreferences.FirstOrDefaultAsync(p => p.UserId == userId);
            if (prefs is null)
                return null;

            if (!string.IsNullOrWhiteSpace(requestDto.CurrencyCode))
                prefs.CurrencyCode = requestDto.CurrencyCode.Trim().ToUpper();

            if (!string.IsNullOrWhiteSpace(requestDto.Locale))
                prefs.Locale = requestDto.Locale.Trim();

            await _context.SaveChangesAsync();

            return new UserPreferencesResponseDto
            {
                CurrencyCode = prefs.CurrencyCode,
                Locale = prefs.Locale
            };
        }

        public IReadOnlyList<CurrencyResponseDto> GetAvailableCurrencies()
        {
            return new List<CurrencyResponseDto>
            {
                new() { Code = "BRL", Name = "Brazilian Real",           Symbol = "R$"  },
                new() { Code = "USD", Name = "United States Dollar",     Symbol = "$"   },
                new() { Code = "EUR", Name = "Euro",                     Symbol = "€"   },
                new() { Code = "GBP", Name = "British Pound Sterling",   Symbol = "£"   },
                new() { Code = "JPY", Name = "Japanese Yen",             Symbol = "¥"   },
                new() { Code = "CNY", Name = "Chinese Yuan",             Symbol = "¥"   },
                new() { Code = "CAD", Name = "Canadian Dollar",          Symbol = "CA$" },
                new() { Code = "AUD", Name = "Australian Dollar",        Symbol = "A$"  },
                new() { Code = "CHF", Name = "Swiss Franc",              Symbol = "Fr"  },
                new() { Code = "HKD", Name = "Hong Kong Dollar",         Symbol = "HK$" },
                new() { Code = "SGD", Name = "Singapore Dollar",         Symbol = "S$"  },
                new() { Code = "SEK", Name = "Swedish Krona",            Symbol = "kr"  },
                new() { Code = "NOK", Name = "Norwegian Krone",          Symbol = "kr"  },
                new() { Code = "DKK", Name = "Danish Krone",             Symbol = "kr"  },
                new() { Code = "NZD", Name = "New Zealand Dollar",       Symbol = "NZ$" },
                new() { Code = "MXN", Name = "Mexican Peso",             Symbol = "$"   },
                new() { Code = "ARS", Name = "Argentine Peso",           Symbol = "$"   },
                new() { Code = "CLP", Name = "Chilean Peso",             Symbol = "$"   },
                new() { Code = "COP", Name = "Colombian Peso",           Symbol = "$"   },
                new() { Code = "PEN", Name = "Peruvian Sol",             Symbol = "S/." },
                new() { Code = "INR", Name = "Indian Rupee",             Symbol = "₹"   },
                new() { Code = "KRW", Name = "South Korean Won",         Symbol = "₩"   },
                new() { Code = "IDR", Name = "Indonesian Rupiah",        Symbol = "Rp"  },
                new() { Code = "TRY", Name = "Turkish Lira",             Symbol = "₺"   },
                new() { Code = "RUB", Name = "Russian Ruble",            Symbol = "₽"   },
                new() { Code = "ZAR", Name = "South African Rand",       Symbol = "R"   },
                new() { Code = "SAR", Name = "Saudi Riyal",              Symbol = "﷼"   },
                new() { Code = "AED", Name = "UAE Dirham",               Symbol = "د.إ" },
                new() { Code = "PLN", Name = "Polish Zloty",             Symbol = "zł"  },
                new() { Code = "THB", Name = "Thai Baht",                Symbol = "฿"   },
            };
        }

        public async Task<UserProfileResponseDto?> GetProfileAsync(int userId)
        {
            var user = await _context.Users.FindAsync(userId);
            if (user is null)
                return null;

            return new UserProfileResponseDto
            {
                Id = user.Id,
                Name = user.Name,
                Email = user.Email
            };
        }

        public async Task<UserProfileResponseDto?> UpdateProfileAsync(int userId, UpdateUserProfileRequestDto requestDto)
        {
            var user = await _context.Users.FindAsync(userId);
            if (user is null)
                return null;

            if (!string.IsNullOrWhiteSpace(requestDto.Name))
                user.Name = requestDto.Name.Trim();

            if (!string.IsNullOrWhiteSpace(requestDto.Email))
            {
                var normalizedEmail = requestDto.Email.ToLower().Trim();
                if (normalizedEmail != user.Email &&
                    await _context.Users.AnyAsync(u => u.Email == normalizedEmail && u.Id != userId))
                    return null;

                user.Email = normalizedEmail;
            }

            await _context.SaveChangesAsync();

            return new UserProfileResponseDto
            {
                Id = user.Id,
                Name = user.Name,
                Email = user.Email
            };
        }

        public async Task<string?> ForgotPasswordAsync(string email)
        {
            var user = await _context.Users.FirstOrDefaultAsync(u => u.Email == email.ToLower().Trim());
            if (user is null)
                return null;

            var token = Convert.ToHexString(RandomNumberGenerator.GetBytes(32));
            user.PasswordResetToken = token;
            user.PasswordResetTokenExpiresAt = DateTime.UtcNow.AddHours(1);

            await _context.SaveChangesAsync();

            // TODO: send token via email (email service not yet integrated)
            return token;
        }

        public async Task<bool> ResetPasswordAsync(string token, string newPassword)
        {
            var user = await _context.Users.FirstOrDefaultAsync(u =>
                u.PasswordResetToken == token &&
                u.PasswordResetTokenExpiresAt > DateTime.UtcNow);

            if (user is null)
                return false;

            user.PasswordHash = new PasswordHasher<User>().HashPassword(user, newPassword);
            user.PasswordResetToken = null;
            user.PasswordResetTokenExpiresAt = null;

            await _context.SaveChangesAsync();
            return true;
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

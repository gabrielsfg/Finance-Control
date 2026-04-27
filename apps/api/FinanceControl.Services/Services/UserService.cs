using FinanceControl.Data.Data;
using FinanceControl.Domain.Entities;
using FinanceControl.Domain.Interfaces.Service;
using FinanceControl.Services.Seeds;
using FinanceControl.Shared.Dtos;
using FinanceControl.Shared.Dtos.Request;
using FinanceControl.Shared.Dtos.Response;
using FinanceControl.Shared.Enums;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.IdentityModel.Tokens;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Security.Cryptography;
using System.Text;
using LoginResult = FinanceControl.Shared.Dtos.Response.LoginResult;

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

            _context.UserPreferences.Add(new UserPreferences { UserId = user.Id });
            await _context.SaveChangesAsync();

            await SeedUserDataAsync(user.Id, user.PreferredLanguage);

            return user;
        }

        public async Task<LoginResult> UserLoginAsync(UserLoginRequestDto requestDto)
        {
            const int maxFailedAttempts = 5;
            const int lockoutMinutes = 15;

            requestDto.Email = requestDto.Email.ToLower();

            var user = await _context.Users.FirstOrDefaultAsync(u => u.Email == requestDto.Email);
            if (user is null)
                return LoginResult.Failed();

            if (user.LockoutEnd.HasValue && user.LockoutEnd.Value > DateTime.UtcNow)
                return LoginResult.Locked(user.LockoutEnd.Value - DateTime.UtcNow);

            if (new PasswordHasher<User>().VerifyHashedPassword(user, user.PasswordHash, requestDto.Password) == PasswordVerificationResult.Failed)
            {
                user.FailedLoginAttempts++;
                if (user.FailedLoginAttempts >= maxFailedAttempts)
                {
                    user.LockoutEnd = DateTime.UtcNow.AddMinutes(lockoutMinutes);
                    user.FailedLoginAttempts = 0;
                }
                await _context.SaveChangesAsync();
                return LoginResult.Failed();
            }

            user.FailedLoginAttempts = 0;
            user.LockoutEnd = null;
            await _context.SaveChangesAsync();

            return LoginResult.Success(await CreateAuthResponseAsync(user));
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

            var user = await _context.Users.FindAsync(userId);

            return new UserPreferencesResponseDto
            {
                CurrencyCode = prefs.CurrencyCode,
                Locale = prefs.Locale,
                Country = user?.Country
            };
        }

        public async Task<UserPreferencesResponseDto?> UpdatePreferencesAsync(int userId, UpdateUserPreferencesRequestDto requestDto)
        {
            var prefs = await _context.UserPreferences.FirstOrDefaultAsync(p => p.UserId == userId);
            if (prefs is null)
                return null;

            var user = await _context.Users.FindAsync(userId);
            if (user is null)
                return null;

            if (!string.IsNullOrWhiteSpace(requestDto.CurrencyCode))
                prefs.CurrencyCode = requestDto.CurrencyCode.Trim().ToUpper();

            if (!string.IsNullOrWhiteSpace(requestDto.Locale))
                prefs.Locale = requestDto.Locale.Trim();

            if (!string.IsNullOrWhiteSpace(requestDto.Country))
                user.Country = requestDto.Country.Trim().ToUpper();

            await _context.SaveChangesAsync();

            return new UserPreferencesResponseDto
            {
                CurrencyCode = prefs.CurrencyCode,
                Locale = prefs.Locale,
                Country = user.Country
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

        public async Task<bool> LogoutAsync(string refreshToken)
        {
            var stored = await _context.RefreshTokens
                .FirstOrDefaultAsync(r => r.Token == refreshToken);

            if (stored is null || stored.IsRevoked)
                return false;

            stored.IsRevoked = true;
            await _context.SaveChangesAsync();
            return true;
        }

        public async Task<bool> DeleteAccountAsync(int userId, string password)
        {
            var user = await _context.Users.FindAsync(userId);
            if (user is null)
                return false;

            if (new PasswordHasher<User>().VerifyHashedPassword(user, user.PasswordHash, password) == PasswordVerificationResult.Failed)
                return false;

            _context.Users.Remove(user);
            await _context.SaveChangesAsync();
            return true;
        }

        public async Task<bool> ResetDataAsync(int userId, string password)
        {
            var user = await _context.Users.FindAsync(userId);
            if (user is null)
                return false;

            if (new PasswordHasher<User>().VerifyHashedPassword(user, user.PasswordHash, password) == PasswordVerificationResult.Failed)
                return false;

            // Delete all financial data. UserId is the only thing preserved.
            // Categories, subcategories and accounts are also deleted because
            // the user may have created custom ones — the seed recreates the
            // defaults after this block, same as RegisterUserAsync.
            var transactions = _context.Transactions.Where(t => t.UserId == userId);
            _context.Transactions.RemoveRange(transactions);

            var recurringTransactions = _context.RecurringTransactions.Where(t => t.UserId == userId);
            _context.RecurringTransactions.RemoveRange(recurringTransactions);

            var budgetAllocations = _context.BudgetSubcategoryAllocations
                .Where(a => _context.Budgets.Any(b => b.Id == a.BudgetId && b.UserId == userId));
            _context.BudgetSubcategoryAllocations.RemoveRange(budgetAllocations);

            var areaCategories = _context.AreaCategories
                .Where(ac => _context.Areas.Any(a => a.Id == ac.AreaId && a.UserId == userId));
            _context.AreaCategories.RemoveRange(areaCategories);

            var budgets = _context.Budgets.Where(b => b.UserId == userId);
            _context.Budgets.RemoveRange(budgets);

            var areas = _context.Areas.Where(a => a.UserId == userId);
            _context.Areas.RemoveRange(areas);

            var accounts = _context.Accounts.Where(a => a.UserId == userId);
            _context.Accounts.RemoveRange(accounts);

            var subCategories = _context.SubCategories.Where(s => s.UserId == userId);
            _context.SubCategories.RemoveRange(subCategories);

            var categories = _context.Categories.Where(c => c.UserId == userId);
            _context.Categories.RemoveRange(categories);

            var refreshTokens = _context.RefreshTokens.Where(r => r.UserId == userId);
            _context.RefreshTokens.RemoveRange(refreshTokens);

            await _context.SaveChangesAsync();

            // Re-seed defaults exactly as RegisterUserAsync does.
            var restoredUser = await _context.Users.FindAsync(userId);
            await SeedUserDataAsync(userId, restoredUser?.PreferredLanguage);

            return true;
        }

        private async Task SeedUserDataAsync(int userId, string? preferredLanguage)
        {
            // System category (internal use — balance adjustments)
            var systemCategory = new Category { UserId = userId, Name = "BalanceUpdate", IsSystem = true };
            _context.Categories.Add(systemCategory);
            await _context.SaveChangesAsync();

            _context.SubCategories.Add(new SubCategory
            {
                UserId = userId,
                CategoryId = systemCategory.Id,
                Name = "BalanceUpdate",
                IsSystem = true
            });

            // Default categories and subcategories
            foreach (var (categoryName, subcategoryNames) in UserSeedData.GetCategories(preferredLanguage))
            {
                var category = new Category { UserId = userId, Name = categoryName, IsSystem = false };
                _context.Categories.Add(category);
                await _context.SaveChangesAsync();

                foreach (var subName in subcategoryNames)
                {
                    _context.SubCategories.Add(new SubCategory
                    {
                        UserId = userId,
                        CategoryId = category.Id,
                        Name = subName,
                        IsSystem = false
                    });
                }
            }

            // Default account (Wallet / Carteira)
            _context.Accounts.Add(new Account
            {
                UserId = userId,
                Name = UserSeedData.GetWalletName(preferredLanguage),
                Type = EnumAccountType.Cash,
                IsDefaultAccount = true
            });

            await _context.SaveChangesAsync();
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

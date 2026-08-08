using FinanceControl.Data.Data;
using FinanceControl.Domain.Entities;
using FinanceControl.Domain.Interfaces.Service;
using FinanceControl.Services.Email;
using FinanceControl.Services.Seeds;
using FinanceControl.Shared.Dtos;
using FinanceControl.Shared.Dtos.Request;
using FinanceControl.Shared.Dtos.Response;
using FinanceControl.Shared.Enums;
using FinanceControl.Shared.Models;
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
        // How long an emailed code stays usable. Verification and reset are generous
        // because the user leaves the app to fetch them; the two-factor code is shorter
        // since it is read while the login is still on screen.
        private static readonly TimeSpan VerificationCodeLifetime = TimeSpan.FromMinutes(15);
        private static readonly TimeSpan PasswordResetCodeLifetime = TimeSpan.FromMinutes(15);
        private static readonly TimeSpan TwoFactorCodeLifetime = TimeSpan.FromMinutes(10);

        // A 6-digit code is only safe because guessing is capped. Five tries against a
        // million combinations is what makes the short code acceptable at all.
        private const int MaxCodeAttempts = 5;

        // Stops a "resend" button from becoming a mailer: a fresh request inside the
        // window silently reuses the code already in the user's inbox.
        private static readonly TimeSpan ResendCooldown = TimeSpan.FromSeconds(60);

        private static readonly TimeSpan TrustedDeviceLifetime = TimeSpan.FromDays(30);

        private readonly ApplicationDbContext _context;
        private readonly IConfiguration _configuration;
        private readonly IEmailService _emailService;

        public UserService(
            ApplicationDbContext context,
            IConfiguration configuration,
            IEmailService emailService)
        {
            _context = context;
            _configuration = configuration;
            _emailService = emailService;
        }

        public async Task<Result> RegisterUserAsync(CreateUserRequestDto requestDto)
        {
            requestDto.Email = requestDto.Email.ToLower();

            if (await _context.Users.AnyAsync(u => u.Email == requestDto.Email))
                return Result.Failure("Email already exists.");

            var user = new User();
            var hasedPassword = new PasswordHasher<User>().HashPassword(user, requestDto.Password);

            user.Email = requestDto.Email;
            user.Name = requestDto.Name;
            user.PasswordHash = hasedPassword;

            _context.Add(user);
            await _context.SaveChangesAsync();

            _context.UserPreferences.Add(new UserPreferences { UserId = user.Id });
            await _context.SaveChangesAsync();

            // The seed does NOT run here. Registering is free and unproven — anyone can
            // burn an address they do not own — and each seed writes ~15 categories, ~60
            // subcategories and an account. Abandoned signups would fill the database with
            // data belonging to nobody, so it waits for VerifyEmailAsync. What is left
            // behind by an abandoned signup is two rows.
            //
            // No tokens either: the account exists but cannot be used until the address is
            // confirmed. The email is the only route back into an account, so it is proven
            // before anything is built on top of it.
            await IssueCodeAsync(user, EnumSecurityCodePurpose.AccountVerification, VerificationCodeLifetime);

            return Result.Success();
        }

        public async Task<LoginResult> UserLoginAsync(UserLoginRequestDto requestDto, string? trustedDeviceToken)
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

            if (user.FailedLoginAttempts != 0 || user.LockoutEnd != null)
            {
                user.FailedLoginAttempts = 0;
                user.LockoutEnd = null;
                await _context.SaveChangesAsync();
            }

            // Past this line the password is proven. Everything below is a second gate,
            // so the client is told which one it hit — a wrong password and a pending
            // code must not look the same, or the UI cannot route the user anywhere.
            if (user.EmailVerifiedAt is null)
            {
                await IssueCodeAsync(user, EnumSecurityCodePurpose.AccountVerification, VerificationCodeLifetime, respectCooldown: true);
                return LoginResult.EmailNotVerified();
            }

            if (!user.TwoFactorEnabled || await IsDeviceTrustedAsync(user.Id, trustedDeviceToken))
                return LoginResult.Success(await CreateAuthResponseAsync(user));

            var challengeToken = CreateOpaqueToken();
            var sent = await IssueCodeAsync(
                user, EnumSecurityCodePurpose.TwoFactor, TwoFactorCodeLifetime, challengeToken: challengeToken);

            // The two-factor screen has no resend — a new code needs a new challenge, and
            // only this call issues one. Handing back a challenge whose email never left
            // would park the user in front of a code field with no way forward, so the
            // failure is reported instead. There is nothing to leak here: the password
            // was already accepted, so this says nothing a caller did not already know.
            if (!sent)
                return LoginResult.DeliveryFailed();

            return LoginResult.TwoFactorRequired(challengeToken);
        }

        public async Task<Result<AuthTokensDto>> VerifyEmailAsync(VerifyEmailRequestDto requestDto)
        {
            var user = await _context.Users
                .FirstOrDefaultAsync(u => u.Email == requestDto.Email.ToLower().Trim());

            // Same message for an unknown address and a wrong code: the verification
            // screen must not become a way to check which emails are registered.
            if (user is null)
                return Result<AuthTokensDto>.Failure("Invalid or expired code.");

            if (user.EmailVerifiedAt is not null)
                return Result<AuthTokensDto>.Failure("Email is already verified.");

            var code = await ConsumeCodeAsync(user.Id, EnumSecurityCodePurpose.AccountVerification, requestDto.Code);
            if (code is null)
                return Result<AuthTokensDto>.Failure("Invalid or expired code.");

            user.EmailVerifiedAt = DateTime.UtcNow;
            await _context.SaveChangesAsync();

            // Deferred from registration: the default categories, subcategories and wallet
            // are created now that the address is proven and the account is really going
            // to be used.
            await SeedUserDataAsync(user.Id, user.PreferredLanguage);

            // Verifying is itself proof of the address, so the user lands logged in
            // instead of being sent back to a login form they just came from.
            return Result<AuthTokensDto>.Success(await CreateAuthResponseAsync(user));
        }

        public async Task ResendVerificationCodeAsync(string email)
        {
            var user = await _context.Users
                .FirstOrDefaultAsync(u => u.Email == email.ToLower().Trim());

            // Unknown address or already-verified account: do nothing, and let the caller
            // answer exactly as it would on success.
            if (user is null || user.EmailVerifiedAt is not null)
                return;

            await IssueCodeAsync(user, EnumSecurityCodePurpose.AccountVerification, VerificationCodeLifetime, respectCooldown: true);
        }

        public async Task<Result<AuthTokensDto>> VerifyTwoFactorAsync(TwoFactorLoginRequestDto requestDto, string? deviceName)
        {
            var challengeHash = HashToken(requestDto.ChallengeToken ?? string.Empty);

            var securityCode = await _context.SecurityCodes
                .Include(c => c.User)
                .FirstOrDefaultAsync(c =>
                    c.ChallengeTokenHash == challengeHash &&
                    c.Purpose == EnumSecurityCodePurpose.TwoFactor &&
                    c.ConsumedAt == null);

            if (securityCode is null || securityCode.ExpiresAt <= DateTime.UtcNow || securityCode.Attempts >= MaxCodeAttempts)
                return Result<AuthTokensDto>.Failure("Invalid or expired code.");

            if (!CodeMatches(securityCode.CodeHash, requestDto.Code))
            {
                securityCode.Attempts++;
                await _context.SaveChangesAsync();
                return Result<AuthTokensDto>.Failure("Invalid or expired code.");
            }

            securityCode.ConsumedAt = DateTime.UtcNow;
            await _context.SaveChangesAsync();

            var tokens = await CreateAuthResponseAsync(securityCode.User);

            if (requestDto.TrustDevice)
                tokens.TrustedDeviceToken = await CreateTrustedDeviceAsync(
                    securityCode.UserId,
                    requestDto.DeviceName ?? deviceName);

            return Result<AuthTokensDto>.Success(tokens);
        }

        public async Task<Result> UpdateTwoFactorAsync(int userId, UpdateTwoFactorRequestDto requestDto)
        {
            var user = await _context.Users.FindAsync(userId);
            if (user is null)
                return Result.Failure("User not found.");

            if (new PasswordHasher<User>().VerifyHashedPassword(user, user.PasswordHash, requestDto.Password) == PasswordVerificationResult.Failed)
                return Result.Failure("Invalid password.");

            user.TwoFactorEnabled = requestDto.Enabled;

            // Turning two-factor off drops the trusted devices with it: they exist only to
            // skip a step that no longer runs, and leaving them would silently re-authorise
            // those devices if it is ever switched back on.
            if (!requestDto.Enabled)
                _context.TrustedDevices.RemoveRange(
                    await _context.TrustedDevices.Where(d => d.UserId == userId).ToListAsync());

            await _context.SaveChangesAsync();
            return Result.Success();
        }

        public async Task<AuthTokensDto?> RefreshTokenAsync(string refreshToken)
        {
            var hashedToken = HashToken(refreshToken);
            var stored = await _context.RefreshTokens
                .Include(r => r.User)
                .FirstOrDefaultAsync(r => r.Token == hashedToken);

            if (stored is null || stored.IsRevoked || stored.ExpiresAt <= DateTime.UtcNow)
                return null;

            // An unverified account must not be able to renew its way around the gate.
            // Login refuses it, but a session that already exists would otherwise keep
            // refreshing itself forever — which is exactly what happens to accounts
            // created before verification existed. Refusing here forces a real login,
            // and that is where the code gets sent.
            if (stored.User.EmailVerifiedAt is null)
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
                Country = user?.Country,
                AnalyticsConfig = prefs.AnalyticsConfig
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

            if (requestDto.AnalyticsConfig is not null)
                prefs.AnalyticsConfig = requestDto.AnalyticsConfig;

            await _context.SaveChangesAsync();

            return new UserPreferencesResponseDto
            {
                CurrencyCode = prefs.CurrencyCode,
                Locale = prefs.Locale,
                Country = user.Country,
                AnalyticsConfig = prefs.AnalyticsConfig
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
                Email = user.Email,
                TwoFactorEnabled = user.TwoFactorEnabled,
                EmailVerified = user.EmailVerifiedAt is not null
            };
        }

        public async Task<UserProfileResponseDto?> UpdateProfileAsync(int userId, UpdateUserProfileRequestDto requestDto)
        {
            var user = await _context.Users.FindAsync(userId);
            if (user is null)
                return null;

            if (!string.IsNullOrWhiteSpace(requestDto.Name))
                user.Name = requestDto.Name.Trim();

            var emailChanged = false;

            if (!string.IsNullOrWhiteSpace(requestDto.Email))
            {
                var normalizedEmail = requestDto.Email.ToLower().Trim();
                if (normalizedEmail != user.Email &&
                    await _context.Users.AnyAsync(u => u.Email == normalizedEmail && u.Id != userId))
                    return null;

                emailChanged = normalizedEmail != user.Email;
                user.Email = normalizedEmail;
            }

            // A new address has proven nothing yet. Clearing the flag keeps the invariant
            // the whole feature rests on — that a verified account can always be recovered
            // through its inbox — and the code goes to the new address immediately so the
            // user can close the loop without hunting for the option.
            if (emailChanged)
                user.EmailVerifiedAt = null;

            await _context.SaveChangesAsync();

            if (emailChanged)
                await IssueCodeAsync(user, EnumSecurityCodePurpose.AccountVerification, VerificationCodeLifetime);

            return new UserProfileResponseDto
            {
                Id = user.Id,
                Name = user.Name,
                Email = user.Email,
                TwoFactorEnabled = user.TwoFactorEnabled,
                EmailVerified = user.EmailVerifiedAt is not null
            };
        }

        public async Task ForgotPasswordAsync(string email)
        {
            var user = await _context.Users.FirstOrDefaultAsync(u => u.Email == email.ToLower().Trim());

            // Unknown address: return quietly. The endpoint answers 200 either way, so
            // this form cannot be used to enumerate registered emails.
            if (user is null)
                return;

            await IssueCodeAsync(user, EnumSecurityCodePurpose.PasswordReset, PasswordResetCodeLifetime, respectCooldown: true);
        }

        public async Task<bool> ResetPasswordAsync(ResetPasswordRequestDto requestDto)
        {
            var user = await _context.Users
                .FirstOrDefaultAsync(u => u.Email == requestDto.Email.ToLower().Trim());

            if (user is null)
                return false;

            var code = await ConsumeCodeAsync(user.Id, EnumSecurityCodePurpose.PasswordReset, requestDto.Code);
            if (code is null)
                return false;

            user.PasswordHash = new PasswordHasher<User>().HashPassword(user, requestDto.NewPassword);

            // Reaching the inbox proves the address, so an unverified account that resets
            // its password is verified by the same act — and therefore needs the seed that
            // verification would have run. Without this it would enter with no categories
            // and no account at all.
            var wasUnverified = user.EmailVerifiedAt is null;
            user.EmailVerifiedAt ??= DateTime.UtcNow;

            // A password reset is the one moment where the account may be being taken back
            // from someone else. Every existing session and every trusted device dies with
            // the old password, otherwise the intruder simply keeps the ones they hold.
            // Loaded and removed rather than bulk-deleted: a single user holds a handful of
            // rows here, and RemoveRange works on every provider the tests run against.
            _context.RefreshTokens.RemoveRange(
                await _context.RefreshTokens.Where(r => r.UserId == user.Id).ToListAsync());
            _context.TrustedDevices.RemoveRange(
                await _context.TrustedDevices.Where(d => d.UserId == user.Id).ToListAsync());

            await _context.SaveChangesAsync();

            if (wasUnverified)
                await SeedUserDataAsync(user.Id, user.PreferredLanguage);

            return true;
        }

        public async Task<bool> LogoutAsync(string refreshToken)
        {
            var hashedToken = HashToken(refreshToken);
            var stored = await _context.RefreshTokens
                .FirstOrDefaultAsync(r => r.Token == hashedToken);

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
            //
            // ExecuteDeleteAsync issues a single bulk DELETE per table — no rows are
            // loaded into the change tracker. The whole wipe + re-seed runs inside one
            // transaction via the execution strategy so it is atomic (all-or-nothing)
            // and safe to retry against a Neon connection that may have gone cold.
            // Order matters: children are deleted before their parents.
            var strategy = _context.Database.CreateExecutionStrategy();
            await strategy.ExecuteAsync(async () =>
            {
                await using var dbTransaction = await _context.Database.BeginTransactionAsync();

                await _context.Transactions.Where(t => t.UserId == userId).ExecuteDeleteAsync();
                await _context.RecurringTransactions.Where(t => t.UserId == userId).ExecuteDeleteAsync();
                await _context.BudgetSubcategoryAllocations
                    .Where(a => _context.Budgets.Any(b => b.Id == a.BudgetId && b.UserId == userId))
                    .ExecuteDeleteAsync();
                await _context.Budgets.Where(b => b.UserId == userId).ExecuteDeleteAsync();
                await _context.Areas.Where(a => a.UserId == userId).ExecuteDeleteAsync();
                await _context.InvestmentDividends.Where(d => d.UserId == userId).ExecuteDeleteAsync();
                await _context.InvestmentTransactions.Where(t => t.UserId == userId).ExecuteDeleteAsync();
                await _context.Investments.Where(i => i.UserId == userId).ExecuteDeleteAsync();
                await _context.Accounts.Where(a => a.UserId == userId).ExecuteDeleteAsync();
                await _context.Goals.Where(g => g.UserId == userId).ExecuteDeleteAsync();
                await _context.SubCategories.Where(s => s.UserId == userId).ExecuteDeleteAsync();
                await _context.Categories.Where(c => c.UserId == userId).ExecuteDeleteAsync();
                await _context.RefreshTokens.Where(r => r.UserId == userId).ExecuteDeleteAsync();

                // Re-seed defaults exactly as RegisterUserAsync does, in the same transaction.
                await SeedUserDataAsync(userId, user.PreferredLanguage);

                await dbTransaction.CommitAsync();
            });

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

            // System transfer category/subcategory (used by goal contributions and transfers)
            var transferCategoryName = preferredLanguage == "pt-BR" ? "Outros" : "Other";
            var transferSubName      = preferredLanguage == "pt-BR" ? "Transferência" : "Transfer";
            var transferCategory = new Category { UserId = userId, Name = transferCategoryName, IsSystem = true };
            _context.Categories.Add(transferCategory);
            await _context.SaveChangesAsync();

            _context.SubCategories.Add(new SubCategory
            {
                UserId     = userId,
                CategoryId = transferCategory.Id,
                Name       = transferSubName,
                IsSystem   = true,
            });
            await _context.SaveChangesAsync();

            // Default categories and subcategories
            foreach (var (categoryName, color, subs) in UserSeedData.GetCategories(preferredLanguage))
            {
                var category = new Category { UserId = userId, Name = categoryName, Color = color, IsSystem = false };
                _context.Categories.Add(category);
                await _context.SaveChangesAsync();

                foreach (var (subName, emoji) in subs)
                {
                    _context.SubCategories.Add(new SubCategory
                    {
                        UserId = userId,
                        CategoryId = category.Id,
                        Name = subName,
                        Emoji = emoji,
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

        private async Task<AuthTokensDto> CreateAuthResponseAsync(User user)
        {
            var accessToken = CreateAccessToken(user);
            var refreshToken = await CreateRefreshTokenAsync(user.Id);

            // AuthTokensDto is an internal transport object — the controller
            // sets the refresh token as an HttpOnly cookie and exposes only
            // the access token in the response body.
            return new AuthTokensDto
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
                Token = HashToken(token),
                ExpiresAt = DateTime.UtcNow.AddDays(30),
                CreatedAt = DateTime.UtcNow
            };

            _context.RefreshTokens.Add(refreshToken);
            await _context.SaveChangesAsync();

            // Return the raw token to the client; only its hash is persisted.
            return token;
        }

        // ── Security codes ────────────────────────────────────────────────────

        /// <summary>
        /// Generates a 6-digit code, supersedes any pending one for the same purpose and
        /// emails it. Delivery failures are not surfaced: the caller's answer has to be
        /// identical whether or not the address exists, so it cannot be probed.
        /// </summary>
        /// <returns>
        /// Whether the user can be expected to have the code. Callers that would otherwise
        /// strand the user on a code screen must check it; the ones that can be probed for
        /// valid addresses must ignore it.
        /// </returns>
        private async Task<bool> IssueCodeAsync(
            User user,
            EnumSecurityCodePurpose purpose,
            TimeSpan lifetime,
            string? challengeToken = null,
            bool respectCooldown = false)
        {
            var now = DateTime.UtcNow;

            var pending = await _context.SecurityCodes
                .Where(c => c.UserId == user.Id && c.Purpose == purpose && c.ConsumedAt == null)
                .ToListAsync();

            // Inside the cooldown the previous code is still live and already in the
            // user's inbox, so this counts as delivered.
            if (respectCooldown && pending.Any(c => c.ExpiresAt > now && c.CreatedAt > now - ResendCooldown))
                return true;

            // At most one live code per purpose. Leaving the old rows around would mean a
            // code the user already abandoned still opens the account, and it would make
            // the attempt counter meaningless — a guesser could just target the newest row.
            _context.SecurityCodes.RemoveRange(pending);

            var code = RandomNumberGenerator.GetInt32(0, 1_000_000).ToString("D6");

            _context.SecurityCodes.Add(new SecurityCode
            {
                UserId = user.Id,
                Purpose = purpose,
                CodeHash = HashCode(code),
                ChallengeTokenHash = challengeToken is null ? null : HashToken(challengeToken),
                ExpiresAt = now.Add(lifetime),
                CreatedAt = now
            });

            await _context.SaveChangesAsync();

            var (subject, html) = EmailTemplates.BuildSecurityCode(
                purpose, code, user.Name, user.PreferredLanguage, (int)lifetime.TotalMinutes);

            return await _emailService.SendAsync(user.Email, subject, html);
        }

        /// <summary>
        /// Validates the live code for a user and purpose and burns it. A wrong code costs
        /// an attempt; running out of attempts kills the code until a new one is requested.
        /// </summary>
        private async Task<SecurityCode?> ConsumeCodeAsync(
            int userId,
            EnumSecurityCodePurpose purpose,
            string? providedCode)
        {
            var now = DateTime.UtcNow;

            var securityCode = await _context.SecurityCodes
                .Where(c => c.UserId == userId && c.Purpose == purpose && c.ConsumedAt == null)
                .OrderByDescending(c => c.Id)
                .FirstOrDefaultAsync();

            if (securityCode is null || securityCode.ExpiresAt <= now || securityCode.Attempts >= MaxCodeAttempts)
                return null;

            if (!CodeMatches(securityCode.CodeHash, providedCode))
            {
                securityCode.Attempts++;
                await _context.SaveChangesAsync();
                return null;
            }

            securityCode.ConsumedAt = now;
            await _context.SaveChangesAsync();
            return securityCode;
        }

        private bool CodeMatches(string storedHash, string? providedCode)
        {
            if (string.IsNullOrWhiteSpace(providedCode))
                return false;

            var providedHash = HashCode(providedCode.Trim());

            // Both sides are 64-char hex of the same HMAC, so the lengths always match and
            // the comparison cannot leak how much of the code was right through timing.
            return CryptographicOperations.FixedTimeEquals(
                Encoding.UTF8.GetBytes(storedHash),
                Encoding.UTF8.GetBytes(providedHash));
        }

        // Codes are only six digits: a plain hash of one falls to a laptop in seconds if
        // the table leaks. Keying the digest with the application secret means the stored
        // rows are worthless without it — the same reason the refresh tokens below can get
        // away with a bare SHA-256, only inverted.
        private string HashCode(string code)
        {
            var key = Encoding.UTF8.GetBytes(_configuration.GetValue<string>("AppSettings:Token")!);
            var hash = HMACSHA256.HashData(key, Encoding.UTF8.GetBytes(code));
            return Convert.ToHexString(hash);
        }

        // ── Trusted devices ───────────────────────────────────────────────────

        private async Task<bool> IsDeviceTrustedAsync(int userId, string? token)
        {
            if (string.IsNullOrWhiteSpace(token))
                return false;

            var hashedToken = HashToken(token);
            var device = await _context.TrustedDevices
                .FirstOrDefaultAsync(d => d.TokenHash == hashedToken && d.UserId == userId);

            if (device is null || device.IsRevoked || device.ExpiresAt <= DateTime.UtcNow)
                return false;

            device.LastUsedAt = DateTime.UtcNow;
            await _context.SaveChangesAsync();
            return true;
        }

        private async Task<string> CreateTrustedDeviceAsync(int userId, string? deviceName)
        {
            var token = CreateOpaqueToken();
            var now = DateTime.UtcNow;

            _context.TrustedDevices.Add(new TrustedDevice
            {
                UserId = userId,
                TokenHash = HashToken(token),
                DeviceName = deviceName is { Length: > 120 } ? deviceName[..120] : deviceName,
                ExpiresAt = now.Add(TrustedDeviceLifetime),
                CreatedAt = now,
                LastUsedAt = now
            });

            await _context.SaveChangesAsync();
            return token;
        }

        // Hex rather than base64: this value travels in a cookie and in mobile storage,
        // where '+' and '/' are a formatting problem waiting to happen.
        private static string CreateOpaqueToken() =>
            Convert.ToHexString(RandomNumberGenerator.GetBytes(32));

        // Refresh, challenge and trusted-device tokens are high-entropy random values, so a
        // fast unsalted SHA-256 is sufficient: we only ever look a token up by its hash, and
        // storing the hash means a database leak does not expose usable tokens.
        private static string HashToken(string token)
        {
            var hash = SHA256.HashData(Encoding.UTF8.GetBytes(token));
            return Convert.ToHexString(hash);
        }
    }
}

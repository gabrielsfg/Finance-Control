using FinanceControl.Domain.Entities;
using FinanceControl.Domain.Interfaces.Service;
using FinanceControl.Services.Services;
using FinanceControl.Shared.Dtos;
using FinanceControl.Shared.Dtos.Request;
using FinanceControl.Shared.Enums;
using FinanceControl.Tests.Helpers;
using Microsoft.AspNetCore.Identity;
using Microsoft.Extensions.Configuration;

namespace FinanceControl.Tests.Unit
{
    public class UserServiceTests
    {
        private const string TokenSecret =
            "super-secret-key-for-testing-purposes-only-must-be-at-least-64-characters-long!!";

        private sealed class FakeEmailService : IEmailService
        {
            public FakeEmailService(bool delivers = true) => Delivers = delivers;

            /// <summary>False mimics a provider that is down — the send is attempted and fails.</summary>
            public bool Delivers { get; }

            public List<(string To, string Subject, string Html)> Sent { get; } = [];

            public Task<bool> SendAsync(string toEmail, string subject, string htmlBody, CancellationToken cancellationToken = default)
            {
                Sent.Add((toEmail, subject, htmlBody));
                return Task.FromResult(Delivers);
            }
        }

        private static UserService CreateService(
            FinanceControl.Data.Data.ApplicationDbContext context,
            IEmailService? emailService = null)
        {
            var config = new ConfigurationBuilder()
                .AddInMemoryCollection(new Dictionary<string, string?>
                {
                    ["AppSettings:Token"] = TokenSecret,
                    ["AppSettings:Issuer"] = "test",
                    ["AppSettings:Audience"] = "test",
                })
                .Build();

            return new UserService(context, config, emailService ?? new FakeEmailService());
        }

        private static User SeedUserWithPassword(
            FinanceControl.Data.Data.ApplicationDbContext context,
            string email,
            string password,
            bool emailVerified = true)
        {
            var user = new User { Email = email, Name = "Test" };
            user.PasswordHash = new PasswordHasher<User>().HashPassword(user, password);
            user.FailedLoginAttempts = 0;
            user.EmailVerifiedAt = emailVerified ? DateTime.UtcNow : null;
            context.Users.Add(user);
            context.SaveChanges();
            return user;
        }

        private static SecurityCode SeedCode(
            FinanceControl.Data.Data.ApplicationDbContext context,
            int userId,
            EnumSecurityCodePurpose purpose,
            string code,
            TimeSpan? expiresIn = null,
            string? challengeToken = null,
            int attempts = 0)
        {
            var securityCode = new SecurityCode
            {
                UserId = userId,
                Purpose = purpose,
                CodeHash = HashCode(code),
                ChallengeTokenHash = challengeToken is null ? null : HashToken(challengeToken),
                ExpiresAt = DateTime.UtcNow.Add(expiresIn ?? TimeSpan.FromMinutes(10)),
                CreatedAt = DateTime.UtcNow,
                Attempts = attempts
            };

            context.SecurityCodes.Add(securityCode);
            context.SaveChanges();
            return securityCode;
        }

        // Mirrors UserService.HashToken: refresh, challenge and trusted-device tokens are
        // stored hashed, so tests must seed the hash of the raw token they then pass in.
        private static string HashToken(string token)
        {
            var hash = System.Security.Cryptography.SHA256.HashData(System.Text.Encoding.UTF8.GetBytes(token));
            return Convert.ToHexString(hash);
        }

        // Mirrors UserService.HashCode: the 6-digit codes are HMAC'd with the app secret,
        // not plain-hashed, so seeding one means keying the digest the same way.
        private static string HashCode(string code)
        {
            var key = System.Text.Encoding.UTF8.GetBytes(TokenSecret);
            var hash = System.Security.Cryptography.HMACSHA256.HashData(key, System.Text.Encoding.UTF8.GetBytes(code));
            return Convert.ToHexString(hash);
        }

        // ── Login ─────────────────────────────────────────────────────────────

        [Fact]
        public async Task UserLogin_WrongPassword_IncreasesFailedAttempts()
        {
            using var context = DbContextHelper.CreateInMemory();
            SeedUserWithPassword(context, "u@test.com", "Correct@1");
            var service = CreateService(context);

            await service.UserLoginAsync(new UserLoginRequestDto { Email = "u@test.com", Password = "Wrong@1" }, null);

            var user = context.Users.Single();
            Assert.Equal(1, user.FailedLoginAttempts);
        }

        [Fact]
        public async Task UserLogin_FiveFailedAttempts_AccountLockedOut()
        {
            using var context = DbContextHelper.CreateInMemory();
            SeedUserWithPassword(context, "u@test.com", "Correct@1");
            var service = CreateService(context);

            for (int i = 0; i < 5; i++)
                await service.UserLoginAsync(new UserLoginRequestDto { Email = "u@test.com", Password = "Wrong@1" }, null);

            var user = context.Users.Single();
            Assert.NotNull(user.LockoutEnd);
            Assert.True(user.LockoutEnd > DateTime.UtcNow);
            Assert.Equal(0, user.FailedLoginAttempts); // reset after lockout
        }

        [Fact]
        public async Task UserLogin_WhileLocked_ReturnsLockedResult()
        {
            using var context = DbContextHelper.CreateInMemory();
            var user = SeedUserWithPassword(context, "u@test.com", "Correct@1");
            user.LockoutEnd = DateTime.UtcNow.AddMinutes(10);
            await context.SaveChangesAsync();

            var service = CreateService(context);

            var result = await service.UserLoginAsync(new UserLoginRequestDto { Email = "u@test.com", Password = "Correct@1" }, null);

            Assert.Null(result.AuthResponse);
            Assert.True(result.IsLockedOut);
        }

        [Fact]
        public async Task UserLogin_CorrectPassword_ResetsFailedAttempts()
        {
            using var context = DbContextHelper.CreateInMemory();
            var user = SeedUserWithPassword(context, "u@test.com", "Correct@1");
            user.FailedLoginAttempts = 3;
            await context.SaveChangesAsync();

            var service = CreateService(context);
            var result = await service.UserLoginAsync(new UserLoginRequestDto { Email = "u@test.com", Password = "Correct@1" }, null);

            var updated = context.Users.Single();
            Assert.Equal(0, updated.FailedLoginAttempts);
            Assert.Null(updated.LockoutEnd);
            Assert.NotNull(result.AuthResponse);
        }

        [Fact]
        public async Task UserLogin_UnverifiedEmail_ReturnsChallengeAndSendsCode()
        {
            using var context = DbContextHelper.CreateInMemory();
            SeedUserWithPassword(context, "u@test.com", "Correct@1", emailVerified: false);

            var email = new FakeEmailService();
            var service = CreateService(context, email);

            var result = await service.UserLoginAsync(new UserLoginRequestDto { Email = "u@test.com", Password = "Correct@1" }, null);

            Assert.Null(result.AuthResponse);
            Assert.Equal(EnumLoginChallenge.EmailNotVerified, result.Challenge);
            Assert.Single(email.Sent);
            Assert.Single(context.SecurityCodes.Where(c => c.Purpose == EnumSecurityCodePurpose.AccountVerification));
        }

        [Fact]
        public async Task UserLogin_TwoFactorEnabled_ReturnsChallengeToken()
        {
            using var context = DbContextHelper.CreateInMemory();
            var user = SeedUserWithPassword(context, "u@test.com", "Correct@1");
            user.TwoFactorEnabled = true;
            await context.SaveChangesAsync();

            var email = new FakeEmailService();
            var service = CreateService(context, email);

            var result = await service.UserLoginAsync(new UserLoginRequestDto { Email = "u@test.com", Password = "Correct@1" }, null);

            Assert.Null(result.AuthResponse);
            Assert.Equal(EnumLoginChallenge.TwoFactorRequired, result.Challenge);
            Assert.False(string.IsNullOrWhiteSpace(result.ChallengeToken));
            Assert.Single(email.Sent);
        }

        [Fact]
        public async Task UserLogin_TwoFactorEnabled_EmailFails_ReportsDeliveryFailure()
        {
            using var context = DbContextHelper.CreateInMemory();
            var user = SeedUserWithPassword(context, "u@test.com", "Correct@1");
            user.TwoFactorEnabled = true;
            await context.SaveChangesAsync();

            var service = CreateService(context, new FakeEmailService(delivers: false));

            var result = await service.UserLoginAsync(
                new UserLoginRequestDto { Email = "u@test.com", Password = "Correct@1" }, null);

            // Handing back a challenge here would park the user on a code screen that has
            // no resend, waiting for an email that never left.
            Assert.True(result.EmailDeliveryFailed);
            Assert.Null(result.Challenge);
            Assert.Null(result.ChallengeToken);
            Assert.Null(result.AuthResponse);
        }

        [Fact]
        public async Task UserLogin_TwoFactorEnabled_TrustedDevice_SkipsChallenge()
        {
            using var context = DbContextHelper.CreateInMemory();
            var user = SeedUserWithPassword(context, "u@test.com", "Correct@1");
            user.TwoFactorEnabled = true;
            context.TrustedDevices.Add(new TrustedDevice
            {
                UserId = user.Id,
                TokenHash = HashToken("device-token"),
                ExpiresAt = DateTime.UtcNow.AddDays(30),
                CreatedAt = DateTime.UtcNow,
                LastUsedAt = DateTime.UtcNow
            });
            await context.SaveChangesAsync();

            var service = CreateService(context);

            var result = await service.UserLoginAsync(
                new UserLoginRequestDto { Email = "u@test.com", Password = "Correct@1" }, "device-token");

            Assert.NotNull(result.AuthResponse);
            Assert.Null(result.Challenge);
        }

        [Fact]
        public async Task UserLogin_TwoFactorEnabled_ExpiredTrustedDevice_StillChallenges()
        {
            using var context = DbContextHelper.CreateInMemory();
            var user = SeedUserWithPassword(context, "u@test.com", "Correct@1");
            user.TwoFactorEnabled = true;
            context.TrustedDevices.Add(new TrustedDevice
            {
                UserId = user.Id,
                TokenHash = HashToken("device-token"),
                ExpiresAt = DateTime.UtcNow.AddDays(-1),
                CreatedAt = DateTime.UtcNow.AddDays(-31),
                LastUsedAt = DateTime.UtcNow.AddDays(-2)
            });
            await context.SaveChangesAsync();

            var service = CreateService(context);

            var result = await service.UserLoginAsync(
                new UserLoginRequestDto { Email = "u@test.com", Password = "Correct@1" }, "device-token");

            Assert.Equal(EnumLoginChallenge.TwoFactorRequired, result.Challenge);
        }

        // ── Registration and seeding ──────────────────────────────────────────

        [Fact]
        public async Task Register_DoesNotSeedBeforeVerification()
        {
            using var context = DbContextHelper.CreateInMemory();
            var email = new FakeEmailService();
            var service = CreateService(context, email);

            var result = await service.RegisterUserAsync(new CreateUserRequestDto
            {
                Name = "Test",
                Email = "u@test.com",
                Password = "Correct@1"
            });

            Assert.True(result.IsSuccess);
            Assert.Single(context.Users);
            Assert.Single(context.SecurityCodes);
            Assert.Single(email.Sent);

            // An abandoned signup must not leave a seeded account behind.
            Assert.Empty(context.Categories);
            Assert.Empty(context.SubCategories);
            Assert.Empty(context.Accounts);
        }

        [Fact]
        public async Task VerifyEmail_SeedsDefaultCategoriesAndAccount()
        {
            using var context = DbContextHelper.CreateInMemory();
            var user = SeedUserWithPassword(context, "u@test.com", "Correct@1", emailVerified: false);
            SeedCode(context, user.Id, EnumSecurityCodePurpose.AccountVerification, "123456");

            var service = CreateService(context);
            await service.VerifyEmailAsync(new VerifyEmailRequestDto { Email = "u@test.com", Code = "123456" });

            Assert.NotEmpty(context.Categories);
            Assert.NotEmpty(context.SubCategories);
            Assert.Single(context.Accounts);
        }

        [Fact]
        public async Task ResetPassword_OnUnverifiedAccount_VerifiesAndSeeds()
        {
            using var context = DbContextHelper.CreateInMemory();
            var user = SeedUserWithPassword(context, "u@test.com", "OldPass@1", emailVerified: false);
            SeedCode(context, user.Id, EnumSecurityCodePurpose.PasswordReset, "111222");

            var service = CreateService(context);
            await service.ResetPasswordAsync(new ResetPasswordRequestDto
            {
                Email = "u@test.com",
                Code = "111222",
                NewPassword = "NewPass@1"
            });

            // Reaching the inbox proved the address, so the seed that verification would
            // have run has to happen here too — otherwise the user enters an empty app.
            Assert.NotNull(context.Users.Single().EmailVerifiedAt);
            Assert.NotEmpty(context.Categories);
            Assert.Single(context.Accounts);
        }

        // ── Refresh ───────────────────────────────────────────────────────────

        [Fact]
        public async Task RefreshToken_UnverifiedUser_IsRefused()
        {
            using var context = DbContextHelper.CreateInMemory();
            var user = SeedUserWithPassword(context, "u@test.com", "Correct@1", emailVerified: false);
            context.RefreshTokens.Add(new RefreshToken
            {
                UserId = user.Id,
                Token = HashToken("raw-token"),
                ExpiresAt = DateTime.UtcNow.AddDays(30),
                CreatedAt = DateTime.UtcNow
            });
            await context.SaveChangesAsync();

            var service = CreateService(context);
            var result = await service.RefreshTokenAsync("raw-token");

            // Otherwise a session predating verification renews itself forever.
            Assert.Null(result);
        }

        [Fact]
        public async Task RefreshToken_VerifiedUser_ReturnsNewTokens()
        {
            using var context = DbContextHelper.CreateInMemory();
            var user = SeedUserWithPassword(context, "u@test.com", "Correct@1");
            context.RefreshTokens.Add(new RefreshToken
            {
                UserId = user.Id,
                Token = HashToken("raw-token"),
                ExpiresAt = DateTime.UtcNow.AddDays(30),
                CreatedAt = DateTime.UtcNow
            });
            await context.SaveChangesAsync();

            var service = CreateService(context);
            var result = await service.RefreshTokenAsync("raw-token");

            Assert.NotNull(result);
            Assert.False(string.IsNullOrWhiteSpace(result!.AccessToken));
        }

        // ── Email verification ────────────────────────────────────────────────

        [Fact]
        public async Task VerifyEmail_ValidCode_MarksVerifiedAndReturnsTokens()
        {
            using var context = DbContextHelper.CreateInMemory();
            var user = SeedUserWithPassword(context, "u@test.com", "Correct@1", emailVerified: false);
            SeedCode(context, user.Id, EnumSecurityCodePurpose.AccountVerification, "123456");

            var service = CreateService(context);
            var result = await service.VerifyEmailAsync(new VerifyEmailRequestDto { Email = "u@test.com", Code = "123456" });

            Assert.True(result.IsSuccess);
            Assert.NotNull(context.Users.Single().EmailVerifiedAt);
            Assert.NotNull(context.SecurityCodes.Single().ConsumedAt);
        }

        [Fact]
        public async Task VerifyEmail_WrongCode_CountsAttemptAndFails()
        {
            using var context = DbContextHelper.CreateInMemory();
            var user = SeedUserWithPassword(context, "u@test.com", "Correct@1", emailVerified: false);
            SeedCode(context, user.Id, EnumSecurityCodePurpose.AccountVerification, "123456");

            var service = CreateService(context);
            var result = await service.VerifyEmailAsync(new VerifyEmailRequestDto { Email = "u@test.com", Code = "000000" });

            Assert.True(result.IsFailure);
            Assert.Null(context.Users.Single().EmailVerifiedAt);
            Assert.Equal(1, context.SecurityCodes.Single().Attempts);
        }

        [Fact]
        public async Task VerifyEmail_CodeOutOfAttempts_FailsEvenWhenCorrect()
        {
            using var context = DbContextHelper.CreateInMemory();
            var user = SeedUserWithPassword(context, "u@test.com", "Correct@1", emailVerified: false);
            SeedCode(context, user.Id, EnumSecurityCodePurpose.AccountVerification, "123456", attempts: 5);

            var service = CreateService(context);
            var result = await service.VerifyEmailAsync(new VerifyEmailRequestDto { Email = "u@test.com", Code = "123456" });

            Assert.True(result.IsFailure);
            Assert.Null(context.Users.Single().EmailVerifiedAt);
        }

        [Fact]
        public async Task VerifyEmail_ExpiredCode_Fails()
        {
            using var context = DbContextHelper.CreateInMemory();
            var user = SeedUserWithPassword(context, "u@test.com", "Correct@1", emailVerified: false);
            SeedCode(context, user.Id, EnumSecurityCodePurpose.AccountVerification, "123456", expiresIn: TimeSpan.FromMinutes(-1));

            var service = CreateService(context);
            var result = await service.VerifyEmailAsync(new VerifyEmailRequestDto { Email = "u@test.com", Code = "123456" });

            Assert.True(result.IsFailure);
            Assert.Null(context.Users.Single().EmailVerifiedAt);
        }

        // ── Two-factor ────────────────────────────────────────────────────────

        [Fact]
        public async Task VerifyTwoFactor_ValidCode_ReturnsTokens()
        {
            using var context = DbContextHelper.CreateInMemory();
            var user = SeedUserWithPassword(context, "u@test.com", "Correct@1");
            user.TwoFactorEnabled = true;
            await context.SaveChangesAsync();
            SeedCode(context, user.Id, EnumSecurityCodePurpose.TwoFactor, "654321", challengeToken: "challenge");

            var service = CreateService(context);
            var result = await service.VerifyTwoFactorAsync(
                new TwoFactorLoginRequestDto { ChallengeToken = "challenge", Code = "654321" }, null);

            Assert.True(result.IsSuccess);
            Assert.Null(result.Value!.TrustedDeviceToken); // not requested
        }

        [Fact]
        public async Task VerifyTwoFactor_TrustDevice_CreatesDeviceAndReturnsToken()
        {
            using var context = DbContextHelper.CreateInMemory();
            var user = SeedUserWithPassword(context, "u@test.com", "Correct@1");
            user.TwoFactorEnabled = true;
            await context.SaveChangesAsync();
            SeedCode(context, user.Id, EnumSecurityCodePurpose.TwoFactor, "654321", challengeToken: "challenge");

            var service = CreateService(context);
            var result = await service.VerifyTwoFactorAsync(
                new TwoFactorLoginRequestDto { ChallengeToken = "challenge", Code = "654321", TrustDevice = true },
                "Test Browser");

            Assert.True(result.IsSuccess);
            Assert.False(string.IsNullOrWhiteSpace(result.Value!.TrustedDeviceToken));

            var device = context.TrustedDevices.Single();
            Assert.Equal(HashToken(result.Value.TrustedDeviceToken!), device.TokenHash);
            Assert.Equal("Test Browser", device.DeviceName);
        }

        [Fact]
        public async Task VerifyTwoFactor_WrongChallengeToken_Fails()
        {
            using var context = DbContextHelper.CreateInMemory();
            var user = SeedUserWithPassword(context, "u@test.com", "Correct@1");
            SeedCode(context, user.Id, EnumSecurityCodePurpose.TwoFactor, "654321", challengeToken: "challenge");

            var service = CreateService(context);
            var result = await service.VerifyTwoFactorAsync(
                new TwoFactorLoginRequestDto { ChallengeToken = "not-the-challenge", Code = "654321" }, null);

            Assert.True(result.IsFailure);
        }

        [Fact]
        public async Task UpdateTwoFactor_Disabling_DropsTrustedDevices()
        {
            using var context = DbContextHelper.CreateInMemory();
            var user = SeedUserWithPassword(context, "u@test.com", "Correct@1");
            user.TwoFactorEnabled = true;
            context.TrustedDevices.Add(new TrustedDevice
            {
                UserId = user.Id,
                TokenHash = HashToken("device-token"),
                ExpiresAt = DateTime.UtcNow.AddDays(30),
                CreatedAt = DateTime.UtcNow,
                LastUsedAt = DateTime.UtcNow
            });
            await context.SaveChangesAsync();

            var service = CreateService(context);
            var result = await service.UpdateTwoFactorAsync(
                user.Id, new UpdateTwoFactorRequestDto { Enabled = false, Password = "Correct@1" });

            Assert.True(result.IsSuccess);
            Assert.False(context.Users.Single().TwoFactorEnabled);
            Assert.Empty(context.TrustedDevices);
        }

        [Fact]
        public async Task UpdateTwoFactor_WrongPassword_Fails()
        {
            using var context = DbContextHelper.CreateInMemory();
            var user = SeedUserWithPassword(context, "u@test.com", "Correct@1");

            var service = CreateService(context);
            var result = await service.UpdateTwoFactorAsync(
                user.Id, new UpdateTwoFactorRequestDto { Enabled = true, Password = "Wrong@1" });

            Assert.True(result.IsFailure);
            Assert.False(context.Users.Single().TwoFactorEnabled);
        }

        // ── Password reset ────────────────────────────────────────────────────

        [Fact]
        public async Task ResetPassword_ValidCode_UpdatesPasswordAndConsumesCode()
        {
            using var context = DbContextHelper.CreateInMemory();
            var user = SeedUserWithPassword(context, "u@test.com", "OldPass@1");
            SeedCode(context, user.Id, EnumSecurityCodePurpose.PasswordReset, "111222");

            var service = CreateService(context);
            var result = await service.ResetPasswordAsync(new ResetPasswordRequestDto
            {
                Email = "u@test.com",
                Code = "111222",
                NewPassword = "NewPass@1"
            });

            Assert.True(result);
            var updated = context.Users.Single();
            Assert.NotNull(context.SecurityCodes.Single().ConsumedAt);

            var verify = new PasswordHasher<User>().VerifyHashedPassword(updated, updated.PasswordHash, "NewPass@1");
            Assert.Equal(PasswordVerificationResult.Success, verify);
        }

        [Fact]
        public async Task ResetPassword_RevokesSessionsAndTrustedDevices()
        {
            using var context = DbContextHelper.CreateInMemory();
            var user = SeedUserWithPassword(context, "u@test.com", "OldPass@1");
            SeedCode(context, user.Id, EnumSecurityCodePurpose.PasswordReset, "111222");
            context.RefreshTokens.Add(new RefreshToken
            {
                UserId = user.Id,
                Token = HashToken("old-session"),
                ExpiresAt = DateTime.UtcNow.AddDays(30),
                CreatedAt = DateTime.UtcNow
            });
            context.TrustedDevices.Add(new TrustedDevice
            {
                UserId = user.Id,
                TokenHash = HashToken("device-token"),
                ExpiresAt = DateTime.UtcNow.AddDays(30),
                CreatedAt = DateTime.UtcNow,
                LastUsedAt = DateTime.UtcNow
            });
            await context.SaveChangesAsync();

            var service = CreateService(context);
            await service.ResetPasswordAsync(new ResetPasswordRequestDto
            {
                Email = "u@test.com",
                Code = "111222",
                NewPassword = "NewPass@1"
            });

            Assert.Empty(context.RefreshTokens);
            Assert.Empty(context.TrustedDevices);
        }

        [Fact]
        public async Task ResetPassword_ExpiredCode_ReturnsFalse()
        {
            using var context = DbContextHelper.CreateInMemory();
            var user = SeedUserWithPassword(context, "u@test.com", "OldPass@1");
            SeedCode(context, user.Id, EnumSecurityCodePurpose.PasswordReset, "111222", expiresIn: TimeSpan.FromMinutes(-1));

            var service = CreateService(context);
            var result = await service.ResetPasswordAsync(new ResetPasswordRequestDto
            {
                Email = "u@test.com",
                Code = "111222",
                NewPassword = "NewPass@1"
            });

            Assert.False(result);
        }

        [Fact]
        public async Task ResetPassword_NoCodeIssued_ReturnsFalse()
        {
            using var context = DbContextHelper.CreateInMemory();
            SeedUserWithPassword(context, "u@test.com", "OldPass@1");

            var service = CreateService(context);
            var result = await service.ResetPasswordAsync(new ResetPasswordRequestDto
            {
                Email = "u@test.com",
                Code = "111222",
                NewPassword = "NewPass@1"
            });

            Assert.False(result);
        }

        [Fact]
        public async Task ForgotPassword_WithinCooldown_DoesNotSendASecondCode()
        {
            using var context = DbContextHelper.CreateInMemory();
            SeedUserWithPassword(context, "u@test.com", "OldPass@1");

            var email = new FakeEmailService();
            var service = CreateService(context, email);

            await service.ForgotPasswordAsync("u@test.com");
            await service.ForgotPasswordAsync("u@test.com");

            Assert.Single(email.Sent);
            Assert.Single(context.SecurityCodes);
        }

        [Fact]
        public async Task ForgotPassword_UnknownEmail_DoesNothing()
        {
            using var context = DbContextHelper.CreateInMemory();

            var email = new FakeEmailService();
            var service = CreateService(context, email);

            await service.ForgotPasswordAsync("nobody@test.com");

            Assert.Empty(email.Sent);
            Assert.Empty(context.SecurityCodes);
        }
    }
}

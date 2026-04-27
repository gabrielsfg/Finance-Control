using FinanceControl.Domain.Entities;
using FinanceControl.Services.Services;
using FinanceControl.Shared.Dtos.Request;
using FinanceControl.Tests.Helpers;
using Microsoft.AspNetCore.Identity;
using Microsoft.Extensions.Configuration;

namespace FinanceControl.Tests.Unit
{
    public class UserServiceTests
    {
        private static UserService CreateService(FinanceControl.Data.Data.ApplicationDbContext context)
        {
            var config = new ConfigurationBuilder()
                .AddInMemoryCollection(new Dictionary<string, string?>
                {
                    ["AppSettings:Token"] = "super-secret-key-for-testing-purposes-only-must-be-at-least-64-characters-long!!",
                    ["AppSettings:Issuer"] = "test",
                    ["AppSettings:Audience"] = "test",
                })
                .Build();

            return new UserService(context, config);
        }

        private static User SeedUserWithPassword(FinanceControl.Data.Data.ApplicationDbContext context, string email, string password)
        {
            var user = new User { Email = email, Name = "Test" };
            user.PasswordHash = new PasswordHasher<User>().HashPassword(user, password);
            user.FailedLoginAttempts = 0;
            context.Users.Add(user);
            context.SaveChanges();
            return user;
        }

        [Fact]
        public async Task UserLogin_WrongPassword_IncreasesFailedAttempts()
        {
            using var context = DbContextHelper.CreateInMemory();
            SeedUserWithPassword(context, "u@test.com", "Correct@1");
            var service = CreateService(context);

            await service.UserLoginAsync(new UserLoginRequestDto { Email = "u@test.com", Password = "Wrong@1" });

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
                await service.UserLoginAsync(new UserLoginRequestDto { Email = "u@test.com", Password = "Wrong@1" });

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

            var result = await service.UserLoginAsync(new UserLoginRequestDto { Email = "u@test.com", Password = "Correct@1" });

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
            await service.UserLoginAsync(new UserLoginRequestDto { Email = "u@test.com", Password = "Correct@1" });

            var updated = context.Users.Single();
            Assert.Equal(0, updated.FailedLoginAttempts);
            Assert.Null(updated.LockoutEnd);
        }

        [Fact]
        public async Task ResetPassword_ValidToken_UpdatesPasswordAndClearsToken()
        {
            using var context = DbContextHelper.CreateInMemory();
            var user = SeedUserWithPassword(context, "u@test.com", "OldPass@1");
            user.PasswordResetToken = "valid-token";
            user.PasswordResetTokenExpiresAt = DateTime.UtcNow.AddHours(1);
            await context.SaveChangesAsync();

            var service = CreateService(context);
            var result = await service.ResetPasswordAsync("valid-token", "NewPass@1");

            Assert.True(result);
            var updated = context.Users.Single();
            Assert.Null(updated.PasswordResetToken);
            Assert.Null(updated.PasswordResetTokenExpiresAt);

            // Verify new password works
            var verify = new PasswordHasher<User>().VerifyHashedPassword(updated, updated.PasswordHash, "NewPass@1");
            Assert.Equal(PasswordVerificationResult.Success, verify);
        }

        [Fact]
        public async Task ResetPassword_ExpiredToken_ReturnsFalse()
        {
            using var context = DbContextHelper.CreateInMemory();
            var user = SeedUserWithPassword(context, "u@test.com", "OldPass@1");
            user.PasswordResetToken = "expired-token";
            user.PasswordResetTokenExpiresAt = DateTime.UtcNow.AddHours(-1); // expired
            await context.SaveChangesAsync();

            var service = CreateService(context);
            var result = await service.ResetPasswordAsync("expired-token", "NewPass@1");

            Assert.False(result);
        }

        [Fact]
        public async Task ResetPassword_InvalidToken_ReturnsFalse()
        {
            using var context = DbContextHelper.CreateInMemory();
            SeedUserWithPassword(context, "u@test.com", "OldPass@1");

            var service = CreateService(context);
            var result = await service.ResetPasswordAsync("nonexistent-token", "NewPass@1");

            Assert.False(result);
        }
    }
}

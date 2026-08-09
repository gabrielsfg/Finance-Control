using System.Text.Json;
using FinanceControl.Domain.Entities;
using FinanceControl.Services.Services;
using FinanceControl.Shared.Enums;
using FinanceControl.Tests.Helpers;

namespace FinanceControl.Tests.Unit
{
    public class DataExportServiceTests
    {
        private const string PasswordHashMarker = "HASH-THAT-MUST-NEVER-LEAVE-THE-DATABASE";

        private static User SeedUserWithData(
            FinanceControl.Data.Data.ApplicationDbContext context,
            string email,
            string accountName,
            string transactionDescription)
        {
            var user = new User { Email = email, Name = email, PasswordHash = PasswordHashMarker };
            context.Users.Add(user);
            context.SaveChanges();

            var account = new Account { UserId = user.Id, Name = accountName, Type = EnumAccountType.Cash };
            var category = new Category { UserId = user.Id, Name = $"Category of {email}" };
            context.Accounts.Add(account);
            context.Categories.Add(category);
            context.SaveChanges();

            var subCategory = new SubCategory
            {
                UserId = user.Id,
                CategoryId = category.Id,
                Name = $"SubCategory of {email}"
            };
            context.SubCategories.Add(subCategory);
            context.SaveChanges();

            context.Transactions.Add(new Transaction
            {
                UserId = user.Id,
                AccountId = account.Id,
                SubCategoryId = subCategory.Id,
                Description = transactionDescription,
                Value = 1234,
                Type = EnumTransactionType.Expense,
                PaymentType = EnumPaymentType.OneTime,
                TransactionDate = new DateOnly(2026, 1, 15)
            });
            context.SaveChanges();

            return user;
        }

        [Fact]
        public async Task Export_ContainsOnlyTheRequestingUsersData()
        {
            using var context = DbContextHelper.CreateInMemory();
            var mine = SeedUserWithData(context, "mine@test.com", "My wallet", "My lunch");
            SeedUserWithData(context, "theirs@test.com", "Their wallet", "Their lunch");

            var export = await new DataExportService(context).ExportUserDataAsync(mine.Id);

            Assert.NotNull(export);
            Assert.Equal("mine@test.com", export!.Profile.Email);

            Assert.Single(export.Accounts);
            Assert.Equal("My wallet", export.Accounts[0].Name);

            Assert.Single(export.Transactions);
            Assert.Equal("My lunch", export.Transactions[0].Description);

            Assert.Single(export.Categories);
            Assert.Single(export.Categories[0].SubCategories);

            // The cheapest check that nothing leaked in through a join: the other user's
            // strings must not appear anywhere in the document.
            var json = JsonSerializer.Serialize(export);
            Assert.DoesNotContain("theirs@test.com", json);
            Assert.DoesNotContain("Their wallet", json);
            Assert.DoesNotContain("Their lunch", json);
        }

        /// <summary>
        /// Guards the one mistake that would matter here: an entity being serialised
        /// directly instead of projected, taking the password hash with it.
        /// </summary>
        [Fact]
        public async Task Export_NeverIncludesSecretMaterial()
        {
            using var context = DbContextHelper.CreateInMemory();
            var user = SeedUserWithData(context, "u@test.com", "Wallet", "Lunch");

            context.RefreshTokens.Add(new RefreshToken
            {
                UserId = user.Id,
                Token = "REFRESH-TOKEN-THAT-MUST-NEVER-LEAVE-THE-DATABASE",
                ExpiresAt = DateTime.UtcNow.AddDays(7)
            });
            context.SecurityCodes.Add(new SecurityCode
            {
                UserId = user.Id,
                Purpose = EnumSecurityCodePurpose.AccountVerification,
                CodeHash = "CODE-HASH-THAT-MUST-NEVER-LEAVE-THE-DATABASE",
                ExpiresAt = DateTime.UtcNow.AddMinutes(15)
            });
            context.SaveChanges();

            var export = await new DataExportService(context).ExportUserDataAsync(user.Id);
            var json = JsonSerializer.Serialize(export);

            Assert.DoesNotContain(PasswordHashMarker, json);
            Assert.DoesNotContain("REFRESH-TOKEN-THAT-MUST-NEVER-LEAVE-THE-DATABASE", json);
            Assert.DoesNotContain("CODE-HASH-THAT-MUST-NEVER-LEAVE-THE-DATABASE", json);
        }

        [Fact]
        public async Task Export_IncludesTheConsentTrail()
        {
            using var context = DbContextHelper.CreateInMemory();
            var user = SeedUserWithData(context, "u@test.com", "Wallet", "Lunch");

            var document = new LegalDocument
            {
                Type = EnumLegalDocumentType.TermsOfUse,
                Version = 3,
                Content = "terms v3",
                ContentHash = "hash-terms-v3",
                PublishedAt = DateTime.UtcNow
            };
            context.LegalDocuments.Add(document);
            context.SaveChanges();

            context.UserConsents.Add(new UserConsent
            {
                UserId = user.Id,
                LegalDocumentId = document.Id,
                AcceptedAt = new DateTime(2026, 3, 1, 12, 0, 0, DateTimeKind.Utc),
                IpAddress = "203.0.113.7",
                UserAgent = "test-agent"
            });
            context.SaveChanges();

            var export = await new DataExportService(context).ExportUserDataAsync(user.Id);

            var consent = Assert.Single(export!.Consents);
            Assert.Equal(EnumLegalDocumentType.TermsOfUse, consent.DocumentType);
            Assert.Equal(3, consent.DocumentVersion);
            Assert.Equal("hash-terms-v3", consent.DocumentHash);
            Assert.Equal("203.0.113.7", consent.IpAddress);
        }

        [Fact]
        public async Task Export_ReturnsNullForAnUnknownUser()
        {
            using var context = DbContextHelper.CreateInMemory();

            Assert.Null(await new DataExportService(context).ExportUserDataAsync(999));
        }
    }
}

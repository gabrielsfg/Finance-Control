using FinanceControl.Domain.Entities;
using FinanceControl.Services.Seeds;
using FinanceControl.Shared.Enums;
using FinanceControl.Tests.Helpers;
using Microsoft.Extensions.Logging.Abstractions;

namespace FinanceControl.Tests.Unit
{
    public class LegalDocumentSeederTests
    {
        private static LegalDocumentSeeder CreateSeeder(FinanceControl.Data.Data.ApplicationDbContext context) =>
            new(context, NullLogger<LegalDocumentSeeder>.Instance);

        [Fact]
        public async Task Seed_PublishesTheDocumentsShippedWithTheAssembly()
        {
            using var context = DbContextHelper.CreateInMemory();

            await CreateSeeder(context).SeedAsync();

            var documents = context.LegalDocuments.ToList();

            Assert.Contains(documents, d => d.Type == EnumLegalDocumentType.PrivacyPolicy);
            Assert.Contains(documents, d => d.Type == EnumLegalDocumentType.TermsOfUse);
            Assert.All(documents, d => Assert.False(string.IsNullOrWhiteSpace(d.Content)));
            Assert.All(documents, d => Assert.Equal(64, d.ContentHash.Length));
        }

        [Fact]
        public async Task Seed_IsIdempotent()
        {
            using var context = DbContextHelper.CreateInMemory();

            await CreateSeeder(context).SeedAsync();
            var firstRun = context.LegalDocuments.Select(d => d.ContentHash).OrderBy(h => h).ToList();

            await CreateSeeder(context).SeedAsync();
            var secondRun = context.LegalDocuments.Select(d => d.ContentHash).OrderBy(h => h).ToList();

            Assert.Equal(firstRun, secondRun);
        }

        /// <summary>
        /// The draft case: the placeholder text is still being iterated on and nobody has
        /// accepted it, so rewriting it in place is allowed.
        /// </summary>
        [Fact]
        public async Task Seed_RewritesAnUnsignedVersionWhenTheTextChanges()
        {
            using var context = DbContextHelper.CreateInMemory();
            context.LegalDocuments.Add(new LegalDocument
            {
                Type = EnumLegalDocumentType.PrivacyPolicy,
                Version = 1,
                Content = "an older draft",
                ContentHash = "stale-hash",
                PublishedAt = DateTime.UtcNow.AddDays(-1)
            });
            context.SaveChanges();

            await CreateSeeder(context).SeedAsync();

            var stored = context.LegalDocuments
                .Single(d => d.Type == EnumLegalDocumentType.PrivacyPolicy && d.Version == 1);

            Assert.NotEqual("stale-hash", stored.ContentHash);
            Assert.NotEqual("an older draft", stored.Content);
        }

        /// <summary>
        /// The whole point of the table: once someone has signed a version, its text can
        /// never move under them again.
        /// </summary>
        [Fact]
        public async Task Seed_RefusesToRewriteAVersionSomeoneAlreadySigned()
        {
            using var context = DbContextHelper.CreateInMemory();

            var user = new User { Email = "u@test.com", Name = "Test", PasswordHash = "x" };
            context.Users.Add(user);

            var document = new LegalDocument
            {
                Type = EnumLegalDocumentType.PrivacyPolicy,
                Version = 1,
                Content = "the text that was accepted",
                ContentHash = "hash-of-the-accepted-text",
                PublishedAt = DateTime.UtcNow.AddDays(-1)
            };
            context.LegalDocuments.Add(document);
            context.SaveChanges();

            context.UserConsents.Add(new UserConsent
            {
                UserId = user.Id,
                LegalDocumentId = document.Id,
                AcceptedAt = DateTime.UtcNow.AddDays(-1)
            });
            context.SaveChanges();

            var exception = await Assert.ThrowsAsync<InvalidOperationException>(
                () => CreateSeeder(context).SeedAsync());

            Assert.Contains("immutable", exception.Message);

            var stored = context.LegalDocuments
                .Single(d => d.Type == EnumLegalDocumentType.PrivacyPolicy && d.Version == 1);
            Assert.Equal("the text that was accepted", stored.Content);
        }
    }
}

using FinanceControl.Data.Data;
using FinanceControl.Domain.Entities;
using FinanceControl.Services.Services;
using FinanceControl.Shared.Dtos.Request;
using FinanceControl.Shared.Enums;
using FinanceControl.Tests.Helpers;

namespace FinanceControl.Tests.Unit
{
    public class LegalServiceTests
    {
        private const int UserId = 1;

        private static LegalDocument AddDocument(ApplicationDbContext context, EnumLegalDocumentType type, int version)
        {
            var document = new LegalDocument
            {
                Type = type,
                Version = version,
                Content = $"{type} v{version}",
                ContentHash = new string('a', 64),
                PublishedAt = DateTime.UtcNow
            };
            context.LegalDocuments.Add(document);
            context.SaveChanges();
            return document;
        }

        private static AcceptLegalDocumentsRequestDto Request(params (EnumLegalDocumentType Type, int Version)[] documents) => new()
        {
            Documents = documents
                .Select(d => new AcceptLegalDocumentItemRequestDto { Type = d.Type, Version = d.Version })
                .ToList()
        };

        [Fact]
        public async Task GetPending_IsEmptyRightAfterRegistrationConsent()
        {
            using var context = DbContextHelper.CreateInMemory();
            AddDocument(context, EnumLegalDocumentType.TermsOfUse, 1);
            AddDocument(context, EnumLegalDocumentType.PrivacyPolicy, 1);
            var service = new LegalService(context);

            await service.RecordConsentAsync(UserId, "127.0.0.1", "test-agent");

            Assert.Empty(await service.GetPendingDocumentsAsync(UserId));
        }

        [Fact]
        public async Task GetPending_ListsOnlyTheDocumentWithANewVersion()
        {
            using var context = DbContextHelper.CreateInMemory();
            AddDocument(context, EnumLegalDocumentType.TermsOfUse, 1);
            AddDocument(context, EnumLegalDocumentType.PrivacyPolicy, 1);
            var service = new LegalService(context);
            await service.RecordConsentAsync(UserId, null, null);

            AddDocument(context, EnumLegalDocumentType.TermsOfUse, 2);

            var pending = await service.GetPendingDocumentsAsync(UserId);

            var document = Assert.Single(pending);
            Assert.Equal(EnumLegalDocumentType.TermsOfUse, document.Type);
            Assert.Equal(2, document.Version);
            Assert.Equal("Termos de Uso", document.Title);
        }

        [Fact]
        public async Task Accept_RecordsConsentWithTheCircumstancesOfTheSignature()
        {
            using var context = DbContextHelper.CreateInMemory();
            AddDocument(context, EnumLegalDocumentType.TermsOfUse, 1);
            var current = AddDocument(context, EnumLegalDocumentType.TermsOfUse, 2);
            var service = new LegalService(context);

            var result = await service.AcceptPendingDocumentsAsync(
                UserId, Request((EnumLegalDocumentType.TermsOfUse, 2)), "10.0.0.1", "agent/1.0");

            Assert.True(result.IsSuccess);
            Assert.Empty(result.Value!);
            var consent = Assert.Single(context.UserConsents.Where(c => c.UserId == UserId));
            Assert.Equal(current.Id, consent.LegalDocumentId);
            Assert.Equal("10.0.0.1", consent.IpAddress);
            Assert.Equal("agent/1.0", consent.UserAgent);
            Assert.Empty(await service.GetPendingDocumentsAsync(UserId));
        }

        [Fact]
        public async Task Accept_FailsWhenTheRequestNamesAnOutdatedVersion()
        {
            using var context = DbContextHelper.CreateInMemory();
            AddDocument(context, EnumLegalDocumentType.TermsOfUse, 1);
            AddDocument(context, EnumLegalDocumentType.TermsOfUse, 2);
            var service = new LegalService(context);

            var result = await service.AcceptPendingDocumentsAsync(
                UserId, Request((EnumLegalDocumentType.TermsOfUse, 1)), null, null);

            Assert.True(result.IsFailure);
            Assert.Empty(context.UserConsents);
        }

        [Fact]
        public async Task Accept_FailsWhenAPendingDocumentIsLeftOut()
        {
            using var context = DbContextHelper.CreateInMemory();
            AddDocument(context, EnumLegalDocumentType.TermsOfUse, 1);
            AddDocument(context, EnumLegalDocumentType.PrivacyPolicy, 1);
            var service = new LegalService(context);

            var result = await service.AcceptPendingDocumentsAsync(
                UserId, Request((EnumLegalDocumentType.TermsOfUse, 1)), null, null);

            Assert.True(result.IsFailure);
            Assert.Empty(context.UserConsents);
        }

        [Fact]
        public async Task GetVersions_ListsNewestFirstAndFlagsTheCurrentOne()
        {
            using var context = DbContextHelper.CreateInMemory();
            AddDocument(context, EnumLegalDocumentType.PrivacyPolicy, 1);
            AddDocument(context, EnumLegalDocumentType.PrivacyPolicy, 2);
            AddDocument(context, EnumLegalDocumentType.TermsOfUse, 1);
            var service = new LegalService(context);

            var versions = await service.GetVersionsAsync(EnumLegalDocumentType.PrivacyPolicy);

            Assert.Equal(new[] { 2, 1 }, versions.Select(v => v.Version));
            Assert.True(versions[0].IsCurrent);
            Assert.False(versions[1].IsCurrent);
        }
    }
}

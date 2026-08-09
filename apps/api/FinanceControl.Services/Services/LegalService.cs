using FinanceControl.Data.Data;
using FinanceControl.Domain.Entities;
using FinanceControl.Domain.Interfaces.Services;
using FinanceControl.Shared.Dtos.Response;
using FinanceControl.Shared.Enums;
using Microsoft.EntityFrameworkCore;

namespace FinanceControl.Services.Services
{
    public class LegalService : ILegalService
    {
        private readonly ApplicationDbContext _context;

        public LegalService(ApplicationDbContext context)
        {
            _context = context;
        }

        public async Task<LegalDocumentResponseDto?> GetDocumentAsync(EnumLegalDocumentType type, int? version = null)
        {
            var query = _context.LegalDocuments.Where(d => d.Type == type);

            query = version.HasValue
                ? query.Where(d => d.Version == version.Value)
                : query.OrderByDescending(d => d.Version).Take(1);

            return await query
                .Select(d => new LegalDocumentResponseDto
                {
                    Type = d.Type,
                    Version = d.Version,
                    Content = d.Content,
                    ContentHash = d.ContentHash,
                    PublishedAt = d.PublishedAt
                })
                .FirstOrDefaultAsync();
        }

        public async Task RecordConsentAsync(int userId, string? ipAddress, string? userAgent)
        {
            var currentDocumentIds = await GetCurrentDocumentIdsAsync();

            // Nothing to sign means the seeder did not run, and a registration that
            // records no consent is exactly the situation this table exists to avoid.
            if (currentDocumentIds.Count == 0)
                throw new InvalidOperationException(
                    "No legal documents are published — consent cannot be recorded. Check that the startup seeder ran.");

            var acceptedAt = DateTime.UtcNow;

            foreach (var documentId in currentDocumentIds)
            {
                _context.UserConsents.Add(new UserConsent
                {
                    UserId = userId,
                    LegalDocumentId = documentId,
                    AcceptedAt = acceptedAt,
                    IpAddress = ipAddress,
                    UserAgent = userAgent
                });
            }

            await _context.SaveChangesAsync();
        }

        /// <summary>The newest version of each document type, one id per type.</summary>
        /// <remarks>
        /// Grouped in memory rather than in SQL: "the top row of each group" has no
        /// reliable EF translation, and the table holds one row per published version —
        /// a handful, forever.
        /// </remarks>
        private async Task<List<int>> GetCurrentDocumentIdsAsync()
        {
            var documents = await _context.LegalDocuments
                .Select(d => new { d.Id, d.Type, d.Version })
                .ToListAsync();

            return documents
                .GroupBy(d => d.Type)
                .Select(group => group.OrderByDescending(d => d.Version).First().Id)
                .ToList();
        }
    }
}

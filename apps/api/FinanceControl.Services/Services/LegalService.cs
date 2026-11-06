using FinanceControl.Data.Data;
using FinanceControl.Domain.Entities;
using FinanceControl.Domain.Interfaces.Services;
using FinanceControl.Services.Legal;
using FinanceControl.Shared.Dtos.Request;
using FinanceControl.Shared.Dtos.Response;
using FinanceControl.Shared.Enums;
using FinanceControl.Shared.Models;
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

        public async Task<List<LegalDocumentVersionResponseDto>> GetVersionsAsync(EnumLegalDocumentType type)
        {
            var versions = await _context.LegalDocuments
                .AsNoTracking()
                .Where(d => d.Type == type)
                .OrderByDescending(d => d.Version)
                .Select(d => new LegalDocumentVersionResponseDto
                {
                    Version = d.Version,
                    PublishedAt = d.PublishedAt,
                    ContentHash = d.ContentHash
                })
                .ToListAsync();

            if (versions.Count > 0)
                versions[0].IsCurrent = true;

            return versions;
        }

        public async Task RecordConsentAsync(int userId, string? ipAddress, string? userAgent)
        {
            var currentDocuments = await GetCurrentDocumentsAsync();

            // Nothing to sign means the seeder did not run, and a registration that
            // records no consent is exactly the situation this table exists to avoid.
            if (currentDocuments.Count == 0)
                throw new InvalidOperationException(
                    "No legal documents are published — consent cannot be recorded. Check that the startup seeder ran.");

            AddConsents(userId, currentDocuments.Select(d => d.Id), ipAddress, userAgent);
            await _context.SaveChangesAsync();
        }

        public async Task<List<PendingLegalDocumentResponseDto>> GetPendingDocumentsAsync(int userId)
        {
            var pending = await GetPendingAsync(userId);
            return pending.Select(ToPendingDto).ToList();
        }

        public async Task<Result<List<PendingLegalDocumentResponseDto>>> AcceptPendingDocumentsAsync(
            int userId, AcceptLegalDocumentsRequestDto requestDto, string? ipAddress, string? userAgent)
        {
            var pending = await GetPendingAsync(userId);
            if (pending.Count == 0)
                return Result<List<PendingLegalDocumentResponseDto>>.Success([]);

            // The request must name every pending document at its current version. Anything
            // else means the user looked at a different set of texts than the one in force.
            var requested = requestDto.Documents.ToDictionary(d => d.Type, d => d.Version);
            var matches = pending.All(p => requested.TryGetValue(p.Type, out var version) && version == p.Version);
            if (!matches)
                return Result<List<PendingLegalDocumentResponseDto>>.Failure(
                    "The legal documents changed since they were shown. Reload and review the current versions.");

            AddConsents(userId, pending.Select(p => p.Id), ipAddress, userAgent);
            await _context.SaveChangesAsync();

            return Result<List<PendingLegalDocumentResponseDto>>.Success([]);
        }

        private void AddConsents(int userId, IEnumerable<int> documentIds, string? ipAddress, string? userAgent)
        {
            var acceptedAt = DateTime.UtcNow;

            foreach (var documentId in documentIds)
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
        }

        /// <summary>Current documents the user has no consent row for.</summary>
        private async Task<List<CurrentLegalDocument>> GetPendingAsync(int userId)
        {
            var currentDocuments = await GetCurrentDocumentsAsync();
            if (currentDocuments.Count == 0)
                return [];

            var currentIds = currentDocuments.Select(d => d.Id).ToList();
            var acceptedIds = await _context.UserConsents
                .AsNoTracking()
                .Where(c => c.UserId == userId && currentIds.Contains(c.LegalDocumentId))
                .Select(c => c.LegalDocumentId)
                .Distinct()
                .ToListAsync();

            return currentDocuments
                .Where(d => !acceptedIds.Contains(d.Id))
                .OrderBy(d => d.Type)
                .ToList();
        }

        /// <summary>The newest version of each document type, one row per type.</summary>
        /// <remarks>
        /// Grouped in memory rather than in SQL: "the top row of each group" has no
        /// reliable EF translation, and the table holds one row per published version —
        /// a handful, forever.
        /// </remarks>
        private async Task<List<CurrentLegalDocument>> GetCurrentDocumentsAsync()
        {
            var documents = await _context.LegalDocuments
                .AsNoTracking()
                .Select(d => new CurrentLegalDocument(d.Id, d.Type, d.Version, d.PublishedAt))
                .ToListAsync();

            return documents
                .GroupBy(d => d.Type)
                .Select(group => group.OrderByDescending(d => d.Version).First())
                .ToList();
        }

        private static PendingLegalDocumentResponseDto ToPendingDto(CurrentLegalDocument document) => new()
        {
            Type = document.Type,
            Version = document.Version,
            Title = LegalDocumentTitles.For(document.Type),
            PublishedAt = document.PublishedAt
        };

        private sealed record CurrentLegalDocument(int Id, EnumLegalDocumentType Type, int Version, DateTime PublishedAt);
    }
}

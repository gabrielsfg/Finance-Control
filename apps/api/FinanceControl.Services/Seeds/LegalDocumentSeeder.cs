using FinanceControl.Data.Data;
using FinanceControl.Domain.Entities;
using FinanceControl.Services.Legal;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;

namespace FinanceControl.Services.Seeds
{
    /// <summary>
    /// Copies the legal texts embedded in the assembly into the database at startup, so
    /// every consent row can point at the exact wording that was accepted.
    /// </summary>
    public class LegalDocumentSeeder
    {
        private readonly ApplicationDbContext _context;
        private readonly ILogger<LegalDocumentSeeder> _logger;

        public LegalDocumentSeeder(ApplicationDbContext context, ILogger<LegalDocumentSeeder> logger)
        {
            _context = context;
            _logger = logger;
        }

        public async Task SeedAsync(CancellationToken cancellationToken = default)
        {
            var files = LegalDocumentReader.ReadAll();

            foreach (var file in files)
            {
                var stored = await _context.LegalDocuments
                    .FirstOrDefaultAsync(d => d.Type == file.Type && d.Version == file.Version, cancellationToken);

                if (stored is null)
                {
                    _context.LegalDocuments.Add(new LegalDocument
                    {
                        Type = file.Type,
                        Version = file.Version,
                        Content = file.Content,
                        ContentHash = file.ContentHash,
                        PublishedAt = DateTime.UtcNow
                    });

                    _logger.LogInformation(
                        "Publishing legal document {Type} v{Version} ({Hash}).",
                        file.Type, file.Version, file.ContentHash[..12]);
                    continue;
                }

                if (stored.ContentHash == file.ContentHash)
                    continue;

                // The text changed. Whether that is allowed depends on one thing only:
                // whether anyone has signed this version yet.
                var signatures = await _context.UserConsents
                    .CountAsync(c => c.LegalDocumentId == stored.Id, cancellationToken);

                if (signatures > 0)
                    throw new InvalidOperationException(
                        $"Legal document {file.Type} v{file.Version} has been edited, but {signatures} user(s) " +
                        "already accepted it. A signed version is immutable — restore the original text and " +
                        $"publish the new wording as {file.Type}.v{file.Version + 1}.md instead.");

                // Nobody signed it yet, so this is still a draft being iterated on —
                // typically the placeholder text waiting for the lawyer's version.
                stored.Content = file.Content;
                stored.ContentHash = file.ContentHash;
                stored.PublishedAt = DateTime.UtcNow;

                _logger.LogWarning(
                    "Legal document {Type} v{Version} was rewritten in place ({Hash}). Allowed because nobody has accepted it yet.",
                    file.Type, file.Version, file.ContentHash[..12]);
            }

            await _context.SaveChangesAsync(cancellationToken);
        }
    }
}

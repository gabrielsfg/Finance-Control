using FinanceControl.Shared.Dtos.Response;
using FinanceControl.Shared.Enums;

namespace FinanceControl.Domain.Interfaces.Services
{
    public interface ILegalService
    {
        /// <summary>
        /// The published text of a document. Without <paramref name="version"/> it returns
        /// the current one; with it, the archived version — which is how someone can read
        /// back exactly what they accepted years ago.
        /// </summary>
        Task<LegalDocumentResponseDto?> GetDocumentAsync(EnumLegalDocumentType type, int? version = null);

        /// <summary>
        /// Records acceptance of the current version of every legal document, one row per
        /// document. Called at registration, where the checkbox covers both.
        /// </summary>
        Task RecordConsentAsync(int userId, string? ipAddress, string? userAgent);
    }
}

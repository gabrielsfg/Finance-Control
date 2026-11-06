using FinanceControl.Shared.Dtos.Request;
using FinanceControl.Shared.Dtos.Response;
using FinanceControl.Shared.Enums;
using FinanceControl.Shared.Models;

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

        /// <summary>Every published version of a document type, newest first, without the text.</summary>
        Task<List<LegalDocumentVersionResponseDto>> GetVersionsAsync(EnumLegalDocumentType type);

        /// <summary>
        /// Records acceptance of the current version of every legal document, one row per
        /// document. Called at registration, where the checkbox covers both.
        /// </summary>
        Task RecordConsentAsync(int userId, string? ipAddress, string? userAgent);

        /// <summary>
        /// The documents whose current version the user has not accepted yet. Empty means
        /// the user is up to date; anything else blocks the app until accepted.
        /// </summary>
        Task<List<PendingLegalDocumentResponseDto>> GetPendingDocumentsAsync(int userId);

        /// <summary>
        /// Records acceptance of the pending documents the user was shown, exactly like
        /// registration does. Fails when the request does not match what is pending —
        /// a newer version was published meanwhile, or one is missing — so the client
        /// reloads and shows the current texts instead of signing something unseen.
        /// Returns what is still pending (normally empty).
        /// </summary>
        Task<Result<List<PendingLegalDocumentResponseDto>>> AcceptPendingDocumentsAsync(
            int userId, AcceptLegalDocumentsRequestDto requestDto, string? ipAddress, string? userAgent);
    }
}

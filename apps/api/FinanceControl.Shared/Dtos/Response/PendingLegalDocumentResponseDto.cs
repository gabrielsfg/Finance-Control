using FinanceControl.Shared.Enums;

namespace FinanceControl.Shared.Dtos.Response
{
    /// <summary>
    /// A legal document whose current version the user has not accepted yet — the app
    /// stays blocked until every one of these is accepted.
    /// </summary>
    public class PendingLegalDocumentResponseDto
    {
        public EnumLegalDocumentType Type { get; set; }
        public int Version { get; set; }

        /// <summary>Display title, ready for the UI.</summary>
        public string Title { get; set; } = string.Empty;

        public DateTime PublishedAt { get; set; }
    }
}

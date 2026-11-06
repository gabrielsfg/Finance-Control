namespace FinanceControl.Shared.Dtos.Response
{
    /// <summary>One published version of a legal document, without its text.</summary>
    public class LegalDocumentVersionResponseDto
    {
        public int Version { get; set; }
        public DateTime PublishedAt { get; set; }
        public string ContentHash { get; set; } = string.Empty;

        /// <summary>True for the newest version — the one in force.</summary>
        public bool IsCurrent { get; set; }
    }
}

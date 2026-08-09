using FinanceControl.Shared.Enums;

namespace FinanceControl.Shared.Dtos.Response
{
    public class LegalDocumentResponseDto
    {
        public EnumLegalDocumentType Type { get; set; }
        public int Version { get; set; }

        /// <summary>Markdown, exactly as published.</summary>
        public string Content { get; set; } = string.Empty;

        public string ContentHash { get; set; } = string.Empty;
        public DateTime PublishedAt { get; set; }
    }
}

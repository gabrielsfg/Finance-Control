using FinanceControl.Shared.Enums;

namespace FinanceControl.Shared.Dtos.Response
{
    public class GetInsightResponseDto
    {
        public EnumInsightKind Kind { get; set; }
        public DateOnly PeriodStart { get; set; }
        public string Headline { get; set; } = string.Empty;
        public List<InsightParagraphResponseDto> Paragraphs { get; set; } = [];
        public DateTime GeneratedAt { get; set; }

        /// <summary>
        /// True when the text came from the deterministic writer instead of the model —
        /// either the guard rejected the output or the API failed. The client shows the
        /// same card either way; this exists so the difference is visible in support.
        /// </summary>
        public bool IsFallback { get; set; }

        /// <summary>Whether an AI model was involved at all, for the on-screen notice.</summary>
        public bool GeneratedByAi { get; set; }
    }
}

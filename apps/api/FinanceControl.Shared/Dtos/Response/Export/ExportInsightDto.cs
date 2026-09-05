using FinanceControl.Shared.Enums;

namespace FinanceControl.Shared.Dtos.Response.Export
{
    /// <summary>
    /// One generated analysis, including the exact data it was built from.
    /// </summary>
    /// <remarks>
    /// Snapshot is exported on purpose: an analysis produced about a person, without a
    /// record of what it was based on, is not something they can meaningfully review.
    /// </remarks>
    public class ExportInsightDto
    {
        public EnumInsightKind Kind { get; set; }
        public DateOnly PeriodStart { get; set; }
        public string Content { get; set; } = string.Empty;
        public string Snapshot { get; set; } = string.Empty;
        public string Model { get; set; } = string.Empty;
        public DateTime GeneratedAt { get; set; }
    }
}

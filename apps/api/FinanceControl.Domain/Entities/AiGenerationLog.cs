using FinanceControl.Domain.Common;
using FinanceControl.Shared.Enums;

namespace FinanceControl.Domain.Entities
{
    /// <summary>
    /// One attempt at generating an analysis, successful or not.
    /// </summary>
    /// <remarks>
    /// Rejected outputs are the interesting rows: they are how a drifting model or a
    /// weakened prompt shows up before a user sees it. Cost per user comes from the same
    /// table.
    /// </remarks>
    public class AiGenerationLog : OwnedEntity
    {
        public EnumInsightKind Kind { get; set; }
        public EnumAiOutcome Outcome { get; set; }
        public string Model { get; set; } = string.Empty;
        public int InputTokens { get; set; }
        public int OutputTokens { get; set; }
        public int CachedInputTokens { get; set; }
        public int DurationMs { get; set; }

        /// <summary>Which guard rule tripped, or the API error. Null when delivered.</summary>
        public string? RejectionReason { get; set; }

        public User User { get; set; } = null!;
    }
}

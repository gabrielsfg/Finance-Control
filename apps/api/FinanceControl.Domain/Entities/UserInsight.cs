using FinanceControl.Domain.Common;
using FinanceControl.Shared.Enums;

namespace FinanceControl.Domain.Entities
{
    /// <summary>
    /// One generated analysis, cached for its period.
    /// </summary>
    /// <remarks>
    /// Snapshot holds exactly what was sent to the model. It is kept for two reasons: the
    /// data subject can ask which data an automated analysis was built from, and a strange
    /// output can be debugged without reconstructing the database state at the time.
    /// </remarks>
    public class UserInsight : OwnedEntity
    {
        public EnumInsightKind Kind { get; set; }

        /// <summary>Monday of the ISO week, in UTC. With Kind and UserId this is the cache key.</summary>
        public DateOnly PeriodStart { get; set; }

        /// <summary>Validated model output, as the JSON of InsightModelOutputDto.</summary>
        public string Content { get; set; } = string.Empty;

        /// <summary>The InsightSnapshotDto that was sent, verbatim.</summary>
        public string Snapshot { get; set; } = string.Empty;

        public string Model { get; set; } = string.Empty;
        public int InputTokens { get; set; }
        public int OutputTokens { get; set; }
        public int CachedInputTokens { get; set; }
        public DateTime GeneratedAt { get; set; }

        public User User { get; set; } = null!;
    }
}

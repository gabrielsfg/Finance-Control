using FinanceControl.Domain.Common;
using FinanceControl.Shared.Enums;

namespace FinanceControl.Domain.Entities
{
    /// <summary>
    /// The declared investor profile: four answers the user gives, plus the classification
    /// derived from them.
    /// </summary>
    /// <remarks>
    /// Declared, never inferred. It exists only to let the descriptive analyses contrast
    /// what the user said with what the portfolio actually holds — it is never crossed
    /// with a specific asset, and it never grounds a recommendation.
    /// </remarks>
    public class UserRiskProfile : OwnedEntity
    {
        public EnumInvestmentHorizon InvestmentHorizon { get; set; }
        public EnumLossTolerance LossTolerance { get; set; }

        /// <summary>Months of average spending the user wants held in reserve.</summary>
        public int ReserveMonthsTarget { get; set; }

        public EnumExperienceLevel ExperienceLevel { get; set; }

        /// <summary>Computed from the four answers above by a fixed rule, so the user can be told why.</summary>
        public EnumRiskClassification Classification { get; set; }

        public DateTime AnsweredAt { get; set; }

        public User User { get; set; } = null!;
    }
}

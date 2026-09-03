using FinanceControl.Shared.Enums;

namespace FinanceControl.Shared.Dtos.Response
{
    public class GetRiskProfileResponseDto
    {
        public EnumInvestmentHorizon InvestmentHorizon { get; set; }
        public EnumLossTolerance LossTolerance { get; set; }
        public int ReserveMonthsTarget { get; set; }
        public EnumExperienceLevel ExperienceLevel { get; set; }
        public EnumRiskClassification Classification { get; set; }

        /// <summary>
        /// Why the classification came out this way, in the user's language. The rule is
        /// fixed and explainable on purpose — a profile the user cannot understand is a
        /// profile they cannot correct.
        /// </summary>
        public string ClassificationReason { get; set; } = string.Empty;

        public DateTime AnsweredAt { get; set; }
    }
}

using FinanceControl.Shared.Enums;

namespace FinanceControl.Shared.Dtos.Response.Export
{
    public class ExportRiskProfileDto
    {
        public EnumInvestmentHorizon InvestmentHorizon { get; set; }
        public EnumLossTolerance LossTolerance { get; set; }
        public int ReserveMonthsTarget { get; set; }
        public EnumExperienceLevel ExperienceLevel { get; set; }
        public EnumRiskClassification Classification { get; set; }
        public DateTime AnsweredAt { get; set; }
    }
}

using FinanceControl.Shared.Enums;

namespace FinanceControl.Shared.Dtos.Request
{
    public class SaveRiskProfileRequestDto
    {
        public EnumInvestmentHorizon InvestmentHorizon { get; set; }
        public EnumLossTolerance LossTolerance { get; set; }
        public int ReserveMonthsTarget { get; set; }
        public EnumExperienceLevel ExperienceLevel { get; set; }
    }
}

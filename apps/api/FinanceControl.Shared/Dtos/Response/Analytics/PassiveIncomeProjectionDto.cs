namespace FinanceControl.Shared.Dtos.Response.Analytics
{
    public class PassiveIncomeProjectionDto
    {
        public int CurrentMonthlyPassiveIncome { get; set; }
        public int ProjectedAnnualPassiveIncome { get; set; }
        public int MonthlyLivingCost { get; set; }
        public decimal CoveragePercent { get; set; }
        public int? MonthsUntilFinancialFreedom { get; set; }
        public List<PassiveIncomeMonthDto> History { get; set; } = [];
        public List<PassiveIncomeMonthDto> Projected { get; set; } = [];
    }

    public class PassiveIncomeMonthDto
    {
        public int Year { get; set; }
        public int Month { get; set; }
        public int PassiveIncome { get; set; }
        public int LivingCost { get; set; }
    }
}

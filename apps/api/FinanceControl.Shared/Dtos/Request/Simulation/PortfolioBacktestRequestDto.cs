namespace FinanceControl.Shared.Dtos.Request.Simulation
{
    public class PortfolioBacktestRequestDto
    {
        public List<PortfolioAssetInputDto> Assets { get; set; } = [];
        public DateOnly StartDate { get; set; }
        public DateOnly EndDate { get; set; }
        public long MonthlyContribution { get; set; }
        public long InitialAmount { get; set; }
    }

    public class PortfolioAssetInputDto
    {
        public string Ticker { get; set; } = string.Empty;
        public double WeightPct { get; set; }
    }
}

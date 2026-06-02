namespace FinanceControl.Shared.Dtos.Response.Simulation
{
    public class PortfolioBacktestDto
    {
        public List<PortfolioBacktestPointDto> Points { get; set; } = [];
        public List<PortfolioAssetReturnDto> AssetReturns { get; set; } = [];
        public long TotalInvested { get; set; }
        public long FinalValue { get; set; }
        public decimal AnnualizedReturnPct { get; set; }
        public string EffectiveStartDate { get; set; } = string.Empty;
        public string EffectiveEndDate { get; set; } = string.Empty;
        public bool IsPartialData { get; set; }
        public string? DataNote { get; set; }
    }

    public class PortfolioBacktestPointDto
    {
        public string Label { get; set; } = string.Empty;
        public int Month { get; set; }
        public int Year { get; set; }
        public long Invested { get; set; }
        public long Value { get; set; }
        public decimal MonthlyReturnPct { get; set; }
    }

    public class PortfolioAssetReturnDto
    {
        public string Ticker { get; set; } = string.Empty;
        public decimal TotalReturnPct { get; set; }
    }
}

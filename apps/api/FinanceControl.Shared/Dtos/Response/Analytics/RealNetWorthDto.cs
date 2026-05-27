namespace FinanceControl.Shared.Dtos.Response.Analytics
{
    public class RealNetWorthDto
    {
        public List<RealNetWorthPointDto> Points { get; set; } = [];
        public decimal TotalNominalGrowthPct { get; set; }
        public decimal TotalRealGrowthPct { get; set; }
        public decimal TotalInflationPct { get; set; }
    }

    public class RealNetWorthPointDto
    {
        public int Year { get; set; }
        public int Month { get; set; }
        public int NominalNetWorth { get; set; }
        public int RealNetWorth { get; set; }
        public decimal AccumulatedInflationPct { get; set; }
    }
}

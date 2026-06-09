namespace FinanceControl.Shared.Dtos.Response.Simulation
{
    public class AssetRateDto
    {
        public string Ticker { get; set; } = string.Empty;
        public double AnnualReturnPct { get; set; }
        public int YearsOfData { get; set; }
        public bool IsReal { get; set; }    // false = fallback (no token or insufficient data)
        public string RateSource { get; set; } = string.Empty;
    }
}

namespace FinanceControl.Shared.Dtos.Response.Simulation
{
    public class AvailableBenchmarkDto
    {
        public string Ticker { get; set; } = string.Empty;
        public string Name { get; set; } = string.Empty;
        public string AssetType { get; set; } = string.Empty;
        public DateOnly EarliestDate { get; set; }
        public DateOnly LatestDate { get; set; }
        public int MonthsAvailable { get; set; }
    }
}

namespace FinanceControl.Shared.Dtos.Response.Simulation
{
    public class BenchmarkRatesDto
    {
        public decimal CdiAnnual { get; set; }
        public decimal SelicAnnual { get; set; }
        public decimal IpcaTrailing12m { get; set; }
        public DateTime FetchedAt { get; set; }
        // Series ("CDI", "SELIC", "IPCA") whose public source was unavailable and that use the fixed fallback rate.
        public List<string> FallbackSeries { get; set; } = [];
    }
}

namespace FinanceControl.Shared.Dtos.Response.Simulation
{
    public class HistoricalSimulationDto
    {
        public string Benchmark { get; set; } = string.Empty;
        public DateOnly StartDate { get; set; }
        public DateOnly EndDate { get; set; }
        public long TotalInvested { get; set; }
        public long FinalValue { get; set; }
        public decimal TotalReturnPct { get; set; }
        public decimal AnnualizedReturnPct { get; set; }
        public List<HistoricalSimulationPointDto> Points { get; set; } = [];
        public bool IsPartialData { get; set; }
        public string? DataNote { get; set; }
    }

    public class HistoricalSimulationPointDto
    {
        public string Label { get; set; } = string.Empty;
        public int Month { get; set; }
        public int Year { get; set; }
        public long Invested { get; set; }
        public long Value { get; set; }
        public long Interest { get; set; }
        public decimal MonthlyReturnPct { get; set; }
    }
}

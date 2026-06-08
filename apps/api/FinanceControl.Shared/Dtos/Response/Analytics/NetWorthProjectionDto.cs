namespace FinanceControl.Shared.Dtos.Response.Analytics
{
    public class NetWorthProjectionDto
    {
        public long CurrentNetWorth { get; set; }
        public decimal MonthlyAvgGrowth { get; set; }
        /// <summary>Months until net worth hits zero. Null if not trending negative.</summary>
        public int? MonthsUntilZero { get; set; }
        /// <summary>Months until net worth reaches the target. Null if target not set or not reachable.</summary>
        public int? MonthsUntilTarget { get; set; }
        public long? TargetAmount { get; set; }
        public List<NetWorthProjectionPointDto> Historical { get; set; } = [];
        public List<NetWorthProjectionPointDto> Projected { get; set; } = [];
    }

    public class NetWorthProjectionPointDto
    {
        public int Month { get; set; }
        public int Year { get; set; }
        public long NetWorth { get; set; }
    }
}

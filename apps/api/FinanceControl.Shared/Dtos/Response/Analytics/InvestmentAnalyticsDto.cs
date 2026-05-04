namespace FinanceControl.Shared.Dtos.Response.Analytics
{
    public class InvestmentEvolutionPointDto
    {
        public string Label { get; set; } = string.Empty;
        public long TotalValue { get; set; }
        public long TotalInvested { get; set; }
        public long Returns { get; set; }
        public long Dividends { get; set; }
    }

    public class InvestmentEvolutionResponseDto
    {
        public List<InvestmentEvolutionPointDto> Data { get; set; } = [];
        /// <summary>Return % of latest point (returns / totalInvested * 100). Null if no data.</summary>
        public decimal? ReturnPct { get; set; }
        /// <summary>Sum of dividends across the entire period.</summary>
        public long CumulativeDividends { get; set; }
    }

    // ── Annual returns table ──────────────────────────────────────────────────

    public class MonthlyReturnItemDto
    {
        public int Month { get; set; }
        /// <summary>Return in basis points (e.g. 71 = 0.71%). Null if no data for that month.</summary>
        public int? ReturnBps { get; set; }
    }

    public class AnnualReturnRowDto
    {
        public int Year { get; set; }
        public List<MonthlyReturnItemDto> Months { get; set; } = [];
        public int? AnnualReturnBps { get; set; }
    }

    public class AnnualReturnsResponseDto
    {
        public List<AnnualReturnRowDto> Rows { get; set; } = [];
        /// <summary>Sum of returnBps per calendar month across all years. 12 entries, null if no data for that month-slot.</summary>
        public List<int?> MonthlyCumulatives { get; set; } = [];
        /// <summary>Sum of all annualReturnBps across all years with data.</summary>
        public int GrandTotal { get; set; }
    }

    // ── Launches ─────────────────────────────────────────────────────────────

    public class InvestmentLaunchItemDto
    {
        public int Id { get; set; }
        public string Date { get; set; } = string.Empty;
        public string Ticker { get; set; } = string.Empty;
        public string Name { get; set; } = string.Empty;
        public string AssetClass { get; set; } = string.Empty;
        public string Operation { get; set; } = string.Empty; // "buy" | "sell"
        public decimal Quantity { get; set; }
        public long UnitPrice { get; set; }
        public long TotalValue { get; set; }
        public string? Broker { get; set; }
    }

    public class InvestmentLaunchMonthPointDto
    {
        public string Label { get; set; } = string.Empty;
        public long Bought { get; set; }
        public long Sold { get; set; }
    }

    public class InvestmentLaunchesSummaryDto
    {
        public long TotalBought { get; set; }
        public long TotalSold { get; set; }
        public int BuyCount { get; set; }
        public int SellCount { get; set; }
    }

    public class InvestmentLaunchesResponseDto
    {
        /// <summary>All launches, pre-sorted by date descending.</summary>
        public List<InvestmentLaunchItemDto> Launches { get; set; } = [];
        public List<InvestmentLaunchMonthPointDto> MonthlyPoints { get; set; } = [];
        public InvestmentLaunchesSummaryDto Summary { get; set; } = new();
    }

    // ── Profitability ─────────────────────────────────────────────────────────

    public class ProfitabilityPeriodDto
    {
        public decimal ReturnPct { get; set; }
        public decimal VsCdiPct { get; set; }
    }

    public class ProfitabilityTotalsDto
    {
        public ProfitabilityPeriodDto AllTime { get; set; } = new();
        public ProfitabilityPeriodDto Last12Months { get; set; } = new();
        public ProfitabilityPeriodDto LastMonth { get; set; } = new();
    }

    public class ProfitabilityVsCdiPointDto
    {
        public string Label { get; set; } = string.Empty;
        public decimal PortfolioPct { get; set; }
        public decimal CdiPct { get; set; }
    }
}

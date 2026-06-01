namespace FinanceControl.Shared.Dtos.Response.Market
{
    public class FundamentalsDto
    {
        public string Ticker { get; set; } = string.Empty;

        // --- summaryProfile ---
        public string? CompanyName { get; set; }
        public string? Sector { get; set; }
        public string? Industry { get; set; }
        public string? Website { get; set; }
        public string? BusinessSummary { get; set; }
        public int? FullTimeEmployees { get; set; }

        // --- defaultKeyStatistics ---
        public decimal? PriceToEarnings { get; set; }       // P/L
        public decimal? PriceToBook { get; set; }           // P/VP
        public decimal? ReturnOnEquity { get; set; }        // ROE %
        public decimal? DividendYield { get; set; }         // DY %
        public decimal? EarningsPerShare { get; set; }      // LPA
        public decimal? Beta { get; set; }
        public long? MarketCap { get; set; }                // em reais (centavos não — muito grande)
        public decimal? EnterpriseValue { get; set; }
        public decimal? BookValue { get; set; }             // valor patrimonial por ação/cota (VP)
        public long? SharesOutstanding { get; set; }        // cotas/ações emitidas

        // --- FII / fundo (summaryProfile) ---
        public string? AdministratorName { get; set; }

        // --- proventos recentes (dividendsData) ---
        public List<FundamentalDividendDto> RecentDividends { get; set; } = [];

        // --- financialData ---
        public decimal? Ebitda { get; set; }
        public decimal? TotalRevenue { get; set; }
        public decimal? GrossMargin { get; set; }           // %
        public decimal? EbitdaMargin { get; set; }          // %
        public decimal? OperatingMargin { get; set; }       // %
        public decimal? ProfitMargin { get; set; }          // %
        public decimal? ReturnOnAssets { get; set; }        // ROA %
        public decimal? DebtToEquity { get; set; }
        public decimal? TotalCash { get; set; }
        public decimal? TotalDebt { get; set; }
        public decimal? FreeCashflow { get; set; }

        // --- balanceSheetHistory (último trimestre disponível) ---
        public decimal? TotalAssets { get; set; }
        public decimal? TotalLiabilities { get; set; }
        public decimal? TotalStockholderEquity { get; set; }
        public decimal? Cash { get; set; }
        public decimal? LongTermDebt { get; set; }

        // --- incomeStatementHistory (último anual disponível) ---
        public decimal? AnnualRevenue { get; set; }
        public decimal? AnnualNetIncome { get; set; }
        public decimal? AnnualGrossProfit { get; set; }

        public DateTime FetchedAt { get; set; }
    }
}

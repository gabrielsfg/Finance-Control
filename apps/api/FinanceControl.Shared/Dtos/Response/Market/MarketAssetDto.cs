using FinanceControl.Shared.Enums;

namespace FinanceControl.Shared.Dtos.Response.Market
{
    public class MarketAssetDto
    {
        public int Id { get; set; }
        public string Ticker { get; set; } = string.Empty;
        public string Name { get; set; } = string.Empty;
        public EnumAssetType AssetType { get; set; }
        public string AssetClass { get; set; } = string.Empty;
        public string? LogoUrl { get; set; }
        public string Currency { get; set; } = "BRL";
        public long CurrentPrice { get; set; }
        public DateTime? LastPriceUpdate { get; set; }
        public long? PreviousClose { get; set; }
        public decimal? DayChangePct { get; set; }

        // Populated only for fundamental-sorted rankings (dy/pl/pvp/marketcap/revenue/roe).
        public decimal? DividendYield { get; set; }
        public decimal? PriceToEarnings { get; set; }
        public decimal? PriceToBook { get; set; }
        public decimal? ReturnOnEquity { get; set; }
        public long? MarketCap { get; set; }
        public decimal? TotalRevenue { get; set; }
    }
}

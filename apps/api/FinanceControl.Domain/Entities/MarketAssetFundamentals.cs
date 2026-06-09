using FinanceControl.Domain.Common;

namespace FinanceControl.Domain.Entities
{
    // Snapshot of fundamental indicators for a market asset, persisted in bulk so the
    // universe can be ranked/screened by metric (DY, P/L, P/VP, market cap, revenue).
    // Global — not owned. Refreshed by the daily Brapi quote job (modules in the batch call).
    // Only equity-like assets (stocks, FIIs, ETFs, BDRs) carry fundamentals.
    public class MarketAssetFundamentals : BaseEntity
    {
        public int MarketAssetId { get; set; }

        public decimal? DividendYield { get; set; }    // fraction (e.g. 0.0713 = 7.13%)
        public decimal? PriceToEarnings { get; set; }  // P/L
        public decimal? PriceToBook { get; set; }      // P/VP
        public decimal? ReturnOnEquity { get; set; }   // fraction
        public long? MarketCap { get; set; }           // reais (not cents)
        public decimal? TotalRevenue { get; set; }     // reais
        public decimal? NetIncome { get; set; }        // reais

        public DateTime? FetchedAt { get; set; }

        public MarketAsset MarketAsset { get; set; } = null!;
    }
}

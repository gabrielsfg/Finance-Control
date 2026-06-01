using FinanceControl.Domain.Common;

namespace FinanceControl.Domain.Entities
{
    // A user's position in a market asset — how much they hold, at what average price.
    // Market data (name, type, current price, logo, history) lives on MarketAsset.
    public class Investment : OwnedEntity
    {
        public int MarketAssetId { get; set; }
        public string? Broker { get; set; }
        public decimal CurrentQuantity { get; set; }
        public long AveragePrice { get; set; }
        public DateOnly? MaturityDate { get; set; }
        public decimal? ExpectedYieldPct { get; set; }
        public int AccountId { get; set; }

        public MarketAsset MarketAsset { get; set; } = null!;
        public Account Account { get; set; } = null!;
        public ICollection<InvestmentTransaction> Transactions { get; set; } = [];
        public ICollection<InvestmentDividend> Dividends { get; set; } = [];
    }
}

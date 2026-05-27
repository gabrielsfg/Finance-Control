using FinanceControl.Domain.Common;
using FinanceControl.Shared.Enums;

namespace FinanceControl.Domain.Entities
{
    public class Investment : OwnedEntity
    {
        public string Ticker { get; set; } = string.Empty;
        public string Name { get; set; } = string.Empty;
        public EnumAssetType AssetType { get; set; }
        public string? Broker { get; set; }
        public decimal CurrentQuantity { get; set; }
        public long AveragePrice { get; set; }
        public long CurrentPrice { get; set; }
        public DateTime? LastPriceUpdate { get; set; }
        public DateOnly? MaturityDate { get; set; }
        public decimal? ExpectedYieldPct { get; set; }
        public int AccountId { get; set; }
        public string? LogoUrl { get; set; }
        public string Currency { get; set; } = "BRL";

        public Account Account { get; set; } = null!;
        public ICollection<InvestmentPriceHistory> PriceHistory { get; set; } = [];
        public ICollection<InvestmentTransaction> Transactions { get; set; } = [];
        public ICollection<InvestmentDividend> Dividends { get; set; } = [];
    }
}

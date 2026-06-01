using FinanceControl.Domain.Common;
using FinanceControl.Shared.Enums;

namespace FinanceControl.Domain.Entities
{
    // Global market data for an asset (from Brapi). Not owned by any user —
    // the same PETR4 row is shared by every user who holds it.
    public class MarketAsset : BaseEntity
    {
        public string Ticker { get; set; } = string.Empty;
        public string Name { get; set; } = string.Empty;
        public EnumAssetType AssetType { get; set; }
        public long CurrentPrice { get; set; }
        public DateTime? LastPriceUpdate { get; set; }
        public string? LogoUrl { get; set; }
        public string Currency { get; set; } = "BRL";

        public ICollection<MarketPriceHistory> PriceHistory { get; set; } = [];
        public ICollection<Investment> Investments { get; set; } = [];
    }
}

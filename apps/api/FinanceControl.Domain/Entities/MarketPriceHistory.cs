using FinanceControl.Domain.Common;

namespace FinanceControl.Domain.Entities
{
    // Daily market price log for an asset. One row per asset per day,
    // shared across all users who hold that asset.
    public class MarketPriceHistory : BaseEntity
    {
        public int MarketAssetId { get; set; }
        public DateOnly Date { get; set; }
        public long Price { get; set; }

        public MarketAsset MarketAsset { get; set; } = null!;
    }
}

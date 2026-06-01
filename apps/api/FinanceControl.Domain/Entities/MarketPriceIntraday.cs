using FinanceControl.Domain.Common;

namespace FinanceControl.Domain.Entities
{
    // Intraday price tick for an asset. One row per asset per 15-min interval.
    // Rows older than 7 days are purged daily at 09:30 UTC by the cleanup job.
    public class MarketPriceIntraday : BaseEntity
    {
        public int MarketAssetId { get; set; }
        public DateTime Timestamp { get; set; }
        public long Price { get; set; }

        public MarketAsset MarketAsset { get; set; } = null!;
    }
}

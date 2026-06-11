using FinanceControl.Domain.Common;
using FinanceControl.Shared.Enums;

namespace FinanceControl.Domain.Entities
{
    // A user-defined price alert on a market asset. One-shot: once the price
    // crosses the target it fires a notification, then deactivates (IsTriggered).
    public class AlertRule : OwnedEntity
    {
        public int MarketAssetId { get; set; }
        public MarketAsset MarketAsset { get; set; }

        public EnumAlertDirection Direction { get; set; }

        // Target price in cents, matching MarketAsset.CurrentPrice (long cents).
        public long TargetValue { get; set; }

        public bool IsActive { get; set; } = true;
        public bool IsTriggered { get; set; }
        public DateTime? TriggeredAt { get; set; }
    }
}

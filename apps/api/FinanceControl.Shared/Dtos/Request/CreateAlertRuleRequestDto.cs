using FinanceControl.Shared.Enums;

namespace FinanceControl.Shared.Dtos.Request
{
    public class CreateAlertRuleRequestDto
    {
        public int MarketAssetId { get; set; }
        public EnumAlertDirection Direction { get; set; }

        // Target price in cents (R$ 32,15 → 3215).
        public long TargetValue { get; set; }
    }
}

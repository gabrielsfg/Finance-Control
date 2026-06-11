using FinanceControl.Shared.Enums;

namespace FinanceControl.Shared.Dtos.Response
{
    public class GetAlertRuleResponseDto
    {
        public int Id { get; set; }
        public int MarketAssetId { get; set; }
        public string Ticker { get; set; }
        public string AssetName { get; set; }
        public EnumAlertDirection Direction { get; set; }
        public long TargetValue { get; set; }
        public bool IsActive { get; set; }
        public bool IsTriggered { get; set; }
        public DateTime CreatedAt { get; set; }
        public DateTime? TriggeredAt { get; set; }
    }
}

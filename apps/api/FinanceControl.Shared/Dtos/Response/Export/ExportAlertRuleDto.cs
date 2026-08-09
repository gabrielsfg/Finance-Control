using FinanceControl.Shared.Enums;

namespace FinanceControl.Shared.Dtos.Response.Export
{
    public class ExportAlertRuleDto
    {
        public int Id { get; set; }
        public string Ticker { get; set; } = string.Empty;
        public EnumAlertDirection Direction { get; set; }
        public long TargetValue { get; set; }
        public bool IsActive { get; set; }
        public bool IsTriggered { get; set; }
        public DateTime? TriggeredAt { get; set; }
        public DateTime CreatedAt { get; set; }
    }
}

using FinanceControl.Shared.Enums;

namespace FinanceControl.Shared.Dtos.Response.Export
{
    public class ExportGoalDto
    {
        public int Id { get; set; }
        public string Name { get; set; } = string.Empty;
        public string? Description { get; set; }
        public EnumGoalType Type { get; set; }
        public int TargetAmount { get; set; }
        public EnumGoalPriority Priority { get; set; }
        public EnumGoalStatus Status { get; set; }
        public string? Color { get; set; }
        public DateOnly TargetDate { get; set; }
        public bool IncludeInNetWorth { get; set; }
        public DateTime? AchievedAt { get; set; }
        public int? AccountId { get; set; }
        public string? Url { get; set; }
        public EnumAssetType? TargetAssetType { get; set; }
        public string? TargetTicker { get; set; }
        public DateTime CreatedAt { get; set; }
    }
}

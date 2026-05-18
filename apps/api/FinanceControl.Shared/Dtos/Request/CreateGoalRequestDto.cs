using FinanceControl.Shared.Enums;

namespace FinanceControl.Shared.Dtos.Request
{
    public class CreateGoalRequestDto
    {
        public string Name { get; set; } = string.Empty;
        public string? Description { get; set; }
        public EnumGoalType Type { get; set; }
        public int TargetAmount { get; set; }
        public EnumGoalPriority Priority { get; set; } = EnumGoalPriority.Medium;
        public string? Color { get; set; }
        public DateOnly TargetDate { get; set; }
        // Item-only
        public string? Url { get; set; }
        public string? ImageUrl { get; set; }
        // Investment-only
        public EnumAssetType? TargetAssetType { get; set; }
        public string? TargetTicker { get; set; }
    }
}

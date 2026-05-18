using FinanceControl.Domain.Common;
using FinanceControl.Shared.Enums;

namespace FinanceControl.Domain.Entities
{
    public class Goal : OwnedEntity
    {
        public string Name { get; set; } = string.Empty;
        public string? Description { get; set; }
        public EnumGoalType Type { get; set; }
        public int TargetAmount { get; set; }
        public EnumGoalPriority Priority { get; set; } = EnumGoalPriority.Medium;
        public EnumGoalStatus Status { get; set; } = EnumGoalStatus.Active;
        public string? Color { get; set; }
        public DateOnly TargetDate { get; set; }
        // Item-only fields
        public string? Url { get; set; }
        public string? ImageUrl { get; set; }
        // Investment-only fields
        public EnumAssetType? TargetAssetType { get; set; }
        public string? TargetTicker { get; set; }

        public ICollection<GoalCheckpoint> Checkpoints { get; set; } = [];
    }
}

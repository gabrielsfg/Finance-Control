using FinanceControl.Shared.Enums;

namespace FinanceControl.Shared.Dtos.Response
{
    public class GoalResponseDto
    {
        public int Id { get; init; }
        public string Name { get; init; } = string.Empty;
        public string? Description { get; init; }
        public EnumGoalType Type { get; init; }
        public int TargetAmount { get; init; }
        public EnumGoalPriority Priority { get; init; }
        public EnumGoalStatus Status { get; init; }
        public string? Color { get; init; }
        public string? Url { get; init; }
        public string? ImageUrl { get; init; }
        public DateOnly TargetDate { get; init; }
        public EnumAssetType? TargetAssetType { get; init; }
        public string? TargetTicker { get; init; }
        public int? LatestCheckpointAmount { get; init; }
        public DateTime CreatedAt { get; init; }
        public DateTime? UpdatedAt { get; init; }
    }

    public class GoalDetailResponseDto : GoalResponseDto
    {
        public IReadOnlyList<GoalCheckpointDto> Checkpoints { get; init; } = [];
    }

    public class GoalCheckpointDto
    {
        public int Id { get; init; }
        public int Amount { get; init; }
        public DateTime RecordedAt { get; init; }
    }
}

using FinanceControl.Shared.Enums;

namespace FinanceControl.Shared.Dtos.Request
{
    public class UpdateGoalRequestDto
    {
        public string? Name { get; set; }
        public string? Description { get; set; }
        public int? TargetAmount { get; set; }
        public EnumGoalPriority? Priority { get; set; }
        public EnumGoalStatus? Status { get; set; }
        public string? Url { get; set; }
        public string? ImageUrl { get; set; }
        public DateOnly? TargetDate { get; set; }
    }
}

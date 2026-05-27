namespace FinanceControl.Shared.Dtos.Request
{
    public class RecordGoalContributionRequestDto
    {
        public int Amount { get; set; }
        public int? SourceAccountId { get; set; }
        public string? Description { get; set; }
    }
}

namespace FinanceControl.Shared.Dtos.Request
{
    public class WithdrawGoalRequestDto
    {
        public int Amount { get; set; }
        public int? DestinationAccountId { get; set; }
        public string? Description { get; set; }
    }
}

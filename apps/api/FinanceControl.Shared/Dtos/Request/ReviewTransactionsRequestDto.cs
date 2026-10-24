namespace FinanceControl.Shared.Dtos.Request
{
    /// Synced transactions the user confirms as they are.
    public class ReviewTransactionsRequestDto
    {
        public List<int> Ids { get; set; } = [];
    }
}

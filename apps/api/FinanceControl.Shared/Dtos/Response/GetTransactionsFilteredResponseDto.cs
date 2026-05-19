using FinanceControl.Shared.Models;

namespace FinanceControl.Shared.Dtos.Response
{
    public class GetTransactionsFilteredResponseDto
    {
        public int TotalIncome { get; set; }
        public int TotalExpense { get; set; }
        public int Balance { get; set; }
        public int? PreviousTotalIncome { get; set; }
        public int? PreviousTotalExpense { get; set; }
        public int? PreviousBalance { get; set; }
        public PagedResponse<GetTransactionResponseDto> Page { get; set; }
    }
}

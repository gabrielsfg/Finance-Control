using FinanceControl.Shared.Dtos.Others;
using System.Collections.Generic;

namespace FinanceControl.Shared.Dtos.Response
{
    public class GetAccountByIdResponseDto
    {
        public int Id { get; set; }
        public string Name { get; set; }
        public int CurrentAmount { get; set; }
        public int? GoalAmount {  get; set; }
        public bool IsDefaultAccount { get; set; }
        public List<RecentTransactionDto> RecentTransactions { get; set; } = [];
    }
}

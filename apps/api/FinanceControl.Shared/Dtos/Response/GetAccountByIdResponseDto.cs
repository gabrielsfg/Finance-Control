using FinanceControl.Shared.Dtos.Others;
using FinanceControl.Shared.Enums;

namespace FinanceControl.Shared.Dtos.Response
{
    public class GetAccountByIdResponseDto
    {
        public int Id { get; set; }
        public string Name { get; set; }
        public EnumAccountType Type { get; set; }
        public int CurrentAmount { get; set; }
        public int? GoalAmount { get; set; }
        public bool IsDefaultAccount { get; set; }
        public int? BillingDueDay { get; set; }
        public int? BillingClosingDay { get; set; }
        public int? CreditLimit { get; set; }
        public List<RecentTransactionDto> RecentTransactions { get; set; } = [];
    }
}

using FinanceControl.Domain.Common;
using FinanceControl.Shared.Enums;


namespace FinanceControl.Domain.Entities
{
    public class Account : OwnedEntity
    {
        public string Name { get; set; }
        public EnumAccountType Type { get; set; }
        public int? GoalAmount { get; set; }
        public bool IsDefaultAccount { get; set; }
        public bool IsSystem { get; set; } = false;
        public int? BillingDueDay { get; set; }
        public int? CreditLimit { get; set; }
        public ICollection<Transaction> Transactions { get; set; } = [];
        public ICollection<Transaction> IncomingTransfers { get; set; } = [];
        public ICollection<RecurringTransaction> RecurringTransactions { get; set; } = [];
    }
}

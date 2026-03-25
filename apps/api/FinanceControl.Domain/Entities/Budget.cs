using FinanceControl.Domain.Common;
using FinanceControl.Shared.Enums;

namespace FinanceControl.Domain.Entities
{
    public class Budget : OwnedEntity
    {
        public string Name { get; set; } = string.Empty;
        public int StartDate {  get; set; }
        public EnumBudgetRecurrence Recurrence { get; set; }
        public bool IsActive { get; set; }

        public ICollection<BudgetSubcategoryAllocation> BudgetSubcategoryAllocations { get; set; } = [];
        public ICollection<Transaction> Transactions { get; set; } = [];
        public ICollection<RecurringTransaction> RecurringTransactions { get; set; } = [];

    }
}

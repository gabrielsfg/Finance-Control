using FinanceControl.Domain.Common;

namespace FinanceControl.Domain.Entities
{
    public class SubCategory : OwnedEntity
    {
        public int CategoryId { get; set; }
        public string Name { get; set; }
        public bool IsSystem { get; set; } = false;
        public Category Category { get; set; }
        public ICollection<BudgetSubcategoryAllocation> BudgetSubcategoryAllocations { get; set; } = [];
        public ICollection<Transaction> Transactions { get; set; } = [];
        public ICollection<RecurringTransaction> RecurringTransactions { get; set; } = [];
    }
}

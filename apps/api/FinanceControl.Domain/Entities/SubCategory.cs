using FinanceControl.Domain.Common;

namespace FinanceControl.Domain.Entities
{
    public class SubCategory : OwnedEntity
    {
        public int CategoryId { get; set; }
        public string Name { get; set; }
        public string? Emoji { get; set; }
        public bool IsSystem { get; set; } = false;

        /// <summary>
        /// Money spent here is money kept, not money gone — a contribution to an
        /// investment, a reserve, a goal. Analytics leaves it out of spending and counts
        /// it towards savings, and going over the plan on it is a win, not a leak.
        /// </summary>
        public bool IsSavings { get; set; } = false;
        public Category Category { get; set; }
        public ICollection<BudgetSubcategoryAllocation> BudgetSubcategoryAllocations { get; set; } = [];
        public ICollection<Transaction> Transactions { get; set; } = [];
        public ICollection<RecurringTransaction> RecurringTransactions { get; set; } = [];
    }
}

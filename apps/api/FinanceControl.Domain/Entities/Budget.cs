using FinanceControl.Domain.Common;
using FinanceControl.Domain.Enums;

namespace FinanceControl.Domain.Entities
{
    public class Budget : OwnedEntity
    {
        public string Name { get; set; } = string.Empty;
        public int StartDate {  get; set; }
        public EnumBudgetRecurrence Reccurrence { get; set; }

        public ICollection<BudgetSubcategoryAllocation> BudgetSubcategoryAllocations { get; set; } = [];

    }
}

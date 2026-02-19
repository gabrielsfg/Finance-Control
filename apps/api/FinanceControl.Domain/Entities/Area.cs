using FinanceControl.Domain.Common;

namespace FinanceControl.Domain.Entities
{
    public class Area : OwnedEntity
    {
        public int BudgetId { get; set; }
        public string Name { get; set; }
        public ICollection<AreaCategory> AreaCategories { get; set; } = [];
        public ICollection<BudgetSubcategoryAllocation> BudgetSubcategoryAllocations { get; set; } = [];
    }
}

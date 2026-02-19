using FinanceControl.Domain.Common;

namespace FinanceControl.Domain.Entities
{
    public class SubCategory : OwnedEntity
    {
        public int CategoryId { get; set; }
        public string Name { get; set; }
        public Category Category { get; set; }
        public ICollection<BudgetSubcategoryAllocation> BudgetSubcategoryAllocations { get; set; } = []; 
    }
}

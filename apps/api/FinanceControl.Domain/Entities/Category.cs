using FinanceControl.Domain.Common;

namespace FinanceControl.Domain.Entities
{
    public class Category : OwnedEntity
    {
        public string Name { get; set; }
        public string? Color { get; set; }
        public bool IsSystem { get; set; } = false;
        public ICollection<SubCategory> SubCategories { get; set; } = [];
    }
}

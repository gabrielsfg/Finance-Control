using FinanceControl.Domain.Common;

namespace FinanceControl.Domain.Entities
{
    public class Category : OwnedEntity
    {
        public string Name { get; set; }
        public ICollection<AreaCategory> AreaCategories { get; set; } = [];
        public ICollection<SubCategory> SubCategories { get; set; } = [];
    }
}

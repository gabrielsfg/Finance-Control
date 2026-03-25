using FinanceControl.Shared.Enums;

namespace FinanceControl.Shared.Dtos.Others
{
    public class RecentTransactionDto
    {
        public int Id { get; set; }
        public string Description { get; set; }
        public int Value { get; set; }
        public EnumTransactionType Type { get; set; }
        public string SubCategoryName { get; set; }
        public string CategoryName { get; set; }
    }
}

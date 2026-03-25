using FinanceControl.Shared.Enums;

namespace FinanceControl.Shared.Dtos.Request
{
    public class AddSubCategoryToBudgetRequestDto
    {
        public int BudgetId { get; set; }
        public int AreaId { get; set; }
        public int SubCategoryId { get; set; }
        public int ExpectedValue { get; set; }
        public EnumAllocationType AllocationType { get; set; }
    }
}

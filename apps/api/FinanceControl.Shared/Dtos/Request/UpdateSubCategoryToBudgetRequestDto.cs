using FinanceControl.Shared.Enums;

namespace FinanceControl.Shared.Dtos.Request
{
    public class UpdateSubCategoryToBudgetRequestDto
    {
        public int ExpectedValue { get; set; }
        public EnumAllocationType AllocationType { get; set; }
    }
}

using FinanceControl.Shared.Enums;

namespace FinanceControl.Shared.Dtos.Request
{
    public class CreateAllocationInBudgetDto
    {
        public int SubCategoryId { get; set; }
        public int ExpectedValue { get; set; }
        public EnumAllocationType AllocationType { get; set; }
    }
}

using FinanceControl.Shared.Enums;

namespace FinanceControl.Shared.Dtos.Response
{
    public class AllocationInBudgetResponseDto
    {
        public int Id { get; set; }
        public int SubCategoryId { get; set; }
        public string SubCategoryName { get; set; }
        public int ExpectedValue { get; set; }
        public int SpentValue { get; set; }
        public EnumAllocationType AllocationType { get; set; }
    }
}

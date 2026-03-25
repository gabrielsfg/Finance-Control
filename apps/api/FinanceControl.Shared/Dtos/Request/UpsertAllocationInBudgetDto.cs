using FinanceControl.Shared.Enums;

namespace FinanceControl.Shared.Dtos.Request
{
    public class UpsertAllocationInBudgetDto
    {
        public int? Id { get; set; }
        public int SubCategoryId { get; set; }
        public int ExpectedValue { get; set; }
        public EnumAllocationType AllocationType { get; set; }
    }
}

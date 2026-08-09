using FinanceControl.Shared.Enums;

namespace FinanceControl.Shared.Dtos.Response.Export
{
    public class ExportAllocationDto
    {
        public int Id { get; set; }
        public int SubCategoryId { get; set; }
        public string SubCategoryName { get; set; } = string.Empty;
        public int ExpectedValue { get; set; }
        public EnumAllocationType AllocationType { get; set; }
    }
}

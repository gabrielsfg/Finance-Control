namespace FinanceControl.Shared.Dtos.Response.Export
{
    public class ExportAreaDto
    {
        public int Id { get; set; }
        public string Name { get; set; } = string.Empty;
        public List<ExportAllocationDto> Allocations { get; set; } = [];
    }
}

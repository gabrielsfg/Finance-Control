namespace FinanceControl.Shared.Dtos.Response.Export
{
    public class ExportCategoryDto
    {
        public int Id { get; set; }
        public string Name { get; set; } = string.Empty;
        public string? Color { get; set; }
        public bool IsSystem { get; set; }
        public List<ExportSubCategoryDto> SubCategories { get; set; } = [];
    }
}

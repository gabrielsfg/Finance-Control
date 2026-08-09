namespace FinanceControl.Shared.Dtos.Response.Export
{
    public class ExportSubCategoryDto
    {
        public int Id { get; set; }
        public string Name { get; set; } = string.Empty;
        public string? Emoji { get; set; }
        public bool IsSystem { get; set; }
    }
}

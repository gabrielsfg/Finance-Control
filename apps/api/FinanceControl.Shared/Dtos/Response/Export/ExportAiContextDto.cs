namespace FinanceControl.Shared.Dtos.Response.Export
{
    public class ExportAiContextDto
    {
        public DateOnly PeriodStart { get; set; }
        public string Text { get; set; } = string.Empty;
        public DateTime CreatedAt { get; set; }
    }
}

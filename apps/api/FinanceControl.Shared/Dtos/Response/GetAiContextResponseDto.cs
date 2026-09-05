namespace FinanceControl.Shared.Dtos.Response
{
    public class GetAiContextResponseDto
    {
        public DateOnly PeriodStart { get; set; }
        public string Text { get; set; } = string.Empty;
        public DateTime? UpdatedAt { get; set; }
    }
}

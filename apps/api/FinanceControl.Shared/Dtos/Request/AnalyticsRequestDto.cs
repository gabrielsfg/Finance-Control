namespace FinanceControl.Shared.Dtos.Request
{
    public class AnalyticsRequestDto
    {
        public DateOnly StartDate { get; set; }
        public DateOnly FinishDate { get; set; }
        public int? AccountId { get; set; }
        public int? CategoryId { get; set; }
        public int UserId { get; set; }
    }
}

namespace FinanceControl.Shared.Dtos.Response.Analytics
{
    public class BudgetPaceDto
    {
        public decimal DailyIdeal { get; set; }
        public DateOnly PeriodStart { get; set; }
        public DateOnly PeriodEnd { get; set; }
        public int TotalExpected { get; set; }
        public List<BudgetPacePointDto> Actual { get; set; } = [];
    }

    public class BudgetPacePointDto
    {
        public DateOnly Date { get; set; }
        public int Accumulated { get; set; }
    }
}

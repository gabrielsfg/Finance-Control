namespace FinanceControl.Shared.Dtos.Response.Analytics
{
    public class BalanceProjectionDto
    {
        public int CurrentBalance { get; set; }
        public int ProjectedBalance { get; set; }
        public decimal DailyAvgIncome { get; set; }
        public decimal DailyAvgExpense { get; set; }
        public List<BalanceProjectionPointDto> Actual { get; set; } = [];
        public List<BalanceProjectionPointDto> Projected { get; set; } = [];
    }

    public class BalanceProjectionPointDto
    {
        public DateOnly Date { get; set; }
        public int Balance { get; set; }
    }
}

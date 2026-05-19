namespace FinanceControl.Shared.Dtos.Response.Analytics
{
    public class IncomeExpenseItemDto
    {
        public int Month { get; set; }
        public int Year { get; set; }
        public int TotalIncome { get; set; }
        public int TotalExpense { get; set; }
    }
}

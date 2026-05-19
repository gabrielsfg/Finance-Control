namespace FinanceControl.Shared.Dtos.Others
{
    public class SpendingPredictionItemDto
    {
        public int Day { get; set; }
        public int? CurrentExpense { get; set; }
        public int HistoricalAverage { get; set; }
    }
}

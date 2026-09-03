namespace FinanceControl.Shared.Dtos.Others.Insight
{
    /// <summary>Question 4: how long the liquid balance covers the average month.</summary>
    public class InsightReserveDto
    {
        public string AverageMonthlyExpense { get; set; } = string.Empty;
        public string LiquidBalance { get; set; } = string.Empty;
        public string MonthsCovered { get; set; } = string.Empty;

        /// <summary>What the user declared they want covered, or null if no profile yet.</summary>
        public int? TargetMonths { get; set; }
    }
}

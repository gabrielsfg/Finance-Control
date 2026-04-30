namespace FinanceControl.Shared.Dtos.Response.Analytics
{
    public class AnalyticsSummaryDto
    {
        public int AvgMonthlyIncome { get; set; }
        public int AvgMonthlyExpense { get; set; }
        public int AvgMonthlyBalance { get; set; }
        public MonthSummaryDto BestMonth { get; set; } = new();
        public MonthSummaryDto WorstMonth { get; set; } = new();
        public List<CategorySummaryItemDto> CategoryBreakdown { get; set; } = [];
    }

    public class MonthSummaryDto
    {
        public int Month { get; set; }
        public int Year { get; set; }
        public string Label { get; set; } = string.Empty;
        public int TotalIncome { get; set; }
        public int TotalExpense { get; set; }
        public int Balance { get; set; }
    }

    public class CategorySummaryItemDto
    {
        public int CategoryId { get; set; }
        public string CategoryName { get; set; } = string.Empty;
        public string? Color { get; set; }
        public int TotalSpent { get; set; }
        public decimal Percent { get; set; }
        /// <summary>% change vs. previous month. Null if no previous month data.</summary>
        public decimal? Change { get; set; }
    }
}

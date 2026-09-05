namespace FinanceControl.Shared.Dtos.Others.Insight
{
    public class InsightCategoryTotalDto
    {
        public string Category { get; set; } = string.Empty;
        public string CurrentWeek { get; set; } = string.Empty;
        public string TwelveWeekAverage { get; set; } = string.Empty;
        public string ChangeVsAverage { get; set; } = string.Empty;
    }
}

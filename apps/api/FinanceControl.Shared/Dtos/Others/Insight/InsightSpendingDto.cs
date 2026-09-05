namespace FinanceControl.Shared.Dtos.Others.Insight
{
    public class InsightSpendingDto
    {
        public string CurrentWeekTotal { get; set; } = string.Empty;
        public string PreviousWeekTotal { get; set; } = string.Empty;
        public string TwelveWeekAverage { get; set; } = string.Empty;

        /// <summary>Current week against the 12-week average, already computed here.</summary>
        public string ChangeVsAverage { get; set; } = string.Empty;

        public string WeekdayAverage { get; set; } = string.Empty;
        public string WeekendAverage { get; set; } = string.Empty;
        public string CurrentWeekendTotal { get; set; } = string.Empty;
        public string WeekendChangeVsAverage { get; set; } = string.Empty;

        public List<InsightCategoryTotalDto> Categories { get; set; } = [];
        public List<InsightMonthTotalDto> Months { get; set; } = [];
    }
}

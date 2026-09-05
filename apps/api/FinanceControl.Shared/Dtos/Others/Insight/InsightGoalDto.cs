namespace FinanceControl.Shared.Dtos.Others.Insight
{
    /// <summary>
    /// Question 6. The goal name is free text written by the user and may carry personal
    /// detail — it is sent because the analysis is meaningless without it, and that choice
    /// is declared in the privacy policy.
    /// </summary>
    public class InsightGoalDto
    {
        public string Name { get; set; } = string.Empty;
        public string TargetAmount { get; set; } = string.Empty;
        public string CurrentAmount { get; set; } = string.Empty;
        public string Progress { get; set; } = string.Empty;
        public DateOnly TargetDate { get; set; }
        public string MonthlyNeeded { get; set; } = string.Empty;
    }
}

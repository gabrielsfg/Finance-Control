namespace FinanceControl.Shared.Dtos.Response.Analytics
{
    public class SavingsPeriodsDto
    {
        /// <summary>Budget periods ordered oldest → newest; the last one is the current period.</summary>
        public List<SavingsPeriodItemDto> Periods { get; set; } = [];
        /// <summary>Consecutive closed periods with positive savings, ending at the most recent closed period.</summary>
        public int PositiveStreak { get; set; }
        public int PlannedIncome { get; set; }
        public int PlannedExpense { get; set; }
        public int PlannedSavings { get; set; }
        /// <summary>Planned savings as % of planned income. Null when nothing is planned as income.</summary>
        public double? PlannedRate { get; set; }
    }

    public class SavingsPeriodItemDto
    {
        public DateOnly PeriodStart { get; set; }
        /// <summary>Exclusive end (start of the next period).</summary>
        public DateOnly PeriodEnd { get; set; }
        public bool IsCurrent { get; set; }
        /// <summary>Income in the period, excluding proceeds from investment sells.</summary>
        public int Income { get; set; }
        /// <summary>Expenses in the period, excluding investment buys.</summary>
        public int Expense { get; set; }
        /// <summary>Net amount moved into investments (buys − sells).</summary>
        public int Invested { get; set; }
        /// <summary>Net transfers into goal (system) accounts.</summary>
        public int GoalContributions { get; set; }
        public int Savings { get; set; }
        /// <summary>Savings as % of income. Null when there is no income in the period.</summary>
        public double? SavingsRate { get; set; }
    }
}

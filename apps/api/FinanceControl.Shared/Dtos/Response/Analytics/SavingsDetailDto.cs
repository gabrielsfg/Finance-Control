namespace FinanceControl.Shared.Dtos.Response.Analytics
{
    public class SavingsDetailDto
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

        public int PlannedIncome { get; set; }
        public int PlannedExpense { get; set; }
        public int PlannedSavings { get; set; }
        /// <summary>Planned savings as % of planned income. Null when nothing is planned as income.</summary>
        public double? PlannedRate { get; set; }

        /// <summary>Number of expense allocations in the budget.</summary>
        public int AllocationsTotal { get; set; }
        /// <summary>Expense allocations whose spending stayed within the allocated amount.</summary>
        public int AllocationsWithinLimit { get; set; }
        /// <summary>% of expense allocations within limit. Null when the budget has no expense allocations.</summary>
        public double? AdherenceRate { get; set; }
        /// <summary>Expense allocations ordered by overage (spent − allocated) descending.</summary>
        public List<SavingsAllocationStatusDto> Allocations { get; set; } = [];
        /// <summary>Areas ordered by deviation (actual − planned expense) descending.</summary>
        public List<SavingsAreaImpactDto> Areas { get; set; } = [];
    }

    public class SavingsAllocationStatusDto
    {
        public int SubCategoryId { get; set; }
        public string SubCategoryName { get; set; } = string.Empty;
        public string? SubCategoryEmoji { get; set; }
        public string CategoryName { get; set; } = string.Empty;
        public string? CategoryColor { get; set; }
        public string AreaName { get; set; } = string.Empty;
        public int Allocated { get; set; }
        public int Spent { get; set; }
    }

    public class SavingsAreaImpactDto
    {
        public int AreaId { get; set; }
        public string Name { get; set; } = string.Empty;
        public int PlannedExpense { get; set; }
        public int ActualExpense { get; set; }
    }
}

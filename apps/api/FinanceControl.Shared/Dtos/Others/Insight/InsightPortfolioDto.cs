namespace FinanceControl.Shared.Dtos.Others.Insight
{
    /// <summary>
    /// Questions 1, 2, 3 and 5. Purely descriptive: weights, oscillation already observed
    /// and what the user actually bought. No field here evaluates an asset.
    /// </summary>
    public class InsightPortfolioDto
    {
        public string TotalValue { get; set; } = string.Empty;
        public int PositionCount { get; set; }

        public List<InsightAssetClassWeightDto> ByClass { get; set; } = [];
        public List<InsightPositionDto> Positions { get; set; } = [];

        /// <summary>Question 3 — concentration.</summary>
        public string LargestPositionTicker { get; set; } = string.Empty;
        public string LargestPositionWeight { get; set; } = string.Empty;
        public string LargestClass { get; set; } = string.Empty;
        public string LargestClassWeight { get; set; } = string.Empty;

        /// <summary>Question 1 — the share sitting in variable income, to contrast with the declared profile.</summary>
        public string VariableIncomeWeight { get; set; } = string.Empty;

        /// <summary>Question 2 — worst quarter actually observed in the price history.</summary>
        public string? WorstQuarterChange { get; set; }
        public string? WorstQuarterLabel { get; set; }

        /// <summary>Question 5 — where the last contributions went, by class.</summary>
        public List<InsightContributionDto> RecentContributions { get; set; } = [];

        /// <summary>How old the prices behind these numbers are. The service refuses to run above the limit.</summary>
        public int PriceAgeDays { get; set; }
    }
}

namespace FinanceControl.Services.Ai
{
    /// <summary>
    /// Bound from the "AnthropicSettings" configuration section, mirroring BrapiSettings.
    /// </summary>
    /// <remarks>
    /// ApiKey never goes in a versioned appsettings file — environment variable only, as
    /// with the JWT secret and the Brapi token.
    /// </remarks>
    public class AnthropicSettings
    {
        public string ApiKey { get; set; } = string.Empty;

        /// <summary>
        /// Master switch, off by default. The feature ships dark and is turned on by
        /// configuration, the same way the Brapi jobs are gated today.
        /// </summary>
        public bool Enabled { get; set; } = false;

        public string AnalysisModel { get; set; } = "claude-sonnet-5";
        public int MaxOutputTokens { get; set; } = 2000;
        public int TimeoutSeconds { get; set; } = 60;

        /// <summary>Per user, per calendar month. Counted from AiGenerationLogs.</summary>
        public int MonthlySpendingInsightsPerUser { get; set; } = 6;
        public int MonthlyPortfolioInsightsPerUser { get; set; } = 4;

        /// <summary>
        /// A portfolio analysis over stale prices is worse than none, so the service
        /// refuses above this age instead of quietly narrating last month's market.
        /// </summary>
        public int MaxPriceAgeDays { get; set; } = 7;
    }
}

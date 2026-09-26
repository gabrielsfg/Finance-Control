namespace FinanceControl.Services.Ai
{
    /// <summary>
    /// Bound from the "AnthropicSettings" configuration section, mirroring BrapiSettings.
    /// </summary>
    /// <remarks>
    /// ApiKey never goes in a versioned appsettings file — environment variable only, as
    /// with the JWT secret and the Brapi token. It is the platform's own key: every in-app
    /// AI feature (analyses, chat, import categorisation) runs on it, only for Premium
    /// users who have not switched the AI off.
    /// </remarks>
    public class AnthropicSettings
    {
        public string ApiKey { get; set; } = string.Empty;

        /// <summary>
        /// Master switch, off by default. The feature ships dark and is turned on by
        /// configuration once the legal texts describing it are published.
        /// </summary>
        public bool Enabled { get; set; } = false;

        public string AnalysisModel { get; set; } = "claude-sonnet-5";

        /// <summary>The chat assistant. Every message may run several tool rounds, so this is the main cost line.</summary>
        public string ChatModel { get; set; } = "claude-sonnet-5";

        /// <summary>Categorising import rows is a short classification task; the small model is enough.</summary>
        public string ImportModel { get; set; } = "claude-haiku-4-5";

        public int MaxOutputTokens { get; set; } = 2000;

        /// <summary>Per model call. Answers are meant to be a few lines; this is a ceiling, not a target.</summary>
        public int ChatMaxOutputTokens { get; set; } = 1500;
        public int TimeoutSeconds { get; set; } = 60;

        /// <summary>Per user, per calendar month. Counted from AiGenerationLogs.</summary>
        public int MonthlySpendingInsightsPerUser { get; set; } = 6;
        public int MonthlyPortfolioInsightsPerUser { get; set; } = 4;
        public int MonthlyChatMessagesPerUser { get; set; } = 200;

        /// <summary>Tool rounds allowed for one chat message before the loop gives up.</summary>
        public int MaxChatToolIterations { get; set; } = 8;

        /// <summary>Rows sent to the model per import; anything above stays for manual review.</summary>
        public int MaxImportRowsForAi { get; set; } = 300;

        /// <summary>
        /// A portfolio analysis over stale prices is worse than none, so the service
        /// refuses above this age instead of quietly narrating last month's market.
        /// </summary>
        public int MaxPriceAgeDays { get; set; } = 7;
    }
}

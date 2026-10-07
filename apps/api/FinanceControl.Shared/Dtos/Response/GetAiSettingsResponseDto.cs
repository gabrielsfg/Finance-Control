namespace FinanceControl.Shared.Dtos.Response
{
    /// <summary>What the "IA no Quantia" profile card shows.</summary>
    public class GetAiSettingsResponseDto
    {
        /// <summary>The user's own switch for the in-app AI features.</summary>
        public bool AiEnabled { get; set; }

        public bool IsPremium { get; set; }

        /// <summary>False while the platform has the integration switched off by configuration.</summary>
        public bool IsAvailable { get; set; }

        /// <summary>Who processes the data, named on screen as the privacy policy names it.</summary>
        public string Provider { get; set; } = string.Empty;

        public int ChatMessagesUsed { get; set; }
        public int ChatMessagesLimit { get; set; }

        /// <summary>Stored analyses, so the "delete analyses" button can say what it removes.</summary>
        public int InsightCount { get; set; }

        public int ConversationCount { get; set; }
    }
}

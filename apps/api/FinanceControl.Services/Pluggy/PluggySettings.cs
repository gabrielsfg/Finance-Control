namespace FinanceControl.Services.Pluggy
{
    /// <summary>
    /// Connection to Pluggy (Open Finance aggregator), bound from the "PluggySettings" section.
    /// </summary>
    /// <remarks>
    /// One base URL for every environment: Development and Production are separate Pluggy
    /// applications, each with its own client id and secret. Both secrets belong in
    /// appsettings.Local.json or environment variables, never in the repository.
    /// </remarks>
    public class PluggySettings
    {
        public string BaseUrl { get; set; } = "https://api.pluggy.ai";
        public string ClientId { get; set; } = string.Empty;
        public string ClientSecret { get; set; } = string.Empty;

        /// Pluggy has no webhook signature. The webhook is registered with this value in a
        /// custom header (X-Webhook-Secret) and every delivery without it is refused.
        public string WebhookSecret { get; set; } = string.Empty;

        /// Shows the "Pluggy Bank" sandbox connectors in the widget. Development only.
        public bool IncludeSandbox { get; set; }

        /// Where the bank sends the user back after an Open Finance authorization opened in
        /// a browser. HTTPS for the web; the mobile app uses its own deep link.
        public string WebOAuthRedirectUri { get; set; } = string.Empty;
        public string MobileOAuthRedirectUri { get; set; } = string.Empty;

        public int TimeoutSeconds { get; set; } = 30;
    }
}

namespace FinanceControl.Services.Mcp
{
    /// <summary>Bound from the "McpSettings" configuration section.</summary>
    /// <remarks>
    /// The MCP server does not spend anything on the platform's side — the user's own AI
    /// does the processing — so it is on by default, unlike the in-app AI.
    /// </remarks>
    public class McpSettings
    {
        public bool Enabled { get; set; } = true;

        /// <summary>
        /// Public origin of this API as the AI clients reach it (https in production), with
        /// no trailing slash. It is the OAuth issuer and the base of the /mcp resource URL,
        /// so it must be exactly what clients see — behind a proxy, not the internal host.
        /// </summary>
        public string PublicBaseUrl { get; set; } = "http://localhost:5112";

        /// <summary>Origin of the web app that hosts the consent page (/oauth/consent).</summary>
        public string WebBaseUrl { get; set; } = "http://localhost:3000";

        public int AccessTokenMinutes { get; set; } = 60;
        public int RefreshTokenDays { get; set; } = 30;
        public int AuthorizationRequestMinutes { get; set; } = 10;
        public int AuthorizationCodeMinutes { get; set; } = 5;
        public int MaxPersonalTokenDays { get; set; } = 90;

        /// <summary>Tool calls per minute per connection.</summary>
        public int RequestsPerMinute { get; set; } = 60;

        public string ResourceUrl => PublicBaseUrl.TrimEnd('/') + "/mcp";
        public string Issuer => PublicBaseUrl.TrimEnd('/');
    }
}

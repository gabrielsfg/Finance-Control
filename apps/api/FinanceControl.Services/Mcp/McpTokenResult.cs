namespace FinanceControl.Services.Mcp
{
    /// <summary>The body of a successful /oauth/token response, or the error to return instead.</summary>
    public sealed record McpTokenResult(
        string? AccessToken,
        string? RefreshToken,
        int ExpiresInSeconds,
        string Scope,
        McpOAuthError? Error)
    {
        public static McpTokenResult Fail(string error, string description) =>
            new(null, null, 0, string.Empty, new McpOAuthError(error, description));
    }
}

namespace FinanceControl.Services.Mcp
{
    /// <summary>An OAuth error as RFC 6749 names it (invalid_request, invalid_grant...).</summary>
    public sealed record McpOAuthError(string Error, string Description);
}

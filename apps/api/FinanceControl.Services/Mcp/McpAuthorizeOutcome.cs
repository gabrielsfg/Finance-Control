namespace FinanceControl.Services.Mcp
{
    /// <summary>
    /// Where /oauth/authorize sends the browser. Before the redirect URI is validated an
    /// error cannot be redirected anywhere — it is shown directly (<see cref="DirectError"/>);
    /// after, errors travel to the client in the redirect like a code would.
    /// </summary>
    public sealed record McpAuthorizeOutcome(string? RedirectUrl, McpOAuthError? DirectError)
    {
        public static McpAuthorizeOutcome Redirect(string url) => new(url, null);
        public static McpAuthorizeOutcome Fail(string error, string description) => new(null, new McpOAuthError(error, description));
    }
}

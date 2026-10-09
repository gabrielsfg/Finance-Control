namespace FinanceControl.Services.Mcp
{
    /// <summary>Who an MCP bearer token belongs to and what it may read.</summary>
    public sealed record McpPrincipal(
        int UserId,
        IReadOnlyList<string> Scopes,
        int? GrantId,
        int? PersonalTokenId);
}

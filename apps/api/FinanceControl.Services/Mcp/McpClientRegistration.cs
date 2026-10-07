namespace FinanceControl.Services.Mcp
{
    /// <summary>The fields of an RFC 7591 registration request this server uses.</summary>
    public sealed record McpClientRegistration(
        string? ClientName,
        string? ClientUri,
        IReadOnlyList<string> RedirectUris,
        string? TokenEndpointAuthMethod);
}

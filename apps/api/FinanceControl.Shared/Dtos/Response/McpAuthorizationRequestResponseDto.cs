namespace FinanceControl.Shared.Dtos.Response
{
    /// <summary>What the consent page shows before the user allows or denies a connection.</summary>
    public class McpAuthorizationRequestResponseDto
    {
        public string RequestId { get; set; } = string.Empty;
        public string ClientName { get; set; } = string.Empty;
        public string? ClientUri { get; set; }
        public string RedirectHost { get; set; } = string.Empty;
        public List<McpScopeResponseDto> Scopes { get; set; } = [];
        public DateTime ExpiresAt { get; set; }
    }
}

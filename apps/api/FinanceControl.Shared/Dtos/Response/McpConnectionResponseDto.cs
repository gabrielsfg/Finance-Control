namespace FinanceControl.Shared.Dtos.Response
{
    /// <summary>An AI application connected through OAuth.</summary>
    public class McpConnectionResponseDto
    {
        public int Id { get; set; }
        public string ClientName { get; set; } = string.Empty;
        public string? ClientUri { get; set; }

        /// <summary>Where the authorization was sent — the part of the client identity that can be trusted.</summary>
        public string RedirectHost { get; set; } = string.Empty;

        public List<string> Scopes { get; set; } = [];
        public DateTime CreatedAt { get; set; }
        public DateTime? LastUsedAt { get; set; }
    }
}

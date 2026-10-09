namespace FinanceControl.Shared.Dtos.Response
{
    public class McpPersonalTokenResponseDto
    {
        public int Id { get; set; }
        public string Name { get; set; } = string.Empty;

        /// <summary>The first characters of the token; the full value is never returned again.</summary>
        public string Prefix { get; set; } = string.Empty;

        public List<string> Scopes { get; set; } = [];
        public DateTime CreatedAt { get; set; }
        public DateTime ExpiresAt { get; set; }
        public DateTime? LastUsedAt { get; set; }
    }
}

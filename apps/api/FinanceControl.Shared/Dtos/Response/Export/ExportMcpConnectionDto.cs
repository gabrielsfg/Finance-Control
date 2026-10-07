namespace FinanceControl.Shared.Dtos.Response.Export
{
    /// <summary>An AI application the user authorised to read their data. Never includes tokens.</summary>
    public class ExportMcpConnectionDto
    {
        public string ClientName { get; set; } = string.Empty;
        public string Scopes { get; set; } = string.Empty;
        public DateTime CreatedAt { get; set; }
        public DateTime? LastUsedAt { get; set; }
        public DateTime? RevokedAt { get; set; }
    }
}

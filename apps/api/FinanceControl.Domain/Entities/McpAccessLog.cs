using FinanceControl.Domain.Common;

namespace FinanceControl.Domain.Entities
{
    /// <summary>
    /// One MCP tool call: who, through which connection, which tool, whether it failed.
    /// Deliberately without the arguments or the result — the log proves access happened
    /// without becoming a second copy of the user's financial data.
    /// </summary>
    public class McpAccessLog : OwnedEntity
    {
        public int? GrantId { get; set; }
        public int? PersonalTokenId { get; set; }
        public string ToolName { get; set; } = string.Empty;
        public bool IsError { get; set; }
        public int DurationMs { get; set; }
    }
}

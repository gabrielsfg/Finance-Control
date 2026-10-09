using FinanceControl.Domain.Common;
using FinanceControl.Shared.Enums;

namespace FinanceControl.Domain.Entities
{
    /// <summary>
    /// An AI application that asked to connect to the MCP server — Claude, ChatGPT,
    /// Cursor, Codex... Not user-owned: one row serves every user who connects that app.
    /// </summary>
    /// <remarks>
    /// Clients are public (no secret) and self-registered, as the MCP authorization spec
    /// expects: the user's AI is by definition a client this server has never seen. What
    /// protects the user is PKCE, exact redirect URI matching and the consent screen,
    /// which shows the redirect host — the name is chosen by the client and proves nothing.
    /// </remarks>
    public class McpClient : BaseEntity
    {
        public string ClientId { get; set; } = string.Empty;
        public string ClientName { get; set; } = string.Empty;
        public string? ClientUri { get; set; }

        /// <summary>JSON array of the exact redirect URIs allowed for this client.</summary>
        public string RedirectUris { get; set; } = "[]";

        public EnumMcpClientSource Source { get; set; }

        /// <summary>When a metadata document was last fetched, to refresh it now and then.</summary>
        public DateTime? MetadataFetchedAt { get; set; }
    }
}

using FinanceControl.Domain.Common;

namespace FinanceControl.Domain.Entities
{
    /// <summary>
    /// A token the user generates by hand for MCP clients configured by file rather than
    /// through OAuth (Codex's bearer_token_env_var, Cursor's headers). Shown once, stored
    /// only as a hash, scoped and always expiring.
    /// </summary>
    public class McpPersonalToken : OwnedEntity
    {
        public string Name { get; set; } = string.Empty;
        public string TokenHash { get; set; } = string.Empty;

        /// <summary>The first characters of the token, so the user can tell tokens apart.</summary>
        public string Prefix { get; set; } = string.Empty;

        public string Scopes { get; set; } = string.Empty;
        public DateTime ExpiresAt { get; set; }
        public DateTime? LastUsedAt { get; set; }
        public DateTime? RevokedAt { get; set; }

        public User User { get; set; } = null!;
    }
}

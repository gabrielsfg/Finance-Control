using FinanceControl.Domain.Common;

namespace FinanceControl.Domain.Entities
{
    /// <summary>
    /// One AI application connected to one user's account through OAuth — a row on the
    /// "Conexões de IA" screen. Revoking it kills its tokens on the next request.
    /// </summary>
    /// <remarks>
    /// Tokens are opaque random strings stored only as SHA-256 hashes, so a database leak
    /// does not hand out working credentials. One access token and one refresh token are
    /// live at a time; a refresh rotates both.
    /// </remarks>
    public class McpGrant : OwnedEntity
    {
        public string ClientId { get; set; } = string.Empty;

        /// <summary>Copied at consent time, so the list still reads right if the client re-registers.</summary>
        public string ClientName { get; set; } = string.Empty;

        public string RedirectUri { get; set; } = string.Empty;
        public string Scopes { get; set; } = string.Empty;

        public string? CodeHash { get; set; }
        public string? CodeChallenge { get; set; }
        public DateTime? CodeExpiresAt { get; set; }

        public string? AccessTokenHash { get; set; }
        public DateTime? AccessTokenExpiresAt { get; set; }

        public string? RefreshTokenHash { get; set; }
        public DateTime? RefreshTokenExpiresAt { get; set; }

        public DateTime? LastUsedAt { get; set; }
        public DateTime? RevokedAt { get; set; }

        public User User { get; set; } = null!;
    }
}

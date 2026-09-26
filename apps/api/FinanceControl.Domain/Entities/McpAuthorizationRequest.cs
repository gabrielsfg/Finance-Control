using FinanceControl.Domain.Common;
using FinanceControl.Shared.Enums;

namespace FinanceControl.Domain.Entities
{
    /// <summary>
    /// A validated /oauth/authorize call waiting for the user on the consent page. The
    /// browser only ever carries <see cref="PublicId"/>; everything the client sent stays
    /// here, so the consent page cannot be tricked into approving different parameters.
    /// </summary>
    public class McpAuthorizationRequest : BaseEntity
    {
        /// <summary>Random, unguessable id used in the consent page URL.</summary>
        public string PublicId { get; set; } = string.Empty;

        public string ClientId { get; set; } = string.Empty;
        public string RedirectUri { get; set; } = string.Empty;
        public string CodeChallenge { get; set; } = string.Empty;

        /// <summary>Space-separated, already narrowed to the scopes this server knows.</summary>
        public string Scopes { get; set; } = string.Empty;

        public string? State { get; set; }
        public string? Resource { get; set; }

        public EnumMcpAuthorizationStatus Status { get; set; } = EnumMcpAuthorizationStatus.Pending;
        public DateTime ExpiresAt { get; set; }

        /// <summary>The user who answered the consent page.</summary>
        public int? UserId { get; set; }
    }
}

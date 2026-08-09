namespace FinanceControl.Domain.Entities
{
    /// <summary>
    /// A device the user chose to trust, so two-factor is not asked again on it until
    /// <see cref="ExpiresAt"/>. The raw token lives on the client — an HttpOnly cookie
    /// on web, secure storage on mobile — and only its hash is kept here.
    /// </summary>
    /// <remarks>
    /// Trusting a device weakens two-factor by design: whoever holds the token skips the
    /// second step. That is why the token is high-entropy random (not derived from
    /// anything guessable), single-purpose, and revoked whenever the password changes.
    /// </remarks>
    public class TrustedDevice
    {
        public int Id { get; set; }
        public int UserId { get; set; }
        public string TokenHash { get; set; } = string.Empty;

        /// <summary>Shown when listing devices — a trimmed user agent, or a name sent by the app.</summary>
        public string? DeviceName { get; set; }

        public DateTime ExpiresAt { get; set; }
        public DateTime CreatedAt { get; set; }
        public DateTime LastUsedAt { get; set; }
        public bool IsRevoked { get; set; } = false;

        public User User { get; set; } = null!;
    }
}

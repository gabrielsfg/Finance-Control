using FinanceControl.Shared.Enums;

namespace FinanceControl.Domain.Entities
{
    /// <summary>
    /// A one-time 6-digit code emailed to the user: account verification, password
    /// reset and two-factor login all share this table, told apart by <see cref="Purpose"/>.
    /// </summary>
    /// <remarks>
    /// The code itself is never stored — only an HMAC of it. Unlike refresh tokens,
    /// a 6-digit code has just a million possibilities, so a plain hash would fall to
    /// an offline sweep if the database leaked. Keying the HMAC with the application
    /// secret means the rows alone are useless.
    ///
    /// The row is always found by <see cref="UserId"/> + <see cref="Purpose"/> and the
    /// code is compared afterwards, never looked up by the code: that is what makes
    /// <see cref="Attempts"/> enforceable, and it is the real defence here — short
    /// expiry plus a handful of tries, not the size of the code.
    /// </remarks>
    public class SecurityCode
    {
        public int Id { get; set; }
        public int UserId { get; set; }
        public EnumSecurityCodePurpose Purpose { get; set; }
        public string CodeHash { get; set; } = string.Empty;

        /// <summary>
        /// Only set for <see cref="EnumSecurityCodePurpose.TwoFactor"/>: proof that the
        /// password step already succeeded. Without it, knowing an email address would
        /// be enough to start guessing two-factor codes.
        /// </summary>
        public string? ChallengeTokenHash { get; set; }

        public DateTime ExpiresAt { get; set; }
        public DateTime CreatedAt { get; set; }
        public DateTime? ConsumedAt { get; set; }
        public int Attempts { get; set; }

        public User User { get; set; } = null!;
    }
}

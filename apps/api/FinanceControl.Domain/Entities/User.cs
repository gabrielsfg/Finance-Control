using FinanceControl.Domain.Common;
using FinanceControl.Shared.Enums;

namespace FinanceControl.Domain.Entities
{
    public class User : BaseEntity
    {
        public string Email { get; set; }
        public string PasswordHash { get; set; }
        public string Name { get; set; }
        public Boolean IsActive { get; set; } = true;

        /// <summary>
        /// When the address was confirmed. Null means the account was created but never
        /// verified, and login is refused until it is — the email is the only way back
        /// into the account, so it has to be proven before it is relied on.
        /// </summary>
        public DateTime? EmailVerifiedAt { get; set; }

        /// <summary>Opt-in, off by default: ask for an emailed code on every untrusted device.</summary>
        public bool TwoFactorEnabled { get; set; } = false;

        public int FailedLoginAttempts { get; set; } = 0;
        public DateTime? LockoutEnd { get; set; }

        // The plan is no longer a column here: it is whatever the live Subscription grants
        // (see SubscriptionRules), so it can never drift from what was actually paid.

        /// <summary>
        /// The user's switch for every in-app AI feature (chat, analyses, import
        /// categorisation). On by default for Premium; switching it off is the objection
        /// right the privacy policy offers, so no model call may go out while it is false.
        /// It does not touch the MCP connector, which the user authorises separately.
        /// </summary>
        public bool AiEnabled { get; set; } = true;

        public string PreferredCurrency { get; set; } = "BRL";
        public string PreferredLanguage { get; set; } = "pt-BR";
        public string? Country { get; set; }
    }
}

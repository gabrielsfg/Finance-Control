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
        /// <summary>
        /// Entitlement for the paid features. Free is the only value the app itself ever
        /// writes; Premium is set through the admin endpoint until the payment gateway
        /// exists and takes over.
        /// </summary>
        public EnumUserPlan Plan { get; set; } = EnumUserPlan.Free;

        public string PreferredCurrency { get; set; } = "BRL";
        public string PreferredLanguage { get; set; } = "pt-BR";
        public string? Country { get; set; }
    }
}

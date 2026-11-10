using FinanceControl.Domain.Common;
using FinanceControl.Shared.Enums;

namespace FinanceControl.Domain.Entities
{
    /// <summary>
    /// A refund Asaas could not make — a paid boleto, or a refund it refused (an
    /// insufficient balance, for one) — and that someone has to pay back by hand, by Pix
    /// or transfer, within 48 hours. The app's inbox gets an e-mail for each one.
    /// </summary>
    /// <remarks>
    /// Internal only: no endpoint reads this table. UserId is a plain column, not a foreign
    /// key, and the name and e-mail are copied in, because the refund is still owed after
    /// the account is deleted — deleting an account is one of the ways to get here.
    /// </remarks>
    public class ManualRefund : BaseEntity
    {
        public int UserId { get; set; }
        public string UserName { get; set; } = string.Empty;
        public string UserEmail { get; set; } = string.Empty;

        public int? SubscriptionChargeId { get; set; }
        public string? AsaasCustomerId { get; set; }
        public string? AsaasPaymentId { get; set; }
        public EnumBillingMethod BillingMethod { get; set; }

        /// <summary>Cents.</summary>
        public int Amount { get; set; }

        /// <summary>Why it is owed ("Direito de arrependimento"…) and why Asaas could not do it.</summary>
        public string Reason { get; set; } = string.Empty;

        /// <summary>When the app's inbox accepted the notice. Null: the hourly job tries again.</summary>
        public DateTime? NotifiedAt { get; set; }

        /// <summary>Filled in by hand once the money has gone back.</summary>
        public DateTime? ResolvedAt { get; set; }
    }
}

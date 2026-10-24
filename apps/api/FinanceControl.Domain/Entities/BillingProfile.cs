using FinanceControl.Domain.Common;

namespace FinanceControl.Domain.Entities
{
    /// Everything the billing gateway needs to know about a user, kept apart from the
    /// subscriptions themselves: it outlives any one of them (cancel, then subscribe again
    /// months later), and it is the only place that ties the user to Asaas.
    public class BillingProfile : OwnedEntity
    {
        /// The "cus_..." id at Asaas. Null until the first subscription attempt.
        public string? AsaasCustomerId { get; set; }

        /// HMAC of the CPF, never the CPF itself. Enough to enforce one trial per person
        /// and useless to anyone who reads the table — the CPF lives at Asaas.
        public string? CpfHash { get; set; }

        /// The Asaas card token, encrypted at rest. It charges the card without the card,
        /// so a leaked table must not hand it out in clear.
        public string? CardTokenCipher { get; set; }
        public string? CardBrand { get; set; }
        public string? CardLast4 { get; set; }

        /// Set when a trial starts. One per user; the CPF rule covers new accounts.
        public DateTime? TrialConsumedAt { get; set; }

        /// Declined-card counter for the current window — the brake on card testing.
        public int CardFailureCount { get; set; }
        public DateTime? CardFailureWindowStart { get; set; }
    }
}

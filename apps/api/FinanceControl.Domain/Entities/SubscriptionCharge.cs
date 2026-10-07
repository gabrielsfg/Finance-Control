using FinanceControl.Domain.Common;
using FinanceControl.Shared.Enums;

namespace FinanceControl.Domain.Entities
{
    /// One charge for one period of a subscription, mirrored from Asaas.
    public class SubscriptionCharge : OwnedEntity
    {
        public int SubscriptionId { get; set; }
        public Subscription Subscription { get; set; } = null!;

        /// "sub-{id}-{periodStart}". Unique, and sent to Asaas as externalReference, so a
        /// retry after a timeout finds the charge that was made instead of making another.
        public string IdempotencyKey { get; set; } = string.Empty;

        /// What this charge buys. The subscription takes these when it is paid, which is
        /// how a scheduled plan change lands exactly at the renewal.
        public EnumSubscriptionPlan Plan { get; set; }
        public EnumBillingCycle Cycle { get; set; }
        public EnumBillingMethod BillingMethod { get; set; }
        public int InstallmentCount { get; set; } = 1;

        /// Total in cents (all installments together).
        public int Amount { get; set; }

        public DateTime PeriodStart { get; set; }
        public DateTime PeriodEnd { get; set; }
        public DateOnly DueDate { get; set; }

        public EnumChargeStatus Status { get; set; }

        public string? AsaasPaymentId { get; set; }
        public string? AsaasInstallmentId { get; set; }

        public string? InvoiceUrl { get; set; }
        public string? BankSlipUrl { get; set; }

        /// Pix copy-and-paste code and QR image, cached from Asaas until they expire.
        public string? PixPayload { get; set; }
        public string? PixQrImage { get; set; }
        public DateTime? PixExpiresAt { get; set; }

        public DateTime? ConfirmedAt { get; set; }
        public DateTime? RefundedAt { get; set; }
        public string? FailureReason { get; set; }
    }
}

using FinanceControl.Domain.Common;
using FinanceControl.Shared.Enums;

namespace FinanceControl.Domain.Entities
{
    /// <summary>
    /// A paid (or refunded) charge copied out of an account when the account is deleted.
    /// The tax and consumer-protection periods outlive the account, so the money trail is
    /// kept — without the user's name, e-mail or financial data — and deleted after the
    /// retention period.
    /// </summary>
    /// <remarks>
    /// No foreign key on purpose: <see cref="FormerUserId"/> only ties the rows of one
    /// account together. The customer's identity stays at Asaas, reachable through
    /// <see cref="AsaasCustomerId"/>, and on the NFS-e itself.
    /// </remarks>
    public class BillingRecord : BaseEntity
    {
        public int FormerUserId { get; set; }
        public string? AsaasCustomerId { get; set; }
        public string? CpfHash { get; set; }

        public EnumSubscriptionPlan Plan { get; set; }
        public EnumBillingCycle Cycle { get; set; }
        public EnumBillingMethod BillingMethod { get; set; }
        public int InstallmentCount { get; set; } = 1;

        /// Cents, all installments together.
        public int Amount { get; set; }
        public int? RefundedAmount { get; set; }
        public EnumChargeStatus Status { get; set; }

        public DateTime PeriodStart { get; set; }
        public DateTime PeriodEnd { get; set; }
        public DateOnly DueDate { get; set; }
        public DateTime? ConfirmedAt { get; set; }
        public DateTime? RefundedAt { get; set; }

        public string? AsaasPaymentId { get; set; }
        public string? AsaasInstallmentId { get; set; }
        public string? AsaasInvoiceId { get; set; }
        public string? InvoicePdfUrl { get; set; }
    }
}

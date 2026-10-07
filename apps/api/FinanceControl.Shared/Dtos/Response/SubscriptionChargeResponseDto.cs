using FinanceControl.Shared.Enums;

namespace FinanceControl.Shared.Dtos.Response
{
    public class SubscriptionChargeResponseDto
    {
        public int Id { get; set; }
        public EnumSubscriptionPlan Plan { get; set; }
        public EnumBillingCycle Cycle { get; set; }
        public EnumBillingMethod BillingMethod { get; set; }

        /// Total in cents.
        public int Amount { get; set; }
        public int InstallmentCount { get; set; }
        public EnumChargeStatus Status { get; set; }
        public DateOnly DueDate { get; set; }
        public DateTime PeriodStart { get; set; }
        public DateTime PeriodEnd { get; set; }
        public DateTime? ConfirmedAt { get; set; }
        public DateTime? RefundedAt { get; set; }

        /// Asaas' payment page (works for Pix and Boleto).
        public string? InvoiceUrl { get; set; }
        public string? BankSlipUrl { get; set; }
    }
}

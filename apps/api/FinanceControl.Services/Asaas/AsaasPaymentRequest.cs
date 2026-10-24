namespace FinanceControl.Services.Asaas
{
    /// <summary>A charge, or an installment plan when <see cref="InstallmentCount"/> is set.</summary>
    /// <remarks>
    /// With a card token the charge is processed on the spot — <see cref="DueDate"/> does
    /// not schedule the capture. A decline comes back as HTTP 400 and nothing is created.
    /// </remarks>
    public class AsaasPaymentRequest
    {
        public string Customer { get; set; } = string.Empty;

        /// CREDIT_CARD, PIX or BOLETO.
        public string BillingType { get; set; } = string.Empty;

        /// Single charge amount in reais. Null for an installment plan.
        public decimal? Value { get; set; }

        /// "yyyy-MM-dd".
        public string DueDate { get; set; } = string.Empty;
        public string? Description { get; set; }

        /// Our idempotency key — how a retry finds the charge it already made.
        public string? ExternalReference { get; set; }

        /// Installment plan: count plus the total, which Asaas splits.
        public int? InstallmentCount { get; set; }
        public decimal? TotalValue { get; set; }

        public string? CreditCardToken { get; set; }
        public string? RemoteIp { get; set; }
    }
}

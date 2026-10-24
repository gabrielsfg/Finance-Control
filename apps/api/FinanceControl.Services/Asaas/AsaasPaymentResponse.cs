namespace FinanceControl.Services.Asaas
{
    /// <summary>The payment object, as returned by the API and carried inside webhooks.</summary>
    /// <remarks>
    /// Statuses stay strings: Asaas adds values over time, and an enum that fails to
    /// parse a new one would turn a harmless webhook into a stuck queue.
    /// </remarks>
    public class AsaasPaymentResponse
    {
        public string Id { get; set; } = string.Empty;
        public string? Customer { get; set; }
        public string? Status { get; set; }
        public string? BillingType { get; set; }
        public decimal Value { get; set; }

        /// Set when the payment belongs to an installment plan.
        public string? Installment { get; set; }
        public int? InstallmentNumber { get; set; }

        public string? DueDate { get; set; }
        public string? ExternalReference { get; set; }
        public string? InvoiceUrl { get; set; }
        public string? BankSlipUrl { get; set; }
        public bool Deleted { get; set; }
    }
}

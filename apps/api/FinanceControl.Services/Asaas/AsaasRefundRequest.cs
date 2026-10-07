namespace FinanceControl.Services.Asaas
{
    public class AsaasRefundRequest
    {
        /// Null refunds the full amount.
        public decimal? Value { get; set; }
        public string? Description { get; set; }
    }
}

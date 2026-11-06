namespace FinanceControl.Services.Asaas
{
    /// <summary>"Agendar nota fiscal" (POST /invoices). One of payment or installment is the origin.</summary>
    public class AsaasInvoiceRequest
    {
        public string? Payment { get; set; }
        public string? Installment { get; set; }
        public string ServiceDescription { get; set; } = string.Empty;
        public string Observations { get; set; } = string.Empty;
        public string? ExternalReference { get; set; }

        /// Total in reais.
        public decimal Value { get; set; }
        public decimal Deductions { get; set; }

        /// yyyy-MM-dd.
        public string EffectiveDate { get; set; } = string.Empty;

        public string? MunicipalServiceId { get; set; }
        public string? MunicipalServiceCode { get; set; }
        public string MunicipalServiceName { get; set; } = string.Empty;
        public AsaasInvoiceTaxes Taxes { get; set; } = new();
    }
}

namespace FinanceControl.Services.Asaas
{
    /// <summary>The invoice object. Status: SCHEDULED, AUTHORIZED, PROCESSING_CANCELLATION, CANCELED, CANCELLATION_DENIED, ERROR.</summary>
    public class AsaasInvoiceResponse
    {
        public string Id { get; set; } = string.Empty;
        public string? Status { get; set; }
        public string? StatusDescription { get; set; }
        public string? PdfUrl { get; set; }
        public string? Number { get; set; }
    }
}

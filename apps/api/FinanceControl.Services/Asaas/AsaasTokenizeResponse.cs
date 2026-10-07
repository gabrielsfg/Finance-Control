namespace FinanceControl.Services.Asaas
{
    public class AsaasTokenizeResponse
    {
        /// Last four digits only.
        public string? CreditCardNumber { get; set; }
        public string? CreditCardBrand { get; set; }
        public string CreditCardToken { get; set; } = string.Empty;
    }
}

namespace FinanceControl.Services.Asaas
{
    public class AsaasTokenizeRequest
    {
        public string Customer { get; set; } = string.Empty;
        public AsaasCreditCard CreditCard { get; set; } = new();
        public AsaasCreditCardHolderInfo CreditCardHolderInfo { get; set; } = new();

        /// The payer's device IP, not the server's — Asaas scores fraud on it.
        public string RemoteIp { get; set; } = string.Empty;

        public override string ToString() => "[tokenize request redacted]";
    }
}

namespace FinanceControl.Services.Asaas
{
    public class AsaasPixQrCodeResponse
    {
        /// PNG, base64-encoded.
        public string EncodedImage { get; set; } = string.Empty;

        /// The copy-and-paste code.
        public string Payload { get; set; } = string.Empty;

        /// "yyyy-MM-dd HH:mm:ss".
        public string? ExpirationDate { get; set; }
    }
}

namespace FinanceControl.Shared.Dtos.Response
{
    public class SubscriptionPixQrCodeResponseDto
    {
        /// Copy-and-paste code.
        public string Payload { get; set; } = string.Empty;

        /// PNG, base64-encoded.
        public string QrImageBase64 { get; set; } = string.Empty;
        public DateTime? ExpiresAt { get; set; }

        /// Cents.
        public int Amount { get; set; }
        public DateOnly DueDate { get; set; }
    }
}

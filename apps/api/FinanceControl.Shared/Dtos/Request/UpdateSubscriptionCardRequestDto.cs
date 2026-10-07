namespace FinanceControl.Shared.Dtos.Request
{
    /// Replaces the card that renews the subscription. Asaas wants the holder data again
    /// with every card, so the form asks for it alongside.
    public class UpdateSubscriptionCardRequestDto
    {
        public string Cpf { get; set; } = string.Empty;
        public string MobilePhone { get; set; } = string.Empty;
        public string PostalCode { get; set; } = string.Empty;
        public string AddressNumber { get; set; } = string.Empty;
        public SubscriptionCardRequestDto Card { get; set; } = new();
        public string? CaptchaToken { get; set; }

        public override string ToString() => "UpdateSubscriptionCard";
    }
}

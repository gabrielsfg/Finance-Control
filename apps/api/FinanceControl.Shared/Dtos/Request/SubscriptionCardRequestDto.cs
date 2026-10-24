namespace FinanceControl.Shared.Dtos.Request
{
    /// <summary>Card data typed in our form, forwarded to Asaas and then forgotten.</summary>
    /// <remarks>
    /// Never stored and never logged: <see cref="ToString"/> is masked, and the validator
    /// messages never echo the value back.
    /// </remarks>
    public class SubscriptionCardRequestDto
    {
        public string HolderName { get; set; } = string.Empty;
        public string Number { get; set; } = string.Empty;
        public string ExpiryMonth { get; set; } = string.Empty;
        public string ExpiryYear { get; set; } = string.Empty;
        public string Cvv { get; set; } = string.Empty;

        public override string ToString() => "[card redacted]";
    }
}

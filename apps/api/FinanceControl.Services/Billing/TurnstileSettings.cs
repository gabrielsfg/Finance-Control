namespace FinanceControl.Services.Billing
{
    /// <summary>Cloudflare Turnstile, guarding the card form against automated card testing.</summary>
    /// <remarks>An empty secret turns the check off — the local development default.</remarks>
    public class TurnstileSettings
    {
        public string SecretKey { get; set; } = string.Empty;
        public string VerifyUrl { get; set; } = "https://challenges.cloudflare.com/turnstile/v0/siteverify";
    }
}

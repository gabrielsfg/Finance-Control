namespace FinanceControl.Shared.Dtos.Request
{
    public class TwoFactorLoginRequestDto
    {
        /// <summary>Returned by the login call that answered <c>TwoFactorRequired</c>.</summary>
        public string ChallengeToken { get; set; }

        public string Code { get; set; }

        /// <summary>Skip two-factor on this device until the trust expires.</summary>
        public bool TrustDevice { get; set; }

        /// <summary>Optional label for the device list. Web falls back to the user agent.</summary>
        public string? DeviceName { get; set; }
    }
}

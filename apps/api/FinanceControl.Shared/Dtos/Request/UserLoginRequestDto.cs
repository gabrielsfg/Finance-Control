namespace FinanceControl.Shared.Dtos.Request
{
    public class UserLoginRequestDto
    {
        public string Email { get; set; }
        public string Password { get; set; }

        /// <summary>
        /// Mobile only — the trust token kept in secure storage, which lets a known device
        /// skip two-factor. Web sends the same value automatically as an HttpOnly cookie,
        /// so browsers leave this null.
        /// </summary>
        public string? TrustedDeviceToken { get; set; }
    }
}

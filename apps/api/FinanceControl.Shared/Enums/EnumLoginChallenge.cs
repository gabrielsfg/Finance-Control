namespace FinanceControl.Shared.Enums
{
    /// <summary>
    /// Why a login with the right password did not return tokens. Serialized as a string,
    /// so the clients branch on the name rather than on an HTTP status code.
    /// </summary>
    public enum EnumLoginChallenge
    {
        /// <summary>The address was never confirmed. A new code has been sent.</summary>
        EmailNotVerified,

        /// <summary>Two-factor is on and this device is not trusted. A code has been sent.</summary>
        TwoFactorRequired
    }
}

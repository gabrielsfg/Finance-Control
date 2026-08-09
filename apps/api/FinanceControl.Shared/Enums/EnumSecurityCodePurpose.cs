namespace FinanceControl.Shared.Enums
{
    public enum EnumSecurityCodePurpose
    {
        /// <summary>Confirms the address at registration. Login is blocked until it is used.</summary>
        AccountVerification,

        /// <summary>Authorises a password reset.</summary>
        PasswordReset,

        /// <summary>Second step of a login, after the password succeeded.</summary>
        TwoFactor
    }
}

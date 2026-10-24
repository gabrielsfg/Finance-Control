namespace FinanceControl.Shared.Enums
{
    public enum EnumBankAccountLinkAction
    {
        /// Create a new app account for the bank account.
        Create,
        /// Import into an app account the user already has.
        Link,
        Ignore
    }
}

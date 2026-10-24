namespace FinanceControl.Shared.Enums
{
    /// What the user decided for one bank account found in a connection.
    public enum EnumBankAccountLinkStatus
    {
        /// Found at the bank, not reviewed yet: nothing is imported.
        PendingLink,
        /// Transactions are imported into the linked app account.
        Linked,
        /// The user does not want this account in the app.
        Ignored
    }
}

namespace FinanceControl.Shared.Enums
{
    /// How a bank investment position relates to the user's portfolio.
    public enum EnumBankInvestmentLinkStatus
    {
        /// Imported into the portfolio and kept up to date by each sync.
        Active,
        /// The user already had this asset in the portfolio by hand; their position is left
        /// untouched and the bank's is not added on top of it.
        MatchedExisting,
        /// The user deleted the imported position; the sync does not bring it back.
        Dismissed,
        /// The bank reports the position fully redeemed.
        Closed
    }
}

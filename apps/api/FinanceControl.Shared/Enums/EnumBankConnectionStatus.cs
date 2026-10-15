namespace FinanceControl.Shared.Enums
{
    /// Our reading of a Pluggy item's status, reduced to what the screen has to say.
    public enum EnumBankConnectionStatus
    {
        /// Pluggy is collecting data right now.
        Syncing,
        /// Last sync succeeded.
        Active,
        /// Last sync succeeded for some products only (bank unavailable for the rest, or an
        /// Open Finance monthly cap was hit).
        PartiallyUpdated,
        /// The bank failed on Pluggy's side; Pluggy retries on its own.
        Outdated,
        /// Credentials or consent are no longer valid; only the user can fix it, by
        /// reconnecting through the widget.
        NeedsReconnect,
        /// The bank is waiting for the user (MFA, approval in the bank's app).
        WaitingUser,
        /// Removed by the user, or deleted at Pluggy.
        Disconnected
    }
}

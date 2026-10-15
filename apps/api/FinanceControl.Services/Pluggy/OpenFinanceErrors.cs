namespace FinanceControl.Services.Pluggy
{
    /// <summary>
    /// Error codes the Open Finance endpoints answer with. The clients map each one to
    /// their own copy, so these are stable identifiers, not sentences.
    /// </summary>
    public static class OpenFinanceErrors
    {
        /// The feature is off or Pluggy is not configured.
        public const string Unavailable = "OPEN_FINANCE_UNAVAILABLE";
        public const string SubscriptionRequired = "SUBSCRIPTION_REQUIRED";
        /// The plan's number of connected banks is used up (Basic: 3).
        public const string ConnectionLimitReached = "CONNECTION_LIMIT_REACHED";
        public const string ConnectionNotFound = "CONNECTION_NOT_FOUND";
        public const string BankAccountNotFound = "BANK_ACCOUNT_NOT_FOUND";
        public const string AccountNotFound = "ACCOUNT_NOT_FOUND";
        public const string AccountAlreadyLinked = "ACCOUNT_ALREADY_LINKED";
        public const string AccountTypeMismatch = "ACCOUNT_TYPE_MISMATCH";
        public const string AlreadyLinked = "BANK_ACCOUNT_ALREADY_LINKED";
        public const string ReconnectRequired = "RECONNECT_REQUIRED";
        public const string SyncCooldown = "SYNC_COOLDOWN";
        public const string NothingToAdjust = "NOTHING_TO_ADJUST";

        /// Pluggy could not be reached or failed; worth trying again later.
        public const string ProviderUnavailable = "PROVIDER_UNAVAILABLE";

        /// Pluggy refused the request.
        public const string ProviderRejected = "PROVIDER_REJECTED";
    }
}

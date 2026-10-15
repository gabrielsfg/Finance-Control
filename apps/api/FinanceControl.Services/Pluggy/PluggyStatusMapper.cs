using FinanceControl.Shared.Enums;

namespace FinanceControl.Services.Pluggy
{
    /// <summary>
    /// Reads a Pluggy item's status and execution status as one of ours.
    /// </summary>
    /// <remarks>
    /// The execution status is checked first because it is the more specific of the two:
    /// an item can be OUTDATED because the bank is down (Pluggy retries) or because the
    /// user revoked the consent (only a reconnection helps).
    /// </remarks>
    public static class PluggyStatusMapper
    {
        private static readonly HashSet<string> ReconnectExecutionStatuses = new(StringComparer.OrdinalIgnoreCase)
        {
            "INVALID_CREDENTIALS",
            "INVALID_CREDENTIALS_MFA",
            "USER_AUTHORIZATION_NOT_GRANTED",
            "USER_AUTHORIZATION_REVOKED",
            "ACCOUNT_LOCKED",
            "ACCOUNT_NEEDS_ACTION",
            "ACCOUNT_CREDENTIALS_RESET",
            "USER_NOT_SUPPORTED",
            "USER_INPUT_TIMEOUT",
            "CONSENT_EXPIRED",
            "CONSENT_REVOKED"
        };

        public static EnumBankConnectionStatus Map(PluggyItem item, DateTime now)
        {
            if (item.ConsentExpiresAt is { } expiresAt && expiresAt <= now)
                return EnumBankConnectionStatus.NeedsReconnect;

            var execution = item.ExecutionStatus ?? string.Empty;
            if (ReconnectExecutionStatuses.Contains(execution))
                return EnumBankConnectionStatus.NeedsReconnect;
            if (execution.Equals("USER_AUTHORIZATION_PENDING", StringComparison.OrdinalIgnoreCase))
                return EnumBankConnectionStatus.WaitingUser;

            return (item.Status ?? string.Empty).ToUpperInvariant() switch
            {
                "UPDATING" => EnumBankConnectionStatus.Syncing,
                "UPDATED" => execution.Equals("PARTIAL_SUCCESS", StringComparison.OrdinalIgnoreCase)
                    ? EnumBankConnectionStatus.PartiallyUpdated
                    : EnumBankConnectionStatus.Active,
                "LOGIN_ERROR" => EnumBankConnectionStatus.NeedsReconnect,
                "WAITING_USER_INPUT" or "WAITING_USER_ACTION" => EnumBankConnectionStatus.WaitingUser,
                _ => EnumBankConnectionStatus.Outdated
            };
        }

        /// Whether the item's data can be read: a successful (even partial) last collection.
        public static bool HasFreshData(EnumBankConnectionStatus status) =>
            status is EnumBankConnectionStatus.Active or EnumBankConnectionStatus.PartiallyUpdated;
    }
}

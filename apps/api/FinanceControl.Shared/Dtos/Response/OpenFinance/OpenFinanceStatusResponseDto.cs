using FinanceControl.Shared.Enums;

namespace FinanceControl.Shared.Dtos.Response.OpenFinance
{
    /// What the screens need to decide how to show bank connections.
    public class OpenFinanceStatusResponseDto
    {
        /// The feature is switched on and Pluggy is configured.
        public bool Available { get; set; }

        /// The user has a subscription, so may connect banks.
        public bool HasAccess { get; set; }
        public EnumSubscriptionPlan? Plan { get; set; }

        /// Banks the plan allows connected at once. Null means no limit (Premium).
        public int? MaxConnections { get; set; }
        public int ActiveConnections { get; set; }

        /// Synced transactions the user has not confirmed yet.
        public int PendingReviewCount { get; set; }

        /// Connections that only the user can repair (reconnect) or that need accounts linked.
        public int ConnectionsNeedingAttention { get; set; }
    }
}

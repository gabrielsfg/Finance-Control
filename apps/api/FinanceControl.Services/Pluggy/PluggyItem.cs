namespace FinanceControl.Services.Pluggy
{
    public class PluggyItem
    {
        public string Id { get; set; } = string.Empty;
        public PluggyConnector? Connector { get; set; }
        public string? ClientUserId { get; set; }

        /// UPDATING, UPDATED, OUTDATED, LOGIN_ERROR, WAITING_USER_INPUT, WAITING_USER_ACTION.
        public string? Status { get; set; }

        /// SUCCESS, PARTIAL_SUCCESS, INVALID_CREDENTIALS, USER_AUTHORIZATION_PENDING, ...
        public string? ExecutionStatus { get; set; }
        public PluggyItemError? Error { get; set; }
        public DateTime? LastUpdatedAt { get; set; }
        public DateTime? NextAutoSyncAt { get; set; }
        public DateTime? ConsentExpiresAt { get; set; }
    }
}

namespace FinanceControl.Services.Pluggy
{
    /// <summary>
    /// The fields we read from a Pluggy webhook. Event-specific fields are null on the
    /// events that do not carry them; transactions/* events carry no clientUserId, so the
    /// user is always resolved through the item.
    /// </summary>
    public class PluggyWebhookPayload
    {
        public string? Event { get; set; }
        public string? EventId { get; set; }
        public string? ItemId { get; set; }
        public string? ClientUserId { get; set; }
        public string? AccountId { get; set; }
        public List<string>? TransactionIds { get; set; }
        public DateTime? TransactionsCreatedAtFrom { get; set; }
        public PluggyItemError? Error { get; set; }
    }
}

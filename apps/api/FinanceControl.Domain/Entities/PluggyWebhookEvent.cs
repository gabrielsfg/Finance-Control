using FinanceControl.Domain.Common;
using FinanceControl.Shared.Enums;

namespace FinanceControl.Domain.Entities
{
    /// <summary>
    /// A Pluggy notification as it arrived, or work we queued ourselves (event types
    /// starting with "internal/"). The endpoint only stores it; a worker applies the queue
    /// one event at a time, so two syncs of the same bank never run at once.
    /// </summary>
    public class PluggyWebhookEvent : BaseEntity
    {
        /// Pluggy's eventId (stable across redeliveries), or ours for internal work. Unique.
        public string EventId { get; set; } = string.Empty;
        public string EventType { get; set; } = string.Empty;
        public string? ItemId { get; set; }
        public string Payload { get; set; } = string.Empty;

        public EnumWebhookEventStatus Status { get; set; } = EnumWebhookEventStatus.Pending;
        public int Attempts { get; set; }
        public DateTime? NextAttemptAt { get; set; }
        public string? LastError { get; set; }
        public DateTime? ProcessedAt { get; set; }
    }
}

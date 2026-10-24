using FinanceControl.Domain.Common;
using FinanceControl.Shared.Enums;

namespace FinanceControl.Domain.Entities
{
    /// An Asaas notification as it arrived. The endpoint only stores it and answers 200;
    /// a worker applies it later, so a slow or failing handler never pauses Asaas' queue.
    public class AsaasWebhookEvent : BaseEntity
    {
        /// Asaas' event id. Unique: redeliveries of the same event are dropped on insert.
        public string EventId { get; set; } = string.Empty;
        public string EventType { get; set; } = string.Empty;
        public string Payload { get; set; } = string.Empty;

        public EnumWebhookEventStatus Status { get; set; } = EnumWebhookEventStatus.Pending;
        public int Attempts { get; set; }
        public DateTime? NextAttemptAt { get; set; }
        public string? LastError { get; set; }
        public DateTime? ProcessedAt { get; set; }
    }
}

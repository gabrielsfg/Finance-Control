using FinanceControl.Domain.Common;
using FinanceControl.Shared.Enums;

namespace FinanceControl.Domain.Entities
{
    public class Notification : OwnedEntity
    {
        public EnumNotificationType Type { get; set; }
        public string Title { get; set; }
        public string Body { get; set; }

        // Optional in-app deep link the bell item navigates to (e.g. "/transactions").
        public string? ActionUrl { get; set; }

        public bool IsRead { get; set; }
        public DateTime? ReadAt { get; set; }

        // Idempotency key. When set, the service refuses to create a second
        // notification with the same (UserId, DedupeKey) — keeps jobs from
        // spamming the same alert (e.g. "budget 80% for 2026-06").
        public string? DedupeKey { get; set; }
    }
}

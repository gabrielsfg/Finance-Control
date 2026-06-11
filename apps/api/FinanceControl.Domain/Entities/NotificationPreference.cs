using FinanceControl.Domain.Common;

namespace FinanceControl.Domain.Entities
{
    // One row per user. Controls which automatic notifications fire and their
    // lead time / threshold. A user with no row is treated as all-enabled defaults.
    public class NotificationPreference : OwnedEntity
    {
        public bool RecurrenceChargedEnabled { get; set; } = true;

        public bool CardDueEnabled { get; set; } = true;
        public int CardDueDaysAhead { get; set; } = 3;

        public bool CardClosingEnabled { get; set; } = true;
        public int CardClosingDaysAhead { get; set; } = 3;

        public bool BudgetAlertEnabled { get; set; } = true;
        public int BudgetWarningPercent { get; set; } = 80;
    }
}

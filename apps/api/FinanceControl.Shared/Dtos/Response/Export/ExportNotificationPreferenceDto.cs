namespace FinanceControl.Shared.Dtos.Response.Export
{
    public class ExportNotificationPreferenceDto
    {
        public bool RecurrenceChargedEnabled { get; set; }
        public bool CardDueEnabled { get; set; }
        public int CardDueDaysAhead { get; set; }
        public bool CardClosingEnabled { get; set; }
        public int CardClosingDaysAhead { get; set; }
        public bool BudgetAlertEnabled { get; set; }
        public int BudgetWarningPercent { get; set; }
    }
}

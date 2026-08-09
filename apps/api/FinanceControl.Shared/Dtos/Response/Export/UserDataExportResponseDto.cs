namespace FinanceControl.Shared.Dtos.Response.Export
{
    /// <summary>
    /// Everything the account holds, in one document — the portability right in Art. 18
    /// of the LGPD.
    /// </summary>
    /// <remarks>
    /// Deliberately built from its own DTOs rather than the ones the screens use. The
    /// export is a legal artifact: a field disappearing from it because a UI response was
    /// reshaped would be a silent regression, and nobody would notice until someone asked
    /// for their data.
    /// </remarks>
    public class UserDataExportResponseDto
    {
        public DateTime ExportedAt { get; set; }

        /// <summary>Plain-language note travelling with the file: what is in it and what is not.</summary>
        public string Notice { get; set; } = string.Empty;

        public ExportUserProfileDto Profile { get; set; } = new();
        public ExportUserPreferencesDto? Preferences { get; set; }
        public List<ExportConsentDto> Consents { get; set; } = [];
        public List<ExportAccountDto> Accounts { get; set; } = [];
        public List<ExportCategoryDto> Categories { get; set; } = [];
        public List<ExportTagDto> Tags { get; set; } = [];
        public List<ExportTransactionDto> Transactions { get; set; } = [];
        public List<ExportRecurringTransactionDto> RecurringTransactions { get; set; } = [];
        public List<ExportBudgetDto> Budgets { get; set; } = [];
        public List<ExportGoalDto> Goals { get; set; } = [];
        public List<ExportInvestmentDto> Investments { get; set; } = [];
        public List<ExportAlertRuleDto> AlertRules { get; set; } = [];
        public ExportNotificationPreferenceDto? NotificationPreferences { get; set; }
    }
}

namespace FinanceControl.Services.Retention
{
    /// <summary>
    /// How long data is kept, bound from the "DataRetentionSettings" section. These are the
    /// periods the privacy policy promises; 0 switches a rule off.
    /// </summary>
    public class DataRetentionSettings
    {
        /// Technical records of AI calls (feature, tokens, outcome — no content).
        public int AiLogRetentionMonths { get; set; } = 12;

        /// An account without a live subscription is deleted, with all its data, this long
        /// after its last subscription ended (or after signup, if it never had one).
        public int InactiveAccountRetentionYears { get; set; } = 5;

        /// The warning e-mail goes out this long before that deletion; the account is only
        /// deleted once the warning is at least this old.
        public int InactiveAccountNoticeDays { get; set; } = 30;

        /// Accounts deleted per run, so a first run on an old base cannot take the job down.
        public int MaxAccountsPerRun { get; set; } = 100;

        /// Records of the queries made by the user's own AI (MCP), without content.
        public int McpAccessLogRetentionMonths { get; set; } = 12;

        /// Application access records (Marco Civil da Internet, art. 15: six months).
        public int AccessLogRetentionMonths { get; set; } = 6;

        /// Charges kept after the account is deleted (tax and consumer-protection periods).
        public int BillingRecordRetentionYears { get; set; } = 5;

        /// CPF hashes kept to grant the free trial once per person.
        public int TrialUsageRetentionYears { get; set; } = 5;
    }
}

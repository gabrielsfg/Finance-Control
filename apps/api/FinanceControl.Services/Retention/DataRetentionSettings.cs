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

        /// Accounts deleted per run, so a first run on an old base cannot take the job down.
        public int MaxAccountsPerRun { get; set; } = 100;
    }
}

namespace FinanceControl.Services.Pluggy
{
    /// <summary>
    /// Product rules for bank connections, bound from the "OpenFinanceSettings" section.
    /// </summary>
    /// <remarks>
    /// The feature ships dark: with Enabled off the endpoints refuse, the workers idle and
    /// the screens show the feature as unavailable. Turning it on is an explicit decision,
    /// because every connected bank is billed by Pluggy.
    /// </remarks>
    public class OpenFinanceSettings
    {
        public bool Enabled { get; set; }

        /// Connected banks (Pluggy items) a Basic subscriber may keep.
        public int BasicMaxConnections { get; set; } = 3;

        /// Connected banks a Premium subscriber may keep. Null means no limit.
        public int? PremiumMaxConnections { get; set; }

        /// Minimum time between two "sync now" requests on the same bank. Pluggy allows new
        /// teams one manual update per item per hour.
        public int ManualSyncCooldownMinutes { get; set; } = 60;

        /// How far back each sync re-reads a linked account. Pluggy itself re-collects the
        /// last 7 days on Open Finance, so anything shorter can miss late postings.
        public int SyncWindowDays { get; set; } = 10;

        /// Days before consent expiry from which the screens warn the user.
        public int ConsentExpiryNoticeDays { get; set; } = 15;
    }
}

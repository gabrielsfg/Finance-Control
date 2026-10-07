namespace FinanceControl.Services.Billing
{
    /// <summary>Subscription rules and the billing secrets, bound from "BillingSettings".</summary>
    public class BillingSettings
    {
        /// When false, the subscription gate lets everyone through — for local development
        /// of the rest of the app. Never false in production.
        public bool EnforceAccess { get; set; } = true;

        public int TrialDays { get; set; } = 30;

        /// Pix/Boleto: how many days before the period ends the renewal charge is created,
        /// the banner shows and the daily reminder emails start.
        public int RenewalNoticeDays { get; set; } = 5;

        /// Right of withdrawal (CDC art. 49): the first paid charge is refundable this long.
        public int RefundWindowDays { get; set; } = 7;

        /// Declined cards per user per rolling day before card attempts are refused — the
        /// brake on someone using the form to test stolen cards.
        public int MaxCardFailuresPerDay { get; set; } = 5;

        /// HMAC key for CPFs. Changing it orphans every stored hash (the trial rule forgets
        /// who already had one), so it is generated once and kept.
        public string CpfHashKey { get; set; } = string.Empty;

        /// Base64 of 32 random bytes. AES-GCM key for the stored card tokens; losing it
        /// means every customer has to type their card again.
        public string CardTokenKey { get; set; } = string.Empty;

        /// Used in email links ("cancel here", "pay the renewal").
        public string WebBaseUrl { get; set; } = "http://localhost:3000";

        /// Billing emails go out from this hour on (UTC; 11 = 08:00 in Brasília), so the
        /// hourly job does not send reminders at 3 a.m.
        public int EmailStartHourUtc { get; set; } = 11;
    }
}

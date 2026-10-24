namespace FinanceControl.Services.Billing
{
    /// <summary>Calendar math in Brasília time, where due dates live.</summary>
    /// <remarks>
    /// A Pix or boleto due "on the 10th" can be paid until the end of the 10th in Brazil,
    /// which is 03:00 UTC on the 11th. Doing the date math in UTC would expire people
    /// three hours early.
    /// </remarks>
    public static class BillingClock
    {
        private static readonly TimeZoneInfo Brasilia = TimeZoneInfo.FindSystemTimeZoneById("America/Sao_Paulo");

        public static DateOnly ToLocalDate(DateTime utc) =>
            DateOnly.FromDateTime(TimeZoneInfo.ConvertTimeFromUtc(DateTime.SpecifyKind(utc, DateTimeKind.Utc), Brasilia));

        /// The first instant (UTC) after the given local day — when a charge due that day
        /// becomes overdue.
        public static DateTime EndOfLocalDayUtc(DateOnly date)
        {
            var nextMidnight = date.AddDays(1).ToDateTime(TimeOnly.MinValue, DateTimeKind.Unspecified);
            return TimeZoneInfo.ConvertTimeToUtc(nextMidnight, Brasilia);
        }
    }
}

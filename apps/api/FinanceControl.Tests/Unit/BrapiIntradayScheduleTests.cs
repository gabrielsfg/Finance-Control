using FinanceControl.Workers;

namespace FinanceControl.Tests.Unit
{
    // The intraday quote refresh runs only during the B3 session (10:00–18:00 Brasília, UTC-3), Monday to Friday.
    public class BrapiIntradayScheduleTests
    {
        [Theory]
        [InlineData("2026-11-09T15:00:00Z", true)]   // Monday 12:00 Brasília
        [InlineData("2026-11-09T13:00:00Z", true)]   // Monday 10:00 Brasília (open)
        [InlineData("2026-11-09T12:30:00Z", false)]  // Monday 09:30 Brasília (before open)
        [InlineData("2026-11-09T21:00:00Z", false)]  // Monday 18:00 Brasília (closed)
        [InlineData("2026-11-13T20:30:00Z", true)]   // Friday 17:30 Brasília
        [InlineData("2026-11-14T15:00:00Z", false)]  // Saturday 12:00 Brasília
        [InlineData("2026-11-15T15:00:00Z", false)]  // Sunday 12:00 Brasília
        [InlineData("2026-11-10T01:00:00Z", false)]  // Monday 22:00 Brasília, already Tuesday in UTC
        public void IsTradingSessionOpen_UsesBrasiliaWeekdayAndHours(string utc, bool expected)
        {
            var nowUtc = DateTime.Parse(utc, null, System.Globalization.DateTimeStyles.AdjustToUniversal);

            Assert.Equal(expected, BrapiIntradayHostedService.IsTradingSessionOpen(nowUtc));
        }
    }
}

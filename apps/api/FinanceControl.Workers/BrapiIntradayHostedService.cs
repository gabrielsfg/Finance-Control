using FinanceControl.Services.Brapi;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;

namespace FinanceControl.Workers
{
    // Runs every 30 minutes during the B3 trading session (10:00–18:00 Brasília), Monday to Friday.
    // B3 holidays are not skipped: there is no Brazilian holiday calendar in the codebase yet,
    // so on those days the job simply refreshes unchanged quotes.
    public class BrapiIntradayHostedService : IHostedService, IDisposable
    {
        private readonly BrapiPriceUpdateJobService _jobService;
        private readonly ILogger<BrapiIntradayHostedService> _logger;
        private Timer? _timer;
        private CancellationTokenSource? _cts;

        // B3 market window in Brasília local time: 10:00–18:00.
        private const int MarketOpenLocalHour = 10;
        private const int MarketCloseLocalHour = 18;
        private static readonly TimeSpan Interval = TimeSpan.FromMinutes(30);
        private static readonly TimeZoneInfo BrasiliaTimeZone = ResolveBrasiliaTimeZone();

        public BrapiIntradayHostedService(
            BrapiPriceUpdateJobService jobService,
            ILogger<BrapiIntradayHostedService> logger)
        {
            _jobService = jobService;
            _logger = logger;
        }

        public Task StartAsync(CancellationToken cancellationToken)
        {
            _cts = CancellationTokenSource.CreateLinkedTokenSource(cancellationToken);

            var initialDelay = ComputeDelayUntilNextSlot();
            _logger.LogInformation(
                "BrapiIntradayHostedService scheduled. First run in {Delay:hh\\:mm\\:ss}.",
                initialDelay);

            _timer = new Timer(OnTimerTick, null, initialDelay, Interval);

            return Task.CompletedTask;
        }

        public Task StopAsync(CancellationToken cancellationToken)
        {
            _logger.LogInformation("BrapiIntradayHostedService stopping.");
            _cts?.Cancel();
            _timer?.Change(Timeout.Infinite, Timeout.Infinite);
            return Task.CompletedTask;
        }

        private void OnTimerTick(object? state)
        {
            _ = RunJobAsync();
        }

        private async Task RunJobAsync()
        {
            if (_cts is null || _cts.IsCancellationRequested)
                return;

            if (!IsTradingSessionOpen(DateTime.UtcNow))
            {
                _logger.LogDebug("BrapiIntradayHostedService: outside the trading session, skipping tick.");
                return;
            }

            try
            {
                await _jobService.RunIntradayAsync(_cts.Token);
            }
            catch (OperationCanceledException)
            {
                // host is shutting down — not an error
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Unhandled exception in BrapiIntradayHostedService.");
            }
        }

        // True on weekdays between the session open and close, evaluated in Brasília time.
        public static bool IsTradingSessionOpen(DateTime nowUtc)
        {
            var local = TimeZoneInfo.ConvertTimeFromUtc(DateTime.SpecifyKind(nowUtc, DateTimeKind.Utc), BrasiliaTimeZone);
            if (local.DayOfWeek is DayOfWeek.Saturday or DayOfWeek.Sunday)
                return false;
            return local.Hour >= MarketOpenLocalHour && local.Hour < MarketCloseLocalHour;
        }

        // IANA id first (Linux and Windows with ICU), then the Windows id, then a fixed UTC-3
        // (Brazil has had no daylight saving since 2019).
        private static TimeZoneInfo ResolveBrasiliaTimeZone()
        {
            foreach (var id in new[] { "America/Sao_Paulo", "E. South America Standard Time" })
            {
                try { return TimeZoneInfo.FindSystemTimeZoneById(id); }
                catch (TimeZoneNotFoundException) { }
                catch (InvalidTimeZoneException) { }
            }
            return TimeZoneInfo.CreateCustomTimeZone("Brasilia", TimeSpan.FromHours(-3), "Brasilia", "Brasilia");
        }

        // Aligns the first tick to the next 30-min boundary (e.g. :00, :30).
        private static TimeSpan ComputeDelayUntilNextSlot()
        {
            var now = DateTime.UtcNow;
            var nextSlotMinute = (now.Minute / 30 + 1) * 30;
            var next = nextSlotMinute < 60
                ? new DateTime(now.Year, now.Month, now.Day, now.Hour, nextSlotMinute, 0, DateTimeKind.Utc)
                : new DateTime(now.Year, now.Month, now.Day, now.Hour, 0, 0, DateTimeKind.Utc).AddHours(1);
            return next - now;
        }

        public void Dispose()
        {
            _timer?.Dispose();
            _cts?.Dispose();
        }
    }
}

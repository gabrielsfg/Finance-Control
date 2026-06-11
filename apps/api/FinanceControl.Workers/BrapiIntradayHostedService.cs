using FinanceControl.Services.Brapi;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;

namespace FinanceControl.Workers
{
    // Runs every 30 minutes during B3 market hours (10:00–18:00 BRT = 13:00–21:00 UTC).
    public class BrapiIntradayHostedService : IHostedService, IDisposable
    {
        private readonly BrapiPriceUpdateJobService _jobService;
        private readonly ILogger<BrapiIntradayHostedService> _logger;
        private Timer? _timer;
        private CancellationTokenSource? _cts;

        // B3 market window in UTC: 13:00–21:00 (BRT = UTC-3, market 10h–18h BRT)
        private const int MarketOpenUtc = 13;
        private const int MarketCloseUtc = 21;
        private static readonly TimeSpan Interval = TimeSpan.FromMinutes(30);

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

            var nowUtc = DateTime.UtcNow;
            if (nowUtc.Hour < MarketOpenUtc || nowUtc.Hour >= MarketCloseUtc)
            {
                _logger.LogDebug("BrapiIntradayHostedService: outside market hours, skipping tick.");
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

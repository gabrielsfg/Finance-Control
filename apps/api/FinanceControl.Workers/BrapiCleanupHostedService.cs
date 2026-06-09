using FinanceControl.Services.Brapi;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;

namespace FinanceControl.Workers
{
    // Runs once daily at 09:30 UTC (06:30 BRT), 30 minutes before market open.
    // Deletes MarketPriceIntraday rows older than 7 days.
    public class BrapiCleanupHostedService : IHostedService, IDisposable
    {
        private readonly BrapiCleanupJobService _jobService;
        private readonly ILogger<BrapiCleanupHostedService> _logger;
        private Timer? _timer;
        private CancellationTokenSource? _cts;

        // 09:30 UTC = 06:30 BRT, 30 min before B3 pre-opening at 09:45 BRT (12:45 UTC)
        private const int TargetHourUtc = 9;
        private const int TargetMinuteUtc = 30;

        public BrapiCleanupHostedService(
            BrapiCleanupJobService jobService,
            ILogger<BrapiCleanupHostedService> logger)
        {
            _jobService = jobService;
            _logger = logger;
        }

        public Task StartAsync(CancellationToken cancellationToken)
        {
            _cts = CancellationTokenSource.CreateLinkedTokenSource(cancellationToken);

            var initialDelay = ComputeDelayUntilNextTarget();
            _logger.LogInformation(
                "BrapiCleanupHostedService scheduled. First run in {Delay:hh\\:mm\\:ss}.",
                initialDelay);

            _timer = new Timer(OnTimerTick, null, initialDelay, TimeSpan.FromDays(1));

            return Task.CompletedTask;
        }

        public Task StopAsync(CancellationToken cancellationToken)
        {
            _logger.LogInformation("BrapiCleanupHostedService stopping.");
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

            try
            {
                await _jobService.RunAsync(_cts.Token);
            }
            catch (OperationCanceledException)
            {
                // host is shutting down — not an error
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Unhandled exception in BrapiCleanupHostedService.");
            }
        }

        private static TimeSpan ComputeDelayUntilNextTarget()
        {
            var now = DateTime.UtcNow;
            var todayTarget = now.Date.AddHours(TargetHourUtc).AddMinutes(TargetMinuteUtc);
            var target = now < todayTarget ? todayTarget : todayTarget.AddDays(1);
            return target - now;
        }

        public void Dispose()
        {
            _timer?.Dispose();
            _cts?.Dispose();
        }
    }
}

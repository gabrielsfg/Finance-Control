using FinanceControl.Services.Services;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;

namespace FinanceControl.Workers
{
    // Runs once daily at 03:00 UTC (00:00 BRT) — off-peak. Deletes expired/revoked
    // refresh tokens so the table does not grow unbounded.
    public class RefreshTokenCleanupHostedService : IHostedService, IDisposable
    {
        private readonly RefreshTokenCleanupJobService _jobService;
        private readonly ILogger<RefreshTokenCleanupHostedService> _logger;
        private Timer? _timer;
        private CancellationTokenSource? _cts;

        private const int TargetHourUtc = 3;
        private const int TargetMinuteUtc = 0;

        public RefreshTokenCleanupHostedService(
            RefreshTokenCleanupJobService jobService,
            ILogger<RefreshTokenCleanupHostedService> logger)
        {
            _jobService = jobService;
            _logger = logger;
        }

        public Task StartAsync(CancellationToken cancellationToken)
        {
            _cts = CancellationTokenSource.CreateLinkedTokenSource(cancellationToken);

            var initialDelay = ComputeDelayUntilNextTarget();
            _logger.LogInformation(
                "RefreshTokenCleanupHostedService scheduled. First run in {Delay:hh\\:mm\\:ss}.",
                initialDelay);

            _timer = new Timer(OnTimerTick, null, initialDelay, TimeSpan.FromDays(1));

            return Task.CompletedTask;
        }

        public Task StopAsync(CancellationToken cancellationToken)
        {
            _logger.LogInformation("RefreshTokenCleanupHostedService stopping.");
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
                _logger.LogError(ex, "Unhandled exception in RefreshTokenCleanupHostedService.");
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

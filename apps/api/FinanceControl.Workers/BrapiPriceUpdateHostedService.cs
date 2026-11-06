using FinanceControl.Services.Brapi;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;

namespace FinanceControl.Workers
{
    // Runs once a day after the B3 close to store the official closing history.
    public class BrapiPriceUpdateHostedService : IHostedService, IDisposable
    {
        private readonly BrapiPriceUpdateJobService _jobService;
        private readonly ILogger<BrapiPriceUpdateHostedService> _logger;
        private Timer? _timer;
        private CancellationTokenSource? _cts;

        // 21:30 UTC = 18:30 Brasília (UTC-3, no daylight saving since 2019).
        // B3 regular session closes at 18:00 Brasília, so the last price is already the official close.
        private const int TargetHourUtc = 21;
        private const int TargetMinuteUtc = 30;

        public BrapiPriceUpdateHostedService(
            BrapiPriceUpdateJobService jobService,
            ILogger<BrapiPriceUpdateHostedService> logger)
        {
            _jobService = jobService;
            _logger = logger;
        }

        public Task StartAsync(CancellationToken cancellationToken)
        {
            _cts = CancellationTokenSource.CreateLinkedTokenSource(cancellationToken);

            var initialDelay = ComputeDelayUntilNextRun();
            _logger.LogInformation(
                "BrapiPriceUpdateHostedService scheduled. First run in {Delay:hh\\:mm\\:ss}.",
                initialDelay);

            _timer = new Timer(OnTimerTick, null, initialDelay, TimeSpan.FromDays(1));

            return Task.CompletedTask;
        }

        public Task StopAsync(CancellationToken cancellationToken)
        {
            _logger.LogInformation("BrapiPriceUpdateHostedService stopping.");
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
                _logger.LogError(ex, "Unhandled exception in BrapiPriceUpdateHostedService.");
            }
        }

        private static TimeSpan ComputeDelayUntilNextRun()
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

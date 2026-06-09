using FinanceControl.Services.Brapi;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;

namespace FinanceControl.Workers
{
    public class BrapiPriceUpdateHostedService : IHostedService, IDisposable
    {
        private readonly BrapiPriceUpdateJobService _jobService;
        private readonly ILogger<BrapiPriceUpdateHostedService> _logger;
        private Timer? _timer;
        private CancellationTokenSource? _cts;

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

            var initialDelay = ComputeDelayUntilNext19hUtc();
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

        // 19:00 UTC = 16:00 BRT, after market close + after-market (B3 closes 18:00 BRT = 21:00 UTC,
        // but after-market ends 18:00 BRT). Using 19:00 UTC ensures last price is the official close.
        private static TimeSpan ComputeDelayUntilNext19hUtc()
        {
            var now = DateTime.UtcNow;
            var todayAt19h = now.Date.AddHours(19);
            var target = now < todayAt19h ? todayAt19h : todayAt19h.AddDays(1);
            return target - now;
        }

        public void Dispose()
        {
            _timer?.Dispose();
            _cts?.Dispose();
        }
    }
}

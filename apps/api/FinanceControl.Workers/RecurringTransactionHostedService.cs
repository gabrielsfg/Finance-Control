using FinanceControl.Services.Services;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;

namespace FinanceControl.Workers
{
    public class RecurringTransactionHostedService : IHostedService, IDisposable
    {
        private readonly RecurringTransactionJobService _jobService;
        private readonly ILogger<RecurringTransactionHostedService> _logger;
        private Timer? _timer;
        private CancellationTokenSource? _cts;

        public RecurringTransactionHostedService(
            RecurringTransactionJobService jobService,
            ILogger<RecurringTransactionHostedService> logger)
        {
            _jobService = jobService;
            _logger = logger;
        }

        public Task StartAsync(CancellationToken cancellationToken)
        {
            _cts = CancellationTokenSource.CreateLinkedTokenSource(cancellationToken);

            var initialDelay = ComputeDelayUntilNextMidnightUtc();
            _logger.LogInformation(
                "RecurringTransactionHostedService scheduled. First run in {Delay:hh\\:mm\\:ss}.",
                initialDelay);

            _timer = new Timer(OnTimerTick, null, initialDelay, TimeSpan.FromDays(1));

            return Task.CompletedTask;
        }

        public Task StopAsync(CancellationToken cancellationToken)
        {
            _logger.LogInformation("RecurringTransactionHostedService stopping.");
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
                _logger.LogError(ex, "Unhandled exception in RecurringTransactionHostedService.");
            }
        }

        private static TimeSpan ComputeDelayUntilNextMidnightUtc()
        {
            var now = DateTime.UtcNow;
            var nextMidnight = now.Date.AddDays(1);
            return nextMidnight - now;
        }

        public void Dispose()
        {
            _timer?.Dispose();
            _cts?.Dispose();
        }
    }
}

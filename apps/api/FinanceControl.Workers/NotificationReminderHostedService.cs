using FinanceControl.Services.Services;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;

namespace FinanceControl.Workers
{
    // Runs once a day at 11:00 UTC (08:00 BRT) to raise card/budget reminders.
    public class NotificationReminderHostedService : IHostedService, IDisposable
    {
        private const int TargetHourUtc = 11;

        private readonly NotificationReminderJobService _jobService;
        private readonly ILogger<NotificationReminderHostedService> _logger;
        private Timer? _timer;
        private CancellationTokenSource? _cts;

        public NotificationReminderHostedService(
            NotificationReminderJobService jobService,
            ILogger<NotificationReminderHostedService> logger)
        {
            _jobService = jobService;
            _logger = logger;
        }

        public Task StartAsync(CancellationToken cancellationToken)
        {
            _cts = CancellationTokenSource.CreateLinkedTokenSource(cancellationToken);

            var initialDelay = ComputeDelayUntilNextRun();
            _logger.LogInformation(
                "NotificationReminderHostedService scheduled. First run in {Delay:hh\\:mm\\:ss}.",
                initialDelay);

            _timer = new Timer(OnTimerTick, null, initialDelay, TimeSpan.FromDays(1));

            return Task.CompletedTask;
        }

        public Task StopAsync(CancellationToken cancellationToken)
        {
            _logger.LogInformation("NotificationReminderHostedService stopping.");
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
                _logger.LogError(ex, "Unhandled exception in NotificationReminderHostedService.");
            }
        }

        private static TimeSpan ComputeDelayUntilNextRun()
        {
            var now = DateTime.UtcNow;
            var todayRun = new DateTime(now.Year, now.Month, now.Day, TargetHourUtc, 0, 0, DateTimeKind.Utc);
            var next = now < todayRun ? todayRun : todayRun.AddDays(1);
            return next - now;
        }

        public void Dispose()
        {
            _timer?.Dispose();
            _cts?.Dispose();
        }
    }
}

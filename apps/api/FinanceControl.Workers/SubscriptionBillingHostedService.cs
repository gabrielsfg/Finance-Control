using FinanceControl.Services.Services;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;

namespace FinanceControl.Workers
{
    // Runs the billing clock every hour (first pass a minute after startup).
    public class SubscriptionBillingHostedService : BackgroundService
    {
        private static readonly TimeSpan StartupDelay = TimeSpan.FromMinutes(1);
        private static readonly TimeSpan Interval = TimeSpan.FromHours(1);

        private readonly SubscriptionBillingJobService _jobService;
        private readonly ILogger<SubscriptionBillingHostedService> _logger;

        public SubscriptionBillingHostedService(
            SubscriptionBillingJobService jobService,
            ILogger<SubscriptionBillingHostedService> logger)
        {
            _jobService = jobService;
            _logger = logger;
        }

        protected override async Task ExecuteAsync(CancellationToken stoppingToken)
        {
            try
            {
                await Task.Delay(StartupDelay, stoppingToken);
            }
            catch (OperationCanceledException)
            {
                return;
            }

            // PeriodicTimer never overlaps runs: a slow pass delays the next tick instead of
            // racing it over the same subscriptions.
            using var timer = new PeriodicTimer(Interval);
            do
            {
                try
                {
                    await _jobService.RunAsync(stoppingToken);
                }
                catch (OperationCanceledException) when (stoppingToken.IsCancellationRequested)
                {
                    return;
                }
                catch (Exception exception)
                {
                    _logger.LogError(exception, "Unhandled exception in SubscriptionBillingHostedService.");
                }
            }
            while (await WaitAsync(timer, stoppingToken));
        }

        private static async Task<bool> WaitAsync(PeriodicTimer timer, CancellationToken stoppingToken)
        {
            try
            {
                return await timer.WaitForNextTickAsync(stoppingToken);
            }
            catch (OperationCanceledException)
            {
                return false;
            }
        }
    }
}

using FinanceControl.Services.Services;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;

namespace FinanceControl.Workers
{
    // Revokes bank connections over each user's plan, every minute.
    public class OpenFinanceEntitlementHostedService : BackgroundService
    {
        private static readonly TimeSpan Interval = TimeSpan.FromMinutes(1);

        private readonly OpenFinanceEntitlementJobService _jobService;
        private readonly ILogger<OpenFinanceEntitlementHostedService> _logger;

        public OpenFinanceEntitlementHostedService(
            OpenFinanceEntitlementJobService jobService,
            ILogger<OpenFinanceEntitlementHostedService> logger)
        {
            _jobService = jobService;
            _logger = logger;
        }

        protected override async Task ExecuteAsync(CancellationToken stoppingToken)
        {
            using var timer = new PeriodicTimer(Interval);
            try
            {
                while (await timer.WaitForNextTickAsync(stoppingToken))
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
                        _logger.LogError(exception, "Unhandled exception in OpenFinanceEntitlementHostedService.");
                    }
                }
            }
            catch (OperationCanceledException)
            {
                // host is shutting down — not an error
            }
        }
    }
}

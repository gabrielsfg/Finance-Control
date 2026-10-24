using FinanceControl.Services.Services;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;

namespace FinanceControl.Workers
{
    // Queues the daily read of every healthy bank connection (first pass 30 minutes after startup).
    public class OpenFinanceMaintenanceHostedService : BackgroundService
    {
        private static readonly TimeSpan StartupDelay = TimeSpan.FromMinutes(30);
        private static readonly TimeSpan Interval = TimeSpan.FromHours(24);

        private readonly OpenFinanceMaintenanceJobService _jobService;
        private readonly ILogger<OpenFinanceMaintenanceHostedService> _logger;

        public OpenFinanceMaintenanceHostedService(
            OpenFinanceMaintenanceJobService jobService,
            ILogger<OpenFinanceMaintenanceHostedService> logger)
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
                    _logger.LogError(exception, "Unhandled exception in OpenFinanceMaintenanceHostedService.");
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

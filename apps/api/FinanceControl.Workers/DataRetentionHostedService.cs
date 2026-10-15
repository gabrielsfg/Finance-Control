using FinanceControl.Services.Services;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;

namespace FinanceControl.Workers
{
    // Applies the data retention periods once a day (first pass an hour after startup).
    public class DataRetentionHostedService : BackgroundService
    {
        private static readonly TimeSpan StartupDelay = TimeSpan.FromHours(1);
        private static readonly TimeSpan Interval = TimeSpan.FromHours(24);

        private readonly DataRetentionJobService _jobService;
        private readonly ILogger<DataRetentionHostedService> _logger;

        public DataRetentionHostedService(
            DataRetentionJobService jobService,
            ILogger<DataRetentionHostedService> logger)
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
                    _logger.LogError(exception, "Unhandled exception in DataRetentionHostedService.");
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

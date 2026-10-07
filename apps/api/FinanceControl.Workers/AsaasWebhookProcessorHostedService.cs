using FinanceControl.Services.Services;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;

namespace FinanceControl.Workers
{
    // Drains the stored Asaas webhook events every 15 seconds.
    public class AsaasWebhookProcessorHostedService : BackgroundService
    {
        private static readonly TimeSpan Interval = TimeSpan.FromSeconds(15);

        private readonly AsaasWebhookProcessorJobService _jobService;
        private readonly ILogger<AsaasWebhookProcessorHostedService> _logger;

        public AsaasWebhookProcessorHostedService(
            AsaasWebhookProcessorJobService jobService,
            ILogger<AsaasWebhookProcessorHostedService> logger)
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
                        _logger.LogError(exception, "Unhandled exception in AsaasWebhookProcessorHostedService.");
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

using FinanceControl.Data.Data;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Logging;

namespace FinanceControl.Services.Brapi
{
    public class BrapiCleanupJobService
    {
        private readonly IServiceScopeFactory _scopeFactory;
        private readonly ILogger<BrapiCleanupJobService> _logger;

        private const int IntradayRetentionDays = 7;

        public BrapiCleanupJobService(
            IServiceScopeFactory scopeFactory,
            ILogger<BrapiCleanupJobService> logger)
        {
            _scopeFactory = scopeFactory;
            _logger = logger;
        }

        public async Task RunAsync(CancellationToken cancellationToken)
        {
            _logger.LogInformation("BrapiCleanupJob started at {Time} UTC", DateTime.UtcNow);

            var cutoff = DateTime.UtcNow.AddDays(-IntradayRetentionDays);

            await using var scope = _scopeFactory.CreateAsyncScope();
            var context = scope.ServiceProvider.GetRequiredService<ApplicationDbContext>();

            var deleted = await context.MarketPriceIntradays
                .Where(h => h.Timestamp < cutoff)
                .ExecuteDeleteAsync(cancellationToken);

            _logger.LogInformation("BrapiCleanupJob deleted {Count} intraday rows older than {Cutoff:yyyy-MM-dd HH:mm} UTC.",
                deleted, cutoff);
        }
    }
}

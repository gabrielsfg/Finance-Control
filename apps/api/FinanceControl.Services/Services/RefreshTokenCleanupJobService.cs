using FinanceControl.Data.Data;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Logging;

namespace FinanceControl.Services.Services
{
    // Prunes refresh tokens that can no longer be used: those already revoked (by
    // rotation or logout) and those past their expiry. The table otherwise grows with
    // every login and is never reclaimed, which slows the token lookup on refresh.
    public class RefreshTokenCleanupJobService
    {
        private readonly IServiceScopeFactory _scopeFactory;
        private readonly ILogger<RefreshTokenCleanupJobService> _logger;

        public RefreshTokenCleanupJobService(
            IServiceScopeFactory scopeFactory,
            ILogger<RefreshTokenCleanupJobService> logger)
        {
            _scopeFactory = scopeFactory;
            _logger = logger;
        }

        public async Task RunAsync(CancellationToken cancellationToken)
        {
            _logger.LogInformation("RefreshTokenCleanupJob started at {Time} UTC", DateTime.UtcNow);

            var now = DateTime.UtcNow;

            await using var scope = _scopeFactory.CreateAsyncScope();
            var context = scope.ServiceProvider.GetRequiredService<ApplicationDbContext>();

            var deleted = await context.RefreshTokens
                .Where(r => r.IsRevoked || r.ExpiresAt < now)
                .ExecuteDeleteAsync(cancellationToken);

            _logger.LogInformation(
                "RefreshTokenCleanupJob deleted {Count} expired/revoked refresh tokens.", deleted);
        }
    }
}

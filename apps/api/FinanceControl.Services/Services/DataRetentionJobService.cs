using FinanceControl.Data.Data;
using FinanceControl.Domain.Interfaces.Services;
using FinanceControl.Services.Ai;
using FinanceControl.Services.Retention;
using FinanceControl.Shared.Enums;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;

namespace FinanceControl.Services.Services
{
    /// <summary>
    /// Enforces the retention periods the privacy policy states: AI technical records after
    /// <see cref="DataRetentionSettings.AiLogRetentionMonths"/>, and whole accounts left
    /// without a subscription for <see cref="DataRetentionSettings.InactiveAccountRetentionYears"/>.
    /// Runs daily.
    /// </summary>
    public class DataRetentionJobService
    {
        private readonly IServiceScopeFactory _scopeFactory;
        private readonly DataRetentionSettings _settings;
        private readonly ILogger<DataRetentionJobService> _logger;

        public DataRetentionJobService(
            IServiceScopeFactory scopeFactory,
            IOptions<DataRetentionSettings> settings,
            ILogger<DataRetentionJobService> logger)
        {
            _scopeFactory = scopeFactory;
            _settings = settings.Value;
            _logger = logger;
        }

        public async Task RunAsync(CancellationToken cancellationToken)
        {
            var now = DateTime.UtcNow;

            if (_settings.AiLogRetentionMonths > 0)
            {
                await using var scope = _scopeFactory.CreateAsyncScope();
                var context = scope.ServiceProvider.GetRequiredService<ApplicationDbContext>();
                var cutoff = now.AddMonths(-_settings.AiLogRetentionMonths);
                var deleted = await context.AiGenerationLogs
                    .Where(l => l.CreatedAt < cutoff)
                    .ExecuteDeleteAsync(cancellationToken);
                if (deleted > 0)
                    _logger.LogInformation("Deleted {Count} AI generation logs older than {Cutoff:yyyy-MM-dd}.", deleted, cutoff);
            }

            if (_settings.InactiveAccountRetentionYears > 0)
            {
                List<int> userIds;
                await using (var scope = _scopeFactory.CreateAsyncScope())
                {
                    var context = scope.ServiceProvider.GetRequiredService<ApplicationDbContext>();
                    var admins = scope.ServiceProvider.GetRequiredService<IOptions<AdminSettings>>().Value;
                    userIds = await FindExpiredAccountsAsync(context, now, _settings.InactiveAccountRetentionYears, admins, cancellationToken);
                }

                foreach (var userId in userIds.Take(_settings.MaxAccountsPerRun))
                {
                    if (cancellationToken.IsCancellationRequested)
                        return;
                    try
                    {
                        await DeleteAccountAsync(userId, cancellationToken);
                    }
                    catch (Exception exception) when (exception is not OperationCanceledException)
                    {
                        _logger.LogError(exception, "Could not delete inactive account {UserId}.", userId);
                    }
                }
            }
        }

        /// <summary>
        /// Accounts with no live subscription whose last subscription ended (or, without
        /// one, whose signup happened) more than <paramref name="years"/> ago. Admins are
        /// never selected.
        /// </summary>
        public static async Task<List<int>> FindExpiredAccountsAsync(
            ApplicationDbContext context, DateTime now, int years, AdminSettings admins, CancellationToken cancellationToken = default)
        {
            var cutoff = now.AddYears(-years);

            var candidates = await context.Users
                .AsNoTracking()
                .Where(u => u.CreatedAt < cutoff)
                .Where(u => !context.Subscriptions.Any(s => s.UserId == u.Id && s.Status != EnumSubscriptionStatus.Expired))
                .Select(u => new
                {
                    u.Id,
                    LastEnded = context.Subscriptions
                        .Where(s => s.UserId == u.Id)
                        .Max(s => (DateTime?)(s.EndedAt ?? s.CurrentPeriodEnd))
                })
                .ToListAsync(cancellationToken);

            return candidates
                .Where(c => (c.LastEnded is null || c.LastEnded < cutoff) && !admins.IsAdmin(c.Id))
                .Select(c => c.Id)
                .OrderBy(id => id)
                .ToList();
        }

        private async Task DeleteAccountAsync(int userId, CancellationToken cancellationToken)
        {
            await using var scope = _scopeFactory.CreateAsyncScope();
            var context = scope.ServiceProvider.GetRequiredService<ApplicationDbContext>();
            var openFinance = scope.ServiceProvider.GetRequiredService<IOpenFinanceService>();

            // Banks first: deleting the rows here would leave the consents alive at Pluggy.
            await openFinance.RemoveAllConnectionsAsync(userId, cancellationToken);

            var user = await context.Users.FirstOrDefaultAsync(u => u.Id == userId, cancellationToken);
            if (user is null)
                return;

            context.Users.Remove(user);
            await context.SaveChangesAsync(cancellationToken);

            context.MarketAssets.RemoveRange(context.MarketAssets.Where(a => a.OwnerUserId == userId));
            await context.SaveChangesAsync(cancellationToken);

            _logger.LogInformation("Deleted account {UserId} after the inactive retention period.", userId);
        }
    }
}

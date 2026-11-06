using FinanceControl.Data.Data;
using FinanceControl.Domain.Interfaces.Service;
using FinanceControl.Domain.Interfaces.Services;
using FinanceControl.Services.Ai;
using FinanceControl.Services.Billing;
using FinanceControl.Services.Email;
using FinanceControl.Services.Retention;
using FinanceControl.Shared.Enums;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;

namespace FinanceControl.Services.Services
{
    /// <summary>
    /// Enforces the retention periods the privacy policy states (see
    /// <see cref="DataRetentionSettings"/>): AI and MCP technical records, application access
    /// records, billing records and trial CPF hashes of deleted accounts, and whole accounts
    /// left without a subscription — warned by e-mail before they go. Runs daily.
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

            await PurgeAsync("AI generation logs", _settings.AiLogRetentionMonths, months => now.AddMonths(-months),
                (context, cutoff, ct) => context.AiGenerationLogs.Where(l => l.CreatedAt < cutoff).ExecuteDeleteAsync(ct),
                cancellationToken);
            await PurgeAsync("MCP access logs", _settings.McpAccessLogRetentionMonths, months => now.AddMonths(-months),
                (context, cutoff, ct) => context.McpAccessLogs.Where(l => l.CreatedAt < cutoff).ExecuteDeleteAsync(ct),
                cancellationToken);
            await PurgeAsync("access logs", _settings.AccessLogRetentionMonths, months => now.AddMonths(-months),
                (context, cutoff, ct) => context.AccessLogs.Where(l => l.CreatedAt < cutoff).ExecuteDeleteAsync(ct),
                cancellationToken);
            await PurgeAsync("billing records", _settings.BillingRecordRetentionYears, years => now.AddYears(-years),
                (context, cutoff, ct) => context.BillingRecords.Where(r => r.CreatedAt < cutoff).ExecuteDeleteAsync(ct),
                cancellationToken);
            await PurgeAsync("trial usages", _settings.TrialUsageRetentionYears, years => now.AddYears(-years),
                (context, cutoff, ct) => context.TrialUsages.Where(t => t.UsedAt < cutoff).ExecuteDeleteAsync(ct),
                cancellationToken);

            if (_settings.InactiveAccountRetentionYears > 0)
                await HandleInactiveAccountsAsync(now, cancellationToken);
        }

        /// <summary>
        /// Accounts with no live subscription whose last subscription ended (or, without
        /// one, whose signup happened) more than <paramref name="years"/> ago. Admins are
        /// never selected.
        /// </summary>
        public static async Task<List<int>> FindExpiredAccountsAsync(
            ApplicationDbContext context, DateTime now, int years, AdminSettings admins, CancellationToken cancellationToken = default) =>
            (await FindAccountsExpiringByAsync(context, now, years, admins, cancellationToken))
                .Select(a => a.UserId)
                .ToList();

        /// <summary>
        /// Same rule as <see cref="FindExpiredAccountsAsync"/>, for accounts whose retention
        /// ends by <paramref name="horizon"/>, with the date it ends.
        /// </summary>
        public static async Task<List<(int UserId, DateTime ExpiresAt)>> FindAccountsExpiringByAsync(
            ApplicationDbContext context, DateTime horizon, int years, AdminSettings admins, CancellationToken cancellationToken = default)
        {
            var cutoff = horizon.AddYears(-years);

            var candidates = await context.Users
                .AsNoTracking()
                .Where(u => u.CreatedAt < cutoff)
                .Where(u => !context.Subscriptions.Any(s => s.UserId == u.Id && s.Status != EnumSubscriptionStatus.Expired))
                .Select(u => new
                {
                    u.Id,
                    u.CreatedAt,
                    LastEnded = context.Subscriptions
                        .Where(s => s.UserId == u.Id)
                        .Max(s => (DateTime?)(s.EndedAt ?? s.CurrentPeriodEnd))
                })
                .ToListAsync(cancellationToken);

            return candidates
                .Where(c => (c.LastEnded is null || c.LastEnded < cutoff) && !admins.IsAdmin(c.Id))
                .Select(c => (c.Id, (c.LastEnded ?? c.CreatedAt).AddYears(years)))
                .OrderBy(c => c.Item1)
                .ToList();
        }

        /// <summary>
        /// Warns the accounts whose period ends within the notice window, then deletes those
        /// whose period ended and whose warning — sent for this period — is old enough. An
        /// account warned and then subscribed again starts over: the old warning predates
        /// its new period and does not count.
        /// </summary>
        private async Task HandleInactiveAccountsAsync(DateTime now, CancellationToken cancellationToken)
        {
            var notice = TimeSpan.FromDays(Math.Max(0, _settings.InactiveAccountNoticeDays));
            List<(int UserId, DateTime ExpiresAt)> accounts;
            await using (var scope = _scopeFactory.CreateAsyncScope())
            {
                var context = scope.ServiceProvider.GetRequiredService<ApplicationDbContext>();
                var admins = scope.ServiceProvider.GetRequiredService<IOptions<AdminSettings>>().Value;
                accounts = await FindAccountsExpiringByAsync(
                    context, now + notice, _settings.InactiveAccountRetentionYears, admins, cancellationToken);
            }

            var processed = 0;
            foreach (var (userId, expiresAt) in accounts)
            {
                if (cancellationToken.IsCancellationRequested || processed >= _settings.MaxAccountsPerRun)
                    return;
                try
                {
                    if (await WarnOrDeleteAsync(userId, expiresAt, now, notice, cancellationToken))
                        processed++;
                }
                catch (Exception exception) when (exception is not OperationCanceledException)
                {
                    _logger.LogError(exception, "Could not apply the retention period to account {UserId}.", userId);
                }
            }
        }

        /// <returns>Whether the account was deleted.</returns>
        private async Task<bool> WarnOrDeleteAsync(
            int userId, DateTime expiresAt, DateTime now, TimeSpan notice, CancellationToken cancellationToken)
        {
            await using var scope = _scopeFactory.CreateAsyncScope();
            var context = scope.ServiceProvider.GetRequiredService<ApplicationDbContext>();

            var user = await context.Users.FirstOrDefaultAsync(u => u.Id == userId, cancellationToken);
            if (user is null)
                return false;

            var warnedForThisPeriod = user.RetentionNoticeSentAt is { } sentAt && sentAt >= expiresAt - notice - TimeSpan.FromDays(1);
            if (!warnedForThisPeriod)
            {
                var billing = scope.ServiceProvider.GetRequiredService<IOptions<BillingSettings>>().Value;
                var email = scope.ServiceProvider.GetRequiredService<IEmailService>();
                var deleteOn = BillingClock.ToLocalDate(expiresAt > now + notice ? expiresAt : now + notice)
                    .ToDateTime(TimeOnly.MinValue);
                var (subject, html) = EmailTemplates.InactiveAccountDeletionNotice(
                    user.Name, user.PreferredLanguage, deleteOn, billing.WebBaseUrl);

                // Recorded even when the provider refuses it, so the clock starts once; the
                // deletion still waits the full notice period from here.
                if (!await email.SendAsync(user.Email, subject, html, cancellationToken))
                    _logger.LogWarning("Retention notice to user {UserId} was not accepted by the provider.", userId);
                user.RetentionNoticeSentAt = now;
                await context.SaveChangesAsync(cancellationToken);
                return false;
            }

            if (expiresAt > now || user.RetentionNoticeSentAt > now - notice)
                return false;

            // Banks first: deleting the rows here would leave the consents alive at Pluggy.
            var openFinance = scope.ServiceProvider.GetRequiredService<IOpenFinanceService>();
            await openFinance.RemoveAllConnectionsAsync(userId, cancellationToken);

            await BillingArchive.AddForDeletedAccountAsync(context, userId, cancellationToken);
            context.Users.Remove(user);
            await context.SaveChangesAsync(cancellationToken);

            context.MarketAssets.RemoveRange(context.MarketAssets.Where(a => a.OwnerUserId == userId));
            await context.SaveChangesAsync(cancellationToken);

            _logger.LogInformation("Deleted account {UserId} after the inactive retention period.", userId);
            return true;
        }

        private async Task PurgeAsync(
            string what, int period, Func<int, DateTime> cutoffFor,
            Func<ApplicationDbContext, DateTime, CancellationToken, Task<int>> delete, CancellationToken cancellationToken)
        {
            if (period <= 0 || cancellationToken.IsCancellationRequested)
                return;

            try
            {
                await using var scope = _scopeFactory.CreateAsyncScope();
                var context = scope.ServiceProvider.GetRequiredService<ApplicationDbContext>();
                var cutoff = cutoffFor(period);
                var deleted = await delete(context, cutoff, cancellationToken);
                if (deleted > 0)
                    _logger.LogInformation("Deleted {Count} {What} older than {Cutoff:yyyy-MM-dd}.", deleted, what, cutoff);
            }
            catch (Exception exception) when (exception is not OperationCanceledException)
            {
                _logger.LogError(exception, "Could not purge {What}.", what);
            }
        }
    }
}

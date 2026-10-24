using FinanceControl.Data.Data;
using FinanceControl.Services.Pluggy;
using FinanceControl.Shared.Enums;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;

namespace FinanceControl.Services.Services
{
    /// <summary>
    /// Daily safety net for bank sync: queues a read of every healthy connection, so a
    /// webhook that never arrived costs a day of delay instead of a missing transaction.
    /// </summary>
    /// <remarks>
    /// It only reads what Pluggy already collected. It never asks Pluggy to collect from the
    /// bank (PATCH /items) — batch re-syncs are against Pluggy's terms and burn the Open
    /// Finance monthly caps; Pluggy's own auto-sync does that part.
    /// </remarks>
    public class OpenFinanceMaintenanceJobService
    {
        private readonly IServiceScopeFactory _scopeFactory;
        private readonly OpenFinanceSettings _settings;
        private readonly ILogger<OpenFinanceMaintenanceJobService> _logger;

        public OpenFinanceMaintenanceJobService(
            IServiceScopeFactory scopeFactory,
            IOptions<OpenFinanceSettings> settings,
            ILogger<OpenFinanceMaintenanceJobService> logger)
        {
            _scopeFactory = scopeFactory;
            _settings = settings.Value;
            _logger = logger;
        }

        public async Task RunAsync(CancellationToken cancellationToken)
        {
            if (!_settings.Enabled)
                return;

            await using var scope = _scopeFactory.CreateAsyncScope();
            var context = scope.ServiceProvider.GetRequiredService<ApplicationDbContext>();

            var itemIds = await context.BankConnections
                .Where(c => (c.Status == EnumBankConnectionStatus.Active || c.Status == EnumBankConnectionStatus.PartiallyUpdated)
                    && c.Accounts.Any(a => a.Status == EnumBankAccountLinkStatus.Linked))
                .Select(c => c.ItemId)
                .ToListAsync(cancellationToken);

            foreach (var itemId in itemIds)
                context.PluggyWebhookEvents.Add(OpenFinanceSyncService.CreateInternalEvent(OpenFinanceSyncService.InternalSyncEvent, itemId));

            await context.SaveChangesAsync(cancellationToken);
            _logger.LogInformation("Queued the daily read of {Count} bank connections.", itemIds.Count);
        }
    }
}

using FinanceControl.Data.Data;
using FinanceControl.Domain.Entities;
using FinanceControl.Domain.Interfaces.Services;
using FinanceControl.Services.Billing;
using FinanceControl.Services.Pluggy;
using FinanceControl.Shared.Enums;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;

namespace FinanceControl.Services.Services
{
    /// <summary>
    /// Keeps bank connections within what each user's plan allows, revoking the rest at
    /// Pluggy. Runs every minute, so losing or downgrading a subscription takes the banks
    /// off almost at once without the billing code having to know about Open Finance.
    /// </summary>
    /// <remarks>
    /// <para>
    /// No subscription: every connection goes. Basic: the three connected first stay, the
    /// newer ones go. Revoking deletes the item at Pluggy (the bank consent ends and Pluggy
    /// stops collecting and billing) and removes the connection here; the transactions
    /// already imported stay, like any of the user's transactions.
    /// </para>
    /// <para>
    /// A connection whose item Pluggy could not delete stays and is tried again on the
    /// next run, so nothing is left running at Pluggy unseen.
    /// </para>
    /// </remarks>
    public class OpenFinanceEntitlementJobService
    {
        private readonly IServiceScopeFactory _scopeFactory;
        private readonly OpenFinanceSettings _settings;
        private readonly ILogger<OpenFinanceEntitlementJobService> _logger;

        public OpenFinanceEntitlementJobService(
            IServiceScopeFactory scopeFactory,
            IOptions<OpenFinanceSettings> settings,
            ILogger<OpenFinanceEntitlementJobService> logger)
        {
            _scopeFactory = scopeFactory;
            _settings = settings.Value;
            _logger = logger;
        }

        public async Task RunAsync(CancellationToken cancellationToken)
        {
            if (!_settings.Enabled)
                return;

            List<int> userIds;
            await using (var scope = _scopeFactory.CreateAsyncScope())
            {
                var context = scope.ServiceProvider.GetRequiredService<ApplicationDbContext>();
                userIds = await context.BankConnections
                    .Select(c => c.UserId)
                    .Distinct()
                    .ToListAsync(cancellationToken);
            }

            foreach (var userId in userIds)
            {
                if (cancellationToken.IsCancellationRequested)
                    return;

                try
                {
                    await EnforceAsync(userId, cancellationToken);
                }
                catch (Exception exception) when (exception is not OperationCanceledException)
                {
                    _logger.LogError(exception, "Could not enforce the bank connection limit of user {UserId}.", userId);
                }
            }
        }

        /// <summary>Revokes what is over the user's plan. Returns how many connections went.</summary>
        public async Task<int> EnforceAsync(int userId, CancellationToken cancellationToken)
        {
            await using var scope = _scopeFactory.CreateAsyncScope();
            var context = scope.ServiceProvider.GetRequiredService<ApplicationDbContext>();
            var pluggy = scope.ServiceProvider.GetRequiredService<PluggyClient>();
            var notifications = scope.ServiceProvider.GetRequiredService<INotificationService>();
            var billingSettings = scope.ServiceProvider.GetRequiredService<IOptions<BillingSettings>>().Value;

            var entitlement = await OpenFinanceEntitlement.GetAsync(context, userId, _settings, billingSettings, cancellationToken);
            if (entitlement.HasAccess && entitlement.MaxConnections is null)
                return 0;

            var connections = await context.BankConnections
                .Where(c => c.UserId == userId)
                .OrderBy(c => c.CreatedAt)
                .ThenBy(c => c.Id)
                .ToListAsync(cancellationToken);

            // Rows already gone at Pluggy (item/deleted) cost nothing and do not count.
            var live = connections.Where(c => c.Status != EnumBankConnectionStatus.Disconnected).ToList();
            var keep = entitlement.HasAccess ? entitlement.MaxConnections!.Value : 0;
            var excess = live.Skip(keep).ToList();
            if (excess.Count == 0)
                return 0;

            var revoked = new List<BankConnection>();
            foreach (var connection in excess)
            {
                var result = await pluggy.DeleteItemAsync(connection.ItemId, cancellationToken);
                if (!result.IsSuccess && result.StatusCode != 404)
                {
                    _logger.LogWarning(
                        "Could not revoke item {ItemId} of user {UserId} ({StatusCode}); retrying on the next run.",
                        connection.ItemId, userId, result.StatusCode);
                    continue;
                }
                revoked.Add(connection);
            }

            if (revoked.Count == 0)
                return 0;

            context.BankConnections.RemoveRange(revoked);
            await context.SaveChangesAsync(cancellationToken);

            var banks = string.Join(", ", revoked.Select(c => c.ConnectorName));
            var body = entitlement.HasAccess
                ? $"Seu plano permite {keep} banco{(keep != 1 ? "s" : "")} conectado{(keep != 1 ? "s" : "")}. Desconectamos: {banks}. As transações já importadas continuam no app."
                : $"Sem uma assinatura ativa, a conexão com os bancos foi encerrada ({banks}). As transações já importadas continuam no app.";

            await notifications.CreateAsync(
                userId,
                EnumNotificationType.System,
                "Bancos desconectados",
                body,
                actionUrl: "/accounts",
                dedupeKey: $"open-finance-revoked:{revoked[0].ItemId}:{revoked.Count}");

            _logger.LogInformation("Revoked {Count} bank connections of user {UserId} over the plan limit.", revoked.Count, userId);
            return revoked.Count;
        }
    }
}

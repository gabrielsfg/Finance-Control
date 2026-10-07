using System.Text.Json;
using FinanceControl.Data.Data;
using FinanceControl.Services.Asaas;
using FinanceControl.Services.Billing;
using FinanceControl.Shared.Enums;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Logging;

namespace FinanceControl.Services.Services
{
    /// <summary>
    /// Applies the webhook events the endpoint stored. Runs every few seconds; each event is
    /// handled in its own scope and retried with backoff when it throws.
    /// </summary>
    /// <remarks>
    /// The endpoint has already answered Asaas with 200, so from here on a failure is ours
    /// to retry — Asaas will not send the event again. After <see cref="MaxAttempts"/> the
    /// event is parked as Failed and logged as an error for a look by hand.
    /// </remarks>
    public class AsaasWebhookProcessorJobService
    {
        private const int BatchSize = 50;
        private const int MaxAttempts = 10;
        private static readonly TimeSpan Retention = TimeSpan.FromDays(90);
        private static readonly JsonSerializerOptions JsonOptions = new(JsonSerializerDefaults.Web);

        private readonly IServiceScopeFactory _scopeFactory;
        private readonly ILogger<AsaasWebhookProcessorJobService> _logger;
        private DateTime _lastCleanup = DateTime.MinValue;

        public AsaasWebhookProcessorJobService(IServiceScopeFactory scopeFactory, ILogger<AsaasWebhookProcessorJobService> logger)
        {
            _scopeFactory = scopeFactory;
            _logger = logger;
        }

        public async Task RunAsync(CancellationToken cancellationToken)
        {
            var now = DateTime.UtcNow;
            List<int> eventIds;

            await using (var scope = _scopeFactory.CreateAsyncScope())
            {
                var context = scope.ServiceProvider.GetRequiredService<ApplicationDbContext>();

                // Arrival order matters (a refund after its confirmation), so the batch is
                // taken oldest first and processed one by one.
                eventIds = await context.AsaasWebhookEvents
                    .Where(e => e.Status == EnumWebhookEventStatus.Pending
                        && (e.NextAttemptAt == null || e.NextAttemptAt <= now))
                    .OrderBy(e => e.CreatedAt)
                    .Select(e => e.Id)
                    .Take(BatchSize)
                    .ToListAsync(cancellationToken);

                if (now - _lastCleanup > TimeSpan.FromHours(1))
                {
                    _lastCleanup = now;
                    var cutoff = now - Retention;
                    await context.AsaasWebhookEvents
                        .Where(e => e.Status == EnumWebhookEventStatus.Done && e.CreatedAt < cutoff)
                        .ExecuteDeleteAsync(cancellationToken);
                }
            }

            foreach (var id in eventIds)
            {
                if (cancellationToken.IsCancellationRequested)
                    return;
                await ProcessAsync(id, cancellationToken);
            }
        }

        private async Task ProcessAsync(int eventRowId, CancellationToken cancellationToken)
        {
            try
            {
                await using var scope = _scopeFactory.CreateAsyncScope();
                var context = scope.ServiceProvider.GetRequiredService<ApplicationDbContext>();
                var engine = scope.ServiceProvider.GetRequiredService<BillingEngine>();

                var webhookEvent = await context.AsaasWebhookEvents.FirstOrDefaultAsync(e => e.Id == eventRowId, cancellationToken);
                if (webhookEvent is null || webhookEvent.Status != EnumWebhookEventStatus.Pending)
                    return;

                var payload = JsonSerializer.Deserialize<AsaasWebhookPayload>(webhookEvent.Payload, JsonOptions);
                if (payload is not null)
                    await engine.ApplyWebhookAsync(payload, DateTime.UtcNow, cancellationToken);

                webhookEvent.Status = EnumWebhookEventStatus.Done;
                webhookEvent.ProcessedAt = DateTime.UtcNow;
                webhookEvent.Attempts++;
                webhookEvent.LastError = null;
                await context.SaveChangesAsync(cancellationToken);
            }
            catch (OperationCanceledException) when (cancellationToken.IsCancellationRequested)
            {
                throw;
            }
            catch (Exception exception)
            {
                await RecordFailureAsync(eventRowId, exception, cancellationToken);
            }
        }

        // In a fresh scope: the one that threw may hold half-applied changes.
        private async Task RecordFailureAsync(int eventRowId, Exception exception, CancellationToken cancellationToken)
        {
            try
            {
                await using var scope = _scopeFactory.CreateAsyncScope();
                var context = scope.ServiceProvider.GetRequiredService<ApplicationDbContext>();
                var webhookEvent = await context.AsaasWebhookEvents.FirstOrDefaultAsync(e => e.Id == eventRowId, cancellationToken);
                if (webhookEvent is null)
                    return;

                webhookEvent.Attempts++;
                webhookEvent.LastError = exception.Message.Length > 1000 ? exception.Message[..1000] : exception.Message;

                if (webhookEvent.Attempts >= MaxAttempts)
                {
                    webhookEvent.Status = EnumWebhookEventStatus.Failed;
                    _logger.LogError(
                        exception, "Webhook event {EventId} ({EventType}) failed {Attempts} times and was parked.",
                        webhookEvent.EventId, webhookEvent.EventType, webhookEvent.Attempts);
                }
                else
                {
                    // 1, 2, 4 ... minutes, capped at an hour.
                    var delay = TimeSpan.FromMinutes(Math.Min(60, Math.Pow(2, webhookEvent.Attempts - 1)));
                    webhookEvent.NextAttemptAt = DateTime.UtcNow + delay;
                    _logger.LogWarning(
                        exception, "Webhook event {EventId} ({EventType}) failed; retrying in {Delay}.",
                        webhookEvent.EventId, webhookEvent.EventType, delay);
                }

                await context.SaveChangesAsync(cancellationToken);
            }
            catch (Exception recordException) when (recordException is not OperationCanceledException)
            {
                _logger.LogError(recordException, "Could not record the failure of webhook row {RowId}.", eventRowId);
            }
        }
    }
}

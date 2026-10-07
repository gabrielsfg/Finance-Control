using FinanceControl.Data.Data;
using FinanceControl.Domain.Entities;
using FinanceControl.Services.Billing;
using FinanceControl.Services.Email;
using FinanceControl.Shared.Enums;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;

namespace FinanceControl.Services.Services
{
    /// <summary>
    /// The billing clock, run every hour: charges cards when a period ends, issues Pix and
    /// boleto renewals ahead of time, ends what was not paid and sends the reminders.
    /// </summary>
    /// <remarks>
    /// Hourly rather than daily so a card is charged within the hour its period ends, and
    /// an unpaid renewal ends the morning after its last day — the "zero grace" rule holds
    /// without access ever depending on a clock comparison in the request path.
    /// <para>
    /// Every subscription is handled in its own scope: one bad row (a gateway error, a
    /// constraint) cannot poison the context for the rest of the run, and re-running the
    /// job at any point is safe — each step checks what already exists first.
    /// </para>
    /// </remarks>
    public class SubscriptionBillingJobService
    {
        private static readonly TimeSpan CreatingGracePeriod = TimeSpan.FromMinutes(2);
        private static readonly TimeSpan CardReviewTimeout = TimeSpan.FromDays(7);

        private readonly IServiceScopeFactory _scopeFactory;
        private readonly ILogger<SubscriptionBillingJobService> _logger;

        public SubscriptionBillingJobService(IServiceScopeFactory scopeFactory, ILogger<SubscriptionBillingJobService> logger)
        {
            _scopeFactory = scopeFactory;
            _logger = logger;
        }

        public async Task RunAsync(CancellationToken cancellationToken)
        {
            var now = DateTime.UtcNow;
            BillingSettings settings;
            List<int> creatingChargeIds, cardRenewalIds, manualRenewalIds, expiryCandidateIds;

            await using (var scope = _scopeFactory.CreateAsyncScope())
            {
                var context = scope.ServiceProvider.GetRequiredService<ApplicationDbContext>();
                settings = scope.ServiceProvider.GetRequiredService<IOptions<BillingSettings>>().Value;

                creatingChargeIds = await context.SubscriptionCharges
                    .Where(c => c.Status == EnumChargeStatus.Creating && c.CreatedAt < now - CreatingGracePeriod)
                    .Select(c => c.Id)
                    .ToListAsync(cancellationToken);

                cardRenewalIds = await context.Subscriptions
                    .Where(s => !s.IsComplimentary
                        && s.BillingMethod == EnumBillingMethod.CreditCard
                        && (s.Status == EnumSubscriptionStatus.Trialing || s.Status == EnumSubscriptionStatus.Active)
                        && s.CurrentPeriodEnd <= now)
                    .Select(s => s.Id)
                    .ToListAsync(cancellationToken);

                var issueHorizon = now.AddDays(settings.RenewalNoticeDays + BillingEngine.BoletoClearingDays);
                manualRenewalIds = await context.Subscriptions
                    .Where(s => !s.IsComplimentary
                        && s.BillingMethod != EnumBillingMethod.CreditCard
                        && s.Status == EnumSubscriptionStatus.Active
                        && s.CurrentPeriodEnd <= issueHorizon)
                    .Select(s => s.Id)
                    .ToListAsync(cancellationToken);

                expiryCandidateIds = await context.Subscriptions
                    .Where(s => s.Status == EnumSubscriptionStatus.PendingPayment
                        || (s.Status == EnumSubscriptionStatus.Canceled && s.CurrentPeriodEnd <= now)
                        || (s.Status == EnumSubscriptionStatus.Active && s.CurrentPeriodEnd <= now
                            && (s.IsComplimentary || s.BillingMethod != EnumBillingMethod.CreditCard)))
                    .Select(s => s.Id)
                    .ToListAsync(cancellationToken);
            }

            foreach (var id in creatingChargeIds)
                await IsolatedAsync("reconcile charge", id, (scope, ct) => ReconcileChargeAsync(scope, id, ct), cancellationToken);

            foreach (var id in cardRenewalIds)
                await IsolatedAsync("renew card subscription", id, (scope, ct) => RenewCardAsync(scope, id, now, ct), cancellationToken);

            foreach (var id in manualRenewalIds)
                await IsolatedAsync("issue manual renewal", id, (scope, ct) => IssueManualRenewalAsync(scope, id, now, settings, ct), cancellationToken);

            foreach (var id in expiryCandidateIds)
                await IsolatedAsync("expire subscription", id, (scope, ct) => ExpireIfDueAsync(scope, id, now, ct), cancellationToken);

            if (now.Hour >= settings.EmailStartHourUtc)
                await IsolatedAsync("send reminders", 0, (scope, ct) => SendRemindersAsync(scope, now, settings, ct), cancellationToken);
        }

        private static async Task ReconcileChargeAsync(IServiceProvider services, int chargeId, CancellationToken cancellationToken)
        {
            var context = services.GetRequiredService<ApplicationDbContext>();
            var engine = services.GetRequiredService<BillingEngine>();

            var charge = await context.SubscriptionCharges
                .Include(c => c.Subscription)
                .FirstOrDefaultAsync(c => c.Id == chargeId && c.Status == EnumChargeStatus.Creating, cancellationToken);
            if (charge is null)
                return;

            var profile = await context.BillingProfiles.FirstOrDefaultAsync(p => p.UserId == charge.UserId, cancellationToken);
            if (profile?.AsaasCustomerId is null)
                return;

            var outcome = await engine.ReconcileCreatingChargeAsync(charge, profile, cancellationToken);
            await HandleOutcomeAsync(context, engine, charge.Subscription, charge, outcome, DateTime.UtcNow, cancellationToken);
        }

        private static async Task RenewCardAsync(IServiceProvider services, int subscriptionId, DateTime now, CancellationToken cancellationToken)
        {
            var context = services.GetRequiredService<ApplicationDbContext>();
            var engine = services.GetRequiredService<BillingEngine>();

            var subscription = await context.Subscriptions.FirstOrDefaultAsync(
                s => s.Id == subscriptionId
                    && (s.Status == EnumSubscriptionStatus.Trialing || s.Status == EnumSubscriptionStatus.Active)
                    && s.CurrentPeriodEnd <= now,
                cancellationToken);
            if (subscription is null)
                return;

            var charge = await NextPeriodChargeAsync(context, subscription, now, BillingClock.ToLocalDate(now), cancellationToken);
            if (charge is null)
                return; // already being charged (Creating/Pending) — reconcile or the webhook settles it

            var profile = await context.BillingProfiles.FirstAsync(p => p.UserId == subscription.UserId, cancellationToken);
            var outcome = await engine.SubmitChargeAsync(charge, profile, null, cancellationToken);
            await HandleOutcomeAsync(context, engine, subscription, charge, outcome, now, cancellationToken);
        }

        private static async Task IssueManualRenewalAsync(
            IServiceProvider services, int subscriptionId, DateTime now, BillingSettings settings, CancellationToken cancellationToken)
        {
            var context = services.GetRequiredService<ApplicationDbContext>();
            var engine = services.GetRequiredService<BillingEngine>();

            var subscription = await context.Subscriptions.FirstOrDefaultAsync(
                s => s.Id == subscriptionId && s.Status == EnumSubscriptionStatus.Active, cancellationToken);
            if (subscription is null)
                return;

            var lead = TimeSpan.FromDays(settings.RenewalNoticeDays
                + (subscription.BillingMethod == EnumBillingMethod.Boleto ? BillingEngine.BoletoClearingDays : 0));
            if (subscription.CurrentPeriodEnd - lead > now)
                return;

            // A job that was down for a while may come in after the ideal due date.
            var dueDate = BillingEngine.RenewalDueDate(subscription.BillingMethod, subscription.CurrentPeriodEnd);
            var today = BillingClock.ToLocalDate(now);
            if (dueDate < today)
                dueDate = today;

            var charge = await NextPeriodChargeAsync(context, subscription, now, dueDate, cancellationToken);
            if (charge is null)
                return;

            var profile = await context.BillingProfiles.FirstAsync(p => p.UserId == subscription.UserId, cancellationToken);
            var outcome = await engine.SubmitChargeAsync(charge, profile, null, cancellationToken);
            await HandleOutcomeAsync(context, engine, subscription, charge, outcome, now, cancellationToken);
        }

        /// The charge for the period after the current one, created and saved as Creating —
        /// or null when one is already open or paid.
        private static async Task<SubscriptionCharge?> NextPeriodChargeAsync(
            ApplicationDbContext context, Subscription subscription, DateTime now, DateOnly dueDate, CancellationToken cancellationToken)
        {
            var periodStart = subscription.CurrentPeriodEnd;
            var existing = await context.SubscriptionCharges
                .Where(c => c.SubscriptionId == subscription.Id && c.PeriodStart == periodStart)
                .Select(c => c.Status)
                .ToListAsync(cancellationToken);

            if (existing.Any(s => s is EnumChargeStatus.Creating or EnumChargeStatus.Pending or EnumChargeStatus.Confirmed))
                return null;

            var charge = BillingEngine.BuildCharge(
                subscription, periodStart, dueDate, applyPendingChange: true, attempt: existing.Count + 1);
            context.SubscriptionCharges.Add(charge);
            await context.SaveChangesAsync(cancellationToken);
            return charge;
        }

        private static async Task HandleOutcomeAsync(
            ApplicationDbContext context, BillingEngine engine, Subscription subscription, SubscriptionCharge charge,
            ChargeSubmission outcome, DateTime now, CancellationToken cancellationToken)
        {
            switch (outcome)
            {
                case ChargeSubmission.Paid:
                    if (await engine.ConfirmChargeAsync(subscription, charge, now, cancellationToken))
                    {
                        await context.SaveChangesAsync(cancellationToken);
                        await engine.SendPaymentConfirmedAsync(subscription, charge, cancellationToken);
                        return;
                    }
                    break;

                case ChargeSubmission.Failed when charge.BillingMethod == EnumBillingMethod.CreditCard:
                    // Declined at renewal: zero grace, the subscription ends now.
                    if (BillingEngine.DependsOn(subscription, charge))
                    {
                        await engine.ExpireForNonPaymentAsync(subscription, null, now, cancellationToken);
                        return;
                    }
                    break;

                case ChargeSubmission.Failed:
                    // Asaas refused to issue a Pix/boleto — our problem, not the user's.
                    if (subscription.Status == EnumSubscriptionStatus.PendingPayment)
                    {
                        BillingEngine.Expire(subscription, EnumSubscriptionEndReason.PaymentFailed, now);
                    }
                    else
                    {
                        // Drop the row so the next run tries again with a fresh key.
                        context.SubscriptionCharges.Remove(charge);
                    }
                    break;
            }

            await context.SaveChangesAsync(cancellationToken);
        }

        private static async Task ExpireIfDueAsync(IServiceProvider services, int subscriptionId, DateTime now, CancellationToken cancellationToken)
        {
            var context = services.GetRequiredService<ApplicationDbContext>();
            var engine = services.GetRequiredService<BillingEngine>();

            var subscription = await context.Subscriptions.FirstOrDefaultAsync(s => s.Id == subscriptionId, cancellationToken);
            if (subscription is null)
                return;

            switch (subscription.Status)
            {
                case EnumSubscriptionStatus.Canceled when subscription.CurrentPeriodEnd <= now:
                case EnumSubscriptionStatus.Active when subscription.IsComplimentary && subscription.CurrentPeriodEnd <= now:
                    BillingEngine.Expire(subscription, EnumSubscriptionEndReason.Canceled, now);
                    await context.SaveChangesAsync(cancellationToken);
                    return;

                case EnumSubscriptionStatus.Active when subscription.BillingMethod != EnumBillingMethod.CreditCard
                                                        && now >= BillingEngine.RenewalDeadline(subscription):
                {
                    var openCharge = await context.SubscriptionCharges
                        .Where(c => c.SubscriptionId == subscription.Id
                            && c.PeriodStart >= subscription.CurrentPeriodEnd
                            && c.Status == EnumChargeStatus.Pending)
                        .FirstOrDefaultAsync(cancellationToken);
                    await engine.ExpireForNonPaymentAsync(subscription, openCharge, now, cancellationToken);
                    return;
                }

                case EnumSubscriptionStatus.PendingPayment:
                {
                    // A first payment that never came. Silent: there was never a subscription
                    // to lose, so a "canceled" email would only confuse.
                    var charge = await context.SubscriptionCharges
                        .Where(c => c.SubscriptionId == subscription.Id)
                        .OrderByDescending(c => c.Id)
                        .FirstOrDefaultAsync(cancellationToken);

                    var giveUp = charge is null
                        ? subscription.CreatedAt < now.AddDays(-1)
                        : charge.BillingMethod == EnumBillingMethod.CreditCard
                            ? charge.CreatedAt < now - CardReviewTimeout
                            : now >= BillingEngine.ChargeDeadline(charge);
                    if (!giveUp)
                        return;

                    if (charge is not null)
                        await engine.CancelRemoteChargeAsync(charge, cancellationToken);
                    BillingEngine.Expire(subscription, EnumSubscriptionEndReason.PaymentFailed, now);
                    await context.SaveChangesAsync(cancellationToken);
                    return;
                }
            }
        }

        private static async Task SendRemindersAsync(
            IServiceProvider services, DateTime now, BillingSettings settings, CancellationToken cancellationToken)
        {
            var context = services.GetRequiredService<ApplicationDbContext>();
            var notifier = services.GetRequiredService<BillingNotifier>();
            var today = BillingClock.ToLocalDate(now);

            // Trial ending: 3, 2 and 1 day(s) before the first charge.
            var trials = await context.Subscriptions
                .AsNoTracking()
                .Where(s => s.Status == EnumSubscriptionStatus.Trialing
                    && s.TrialEndsAt != null
                    && s.TrialEndsAt > now
                    && s.TrialEndsAt <= now.AddDays(4))
                .ToListAsync(cancellationToken);

            foreach (var trial in trials)
            {
                var daysLeft = BillingClock.ToLocalDate(trial.TrialEndsAt!.Value).DayNumber - today.DayNumber;
                if (daysLeft is < 1 or > 3)
                    continue;

                var profile = await context.BillingProfiles.AsNoTracking()
                    .FirstOrDefaultAsync(p => p.UserId == trial.UserId, cancellationToken);
                var amount = trial.PendingPlan is not null || trial.PendingCycle is not null
                    ? BillingCatalog.GetPrice(trial.PendingPlan ?? trial.Plan, trial.PendingCycle ?? trial.Cycle)
                    : trial.Price;

                await notifier.SendOnceAsync(
                    trial.UserId,
                    $"trial-ending-{trial.Id}-{daysLeft}",
                    user => BillingEmailTemplates.TrialEnding(
                        user.Name, user.PreferredLanguage, daysLeft, amount, trial.Cycle,
                        trial.TrialEndsAt.Value, profile?.CardLast4, notifier.ManageUrl),
                    cancellationToken);
            }

            // Pix/boleto renewal: one email a day while the renewal is open, up to its due date.
            var renewals = await context.SubscriptionCharges
                .AsNoTracking()
                .Include(c => c.Subscription)
                .Where(c => c.Status == EnumChargeStatus.Pending
                    && c.BillingMethod != EnumBillingMethod.CreditCard
                    && c.Subscription.Status == EnumSubscriptionStatus.Active
                    && c.PeriodStart >= c.Subscription.CurrentPeriodEnd)
                .ToListAsync(cancellationToken);

            foreach (var charge in renewals)
            {
                var daysLeft = charge.DueDate.DayNumber - today.DayNumber;
                if (daysLeft < 0 || daysLeft >= settings.RenewalNoticeDays)
                    continue;

                await notifier.SendOnceAsync(
                    charge.UserId,
                    $"renewal-{charge.Id}-{today:yyyyMMdd}",
                    user => BillingEmailTemplates.RenewalReminder(
                        user.Name, user.PreferredLanguage, daysLeft, charge.Amount, charge.DueDate,
                        charge.BillingMethod, charge.InvoiceUrl ?? notifier.ManageUrl),
                    cancellationToken);
            }
        }

        private async Task IsolatedAsync(
            string step, int id, Func<IServiceProvider, CancellationToken, Task> work, CancellationToken cancellationToken)
        {
            if (cancellationToken.IsCancellationRequested)
                return;

            try
            {
                await using var scope = _scopeFactory.CreateAsyncScope();
                await work(scope.ServiceProvider, cancellationToken);
            }
            catch (OperationCanceledException) when (cancellationToken.IsCancellationRequested)
            {
                throw;
            }
            catch (Exception exception)
            {
                _logger.LogError(exception, "Billing job failed to {Step} ({Id}).", step, id);
            }
        }
    }
}

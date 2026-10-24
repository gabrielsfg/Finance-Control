using FinanceControl.Data.Data;
using FinanceControl.Domain.Entities;
using FinanceControl.Services.Asaas;
using FinanceControl.Services.Email;
using FinanceControl.Shared.Enums;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;

namespace FinanceControl.Services.Billing
{
    /// <summary>
    /// The billing state machine shared by the signup flow, the hourly job and the webhook
    /// worker: building charges, sending them to Asaas, and moving the subscription when a
    /// charge is paid, fails or is refunded.
    /// </summary>
    /// <remarks>
    /// Every transition here is idempotent — a webhook redelivered, a job run twice, a
    /// confirmation arriving both synchronously and by webhook all land in the same state.
    /// Callers save; methods that notify save first, so an email never describes a state
    /// that failed to persist.
    /// </remarks>
    public class BillingEngine
    {
        /// A boleto takes up to three business days to clear, so its due date sits that far
        /// before the period ends — paying on the due date still renews in time.
        public const int BoletoClearingDays = 3;

        private readonly ApplicationDbContext _context;
        private readonly AsaasClient _asaas;
        private readonly BillingSecrets _secrets;
        private readonly BillingNotifier _notifier;
        private readonly ILogger<BillingEngine> _logger;

        public BillingEngine(
            ApplicationDbContext context,
            AsaasClient asaas,
            BillingSecrets secrets,
            BillingNotifier notifier,
            ILogger<BillingEngine> logger)
        {
            _context = context;
            _asaas = asaas;
            _secrets = secrets;
            _notifier = notifier;
            _logger = logger;
        }

        /// One key per attempt at a period: a charge canceled before payment (cancel, then
        /// resume) leaves its key behind, and the next attempt needs its own.
        public static string IdempotencyKey(int subscriptionId, DateTime periodStart, int attempt) =>
            $"sub-{subscriptionId}-{periodStart:yyyyMMddHHmmss}-{attempt}";

        /// <summary>
        /// Builds the charge for the period starting at <paramref name="periodStart"/>.
        /// A renewal (<paramref name="applyPendingChange"/>) takes the scheduled plan change
        /// and its catalog price; otherwise the subscription keeps the price it has.
        /// </summary>
        public static SubscriptionCharge BuildCharge(
            Subscription subscription, DateTime periodStart, DateOnly dueDate, bool applyPendingChange, int attempt = 1)
        {
            var hasChange = applyPendingChange
                && (subscription.PendingPlan is not null
                    || subscription.PendingCycle is not null
                    || subscription.PendingInstallmentCount is not null);

            var plan = hasChange ? subscription.PendingPlan ?? subscription.Plan : subscription.Plan;
            var cycle = hasChange ? subscription.PendingCycle ?? subscription.Cycle : subscription.Cycle;
            var installments = hasChange
                ? subscription.PendingInstallmentCount ?? subscription.InstallmentCount
                : subscription.InstallmentCount;
            if (!BillingCatalog.AllowsInstallments(cycle, subscription.BillingMethod))
                installments = 1;

            return new SubscriptionCharge
            {
                UserId = subscription.UserId,
                SubscriptionId = subscription.Id,
                Subscription = subscription,
                IdempotencyKey = IdempotencyKey(subscription.Id, periodStart, attempt),
                Plan = plan,
                Cycle = cycle,
                BillingMethod = subscription.BillingMethod,
                InstallmentCount = installments,
                Amount = hasChange ? BillingCatalog.GetPrice(plan, cycle) : subscription.Price,
                PeriodStart = periodStart,
                PeriodEnd = BillingCatalog.AddCycle(periodStart, cycle),
                DueDate = dueDate,
                Status = EnumChargeStatus.Creating
            };
        }

        /// Due date for a Pix/Boleto renewal whose period starts at the given instant.
        public static DateOnly RenewalDueDate(EnumBillingMethod method, DateTime periodStart)
        {
            var date = BillingClock.ToLocalDate(periodStart);
            return method == EnumBillingMethod.Boleto ? date.AddDays(-BoletoClearingDays) : date;
        }

        /// Due date for the first Pix/Boleto payment: Pix today, a boleto with the clearing
        /// days ahead so it can still be paid at a bank.
        public static DateOnly FirstPaymentDueDate(EnumBillingMethod method, DateTime now)
        {
            var today = BillingClock.ToLocalDate(now);
            return method == EnumBillingMethod.Boleto ? today.AddDays(BoletoClearingDays) : today;
        }

        /// A Pix/Boleto renewal unpaid by the end of the period's last local day ends the
        /// subscription — no grace period.
        public static DateTime RenewalDeadline(Subscription subscription) =>
            BillingClock.EndOfLocalDayUtc(BillingClock.ToLocalDate(subscription.CurrentPeriodEnd));

        /// When an unpaid charge is given up: the end of its due date.
        public static DateTime ChargeDeadline(SubscriptionCharge charge) =>
            BillingClock.EndOfLocalDayUtc(charge.DueDate);

        /// <summary>Sends a charge that is already saved as Creating.</summary>
        public async Task<ChargeSubmission> SubmitChargeAsync(
            SubscriptionCharge charge, BillingProfile profile, string? remoteIp, CancellationToken cancellationToken)
        {
            var request = new AsaasPaymentRequest
            {
                Customer = profile.AsaasCustomerId!,
                BillingType = ToAsaasBillingType(charge.BillingMethod),
                DueDate = AsaasClient.FormatDate(charge.DueDate),
                Description = Describe(charge),
                ExternalReference = charge.IdempotencyKey
            };

            if (charge.InstallmentCount > 1)
            {
                request.InstallmentCount = charge.InstallmentCount;
                request.TotalValue = AsaasClient.ToReais(charge.Amount);
            }
            else
            {
                request.Value = AsaasClient.ToReais(charge.Amount);
            }

            if (charge.BillingMethod == EnumBillingMethod.CreditCard)
            {
                if (string.IsNullOrEmpty(profile.CardTokenCipher))
                {
                    charge.Status = EnumChargeStatus.Failed;
                    charge.FailureReason = "No card on file.";
                    return ChargeSubmission.Failed;
                }

                request.CreditCardToken = _secrets.UnprotectCardToken(profile.CardTokenCipher);
                request.RemoteIp = remoteIp;
            }

            var result = await _asaas.CreatePaymentAsync(request, cancellationToken);

            if (result.IsSuccess)
            {
                // Created but unreadable: the lookup by reference recovers its id later.
                return result.Value is null
                    ? ChargeSubmission.Inconclusive
                    : ApplyRemotePayment(charge, result.Value);
            }

            if (result.IsInconclusive)
                return ChargeSubmission.Inconclusive;

            charge.Status = EnumChargeStatus.Failed;
            charge.FailureReason = Truncate($"{result.ErrorCode}: {result.ErrorDescription}", 300);
            return ChargeSubmission.Failed;
        }

        /// <summary>
        /// Resolves a charge left Creating by an inconclusive call: finds it at Asaas by its
        /// idempotency key, or — when Asaas never got it — sends it again.
        /// </summary>
        public async Task<ChargeSubmission> ReconcileCreatingChargeAsync(
            SubscriptionCharge charge, BillingProfile profile, CancellationToken cancellationToken)
        {
            var lookup = await _asaas.FindPaymentByExternalReferenceAsync(charge.IdempotencyKey, cancellationToken);
            if (!lookup.IsSuccess)
                return ChargeSubmission.Inconclusive;

            if (lookup.Value is null)
                return await SubmitChargeAsync(charge, profile, null, cancellationToken);

            return ApplyRemotePayment(charge, lookup.Value);
        }

        /// <summary>Marks a charge paid and gives the subscription what it bought.</summary>
        /// <returns>False when the charge was already settled (nothing changed).</returns>
        public async Task<bool> ConfirmChargeAsync(
            Subscription subscription, SubscriptionCharge charge, DateTime now, CancellationToken cancellationToken)
        {
            if (charge.Status is EnumChargeStatus.Confirmed or EnumChargeStatus.Refunded)
                return false;

            charge.Status = EnumChargeStatus.Confirmed;
            charge.ConfirmedAt = now;

            if (subscription.Status == EnumSubscriptionStatus.Expired)
            {
                // Paid after we gave up on it (a boleto that cleared late). Bring it back from
                // today, unless it ended for another reason or the user already started over.
                if (subscription.EndReason != EnumSubscriptionEndReason.PaymentFailed)
                {
                    _logger.LogWarning(
                        "Charge {ChargeId} was paid on subscription {SubscriptionId}, which ended as {Reason}. Review manually.",
                        charge.Id, subscription.Id, subscription.EndReason);
                    return true;
                }

                var otherLive = await _context.Subscriptions.AnyAsync(
                    s => s.UserId == subscription.UserId && s.Id != subscription.Id && s.Status != EnumSubscriptionStatus.Expired,
                    cancellationToken);
                if (otherLive)
                {
                    _logger.LogError(
                        "Charge {ChargeId} paid an expired subscription of user {UserId}, who already has another one. Refund it manually.",
                        charge.Id, subscription.UserId);
                    return true;
                }

                StartPeriodNow(subscription, charge, now);
                subscription.EndReason = null;
                subscription.EndedAt = null;
            }
            else if (subscription.Status == EnumSubscriptionStatus.PendingPayment)
            {
                // First payment (Pix/Boleto, or a card cleared by risk review): the period
                // starts when the money does, not when the form was sent.
                StartPeriodNow(subscription, charge, now);
            }
            else
            {
                subscription.CurrentPeriodStart = charge.PeriodStart;
                subscription.CurrentPeriodEnd = charge.PeriodEnd;
            }

            subscription.Status = EnumSubscriptionStatus.Active;
            subscription.CanceledAt = null;
            subscription.Plan = charge.Plan;
            subscription.Cycle = charge.Cycle;
            subscription.InstallmentCount = charge.InstallmentCount;
            subscription.Price = charge.Amount;
            subscription.PendingPlan = null;
            subscription.PendingCycle = null;
            subscription.PendingInstallmentCount = null;

            return true;
        }

        public static void Expire(Subscription subscription, EnumSubscriptionEndReason reason, DateTime now)
        {
            subscription.Status = EnumSubscriptionStatus.Expired;
            subscription.EndReason = reason;
            subscription.EndedAt = now;
        }

        /// <summary>
        /// Ends a subscription whose payment failed, cleans the open charge at Asaas and
        /// tells the user. Saves.
        /// </summary>
        public async Task ExpireForNonPaymentAsync(
            Subscription subscription, SubscriptionCharge? openCharge, DateTime now, CancellationToken cancellationToken)
        {
            Expire(subscription, EnumSubscriptionEndReason.PaymentFailed, now);

            // A Pix left open could still be paid tomorrow; remove it. A boleto stays — it
            // may already be paid and clearing, and ConfirmChargeAsync revives the
            // subscription if it lands.
            if (openCharge is { BillingMethod: EnumBillingMethod.Pix, Status: EnumChargeStatus.Pending })
                await CancelRemoteChargeAsync(openCharge, cancellationToken);

            await _context.SaveChangesAsync(cancellationToken);

            await _notifier.SendOnceAsync(
                subscription.UserId,
                $"nonpayment-{subscription.Id}-{subscription.CurrentPeriodEnd:yyyyMMdd}",
                user => BillingEmailTemplates.CanceledForNonPayment(user.Name, user.PreferredLanguage, _notifier.PlansUrl),
                cancellationToken);
        }

        /// <summary>
        /// Best-effort removal of an unpaid charge at Asaas. The local row is marked
        /// Canceled either way — if the removal failed and the user pays it after all, the
        /// payment webhook still finds the row and honours it.
        /// </summary>
        /// <returns>Whether Asaas confirmed the removal (or there was nothing there).</returns>
        public async Task<bool> CancelRemoteChargeAsync(SubscriptionCharge charge, CancellationToken cancellationToken)
        {
            if (charge.Status is not (EnumChargeStatus.Pending or EnumChargeStatus.Creating))
                return false;

            var removed = true;
            if (!string.IsNullOrEmpty(charge.AsaasPaymentId))
            {
                var result = await _asaas.DeletePaymentAsync(charge.AsaasPaymentId, cancellationToken);
                removed = result.IsSuccess;
                if (!removed)
                    _logger.LogWarning(
                        "Could not remove charge {ChargeId} ({PaymentId}) at Asaas: {Error}.",
                        charge.Id, charge.AsaasPaymentId, result.ErrorCode ?? result.ErrorDescription);
            }
            else if (charge.Status == EnumChargeStatus.Creating)
            {
                // Never confirmed at Asaas; it may still exist there under its reference.
                removed = false;
            }

            charge.Status = EnumChargeStatus.Canceled;
            return removed;
        }

        public async Task SendPaymentConfirmedAsync(
            Subscription subscription, SubscriptionCharge charge, CancellationToken cancellationToken) =>
            await _notifier.SendOnceAsync(
                subscription.UserId,
                $"paid-{charge.Id}",
                user => BillingEmailTemplates.PaymentConfirmed(
                    user.Name, user.PreferredLanguage, charge.Plan, charge.Amount,
                    subscription.CurrentPeriodEnd, _notifier.ManageUrl),
                cancellationToken);

        /// <summary>Applies one Asaas payment webhook. Saves.</summary>
        public async Task ApplyWebhookAsync(AsaasWebhookPayload payload, DateTime now, CancellationToken cancellationToken)
        {
            var payment = payload.Payment;
            if (payment is null || string.IsNullOrEmpty(payload.Event))
                return;

            var charge = await FindChargeAsync(payment, cancellationToken);
            if (charge is null)
            {
                // Not one of ours (a charge made by hand in the Asaas panel, say).
                _logger.LogInformation(
                    "Webhook {Event} for payment {PaymentId} matches no charge; ignored.", payload.Event, payment.Id);
                return;
            }

            charge.AsaasPaymentId ??= payment.Id;
            charge.AsaasInstallmentId ??= payment.Installment;
            charge.InvoiceUrl ??= payment.InvoiceUrl;
            charge.BankSlipUrl ??= payment.BankSlipUrl;
            if (charge.Status == EnumChargeStatus.Creating)
                charge.Status = EnumChargeStatus.Pending;

            var subscription = charge.Subscription;

            switch (payload.Event)
            {
                case "PAYMENT_CONFIRMED":
                case "PAYMENT_RECEIVED":
                    if (await ConfirmChargeAsync(subscription, charge, now, cancellationToken))
                    {
                        await _context.SaveChangesAsync(cancellationToken);
                        if (subscription.Status == EnumSubscriptionStatus.Active)
                            await SendPaymentConfirmedAsync(subscription, charge, cancellationToken);
                        return;
                    }
                    break;

                case "PAYMENT_CREDIT_CARD_CAPTURE_REFUSED":
                case "PAYMENT_REPROVED_BY_RISK_ANALYSIS":
                    if (charge.Status is EnumChargeStatus.Confirmed or EnumChargeStatus.Refunded or EnumChargeStatus.Failed)
                        break;

                    charge.Status = EnumChargeStatus.Failed;
                    charge.FailureReason = payload.Event;
                    if (DependsOn(subscription, charge))
                    {
                        await ExpireForNonPaymentAsync(subscription, null, now, cancellationToken);
                        return;
                    }
                    break;

                case "PAYMENT_DELETED":
                    if (charge.Status is EnumChargeStatus.Pending or EnumChargeStatus.Creating)
                        charge.Status = EnumChargeStatus.Canceled;
                    break;

                case "PAYMENT_REFUNDED":
                    // An installment plan refunds every installment; the first event does the work.
                    if (charge.Status == EnumChargeStatus.Refunded)
                        break;

                    charge.Status = EnumChargeStatus.Refunded;
                    charge.RefundedAt = now;
                    if (SubscriptionRules.IsLive(subscription.Status) && charge.PeriodEnd >= subscription.CurrentPeriodEnd)
                        Expire(subscription, EnumSubscriptionEndReason.Refunded, now);
                    break;

                case "PAYMENT_CHARGEBACK_REQUESTED":
                    _logger.LogWarning(
                        "Chargeback on charge {ChargeId} of user {UserId}.", charge.Id, charge.UserId);
                    if (SubscriptionRules.IsLive(subscription.Status))
                        Expire(subscription, EnumSubscriptionEndReason.Chargeback, now);
                    break;

                // PAYMENT_OVERDUE needs no handling: the job expires an unpaid renewal at
                // its own deadline, which already includes the due date.
            }

            await _context.SaveChangesAsync(cancellationToken);
        }

        /// Whether the subscription's access hangs on this charge: its first payment, or
        /// the renewal for the period that comes next.
        public static bool DependsOn(Subscription subscription, SubscriptionCharge charge) =>
            SubscriptionRules.IsLive(subscription.Status)
            && (subscription.Status == EnumSubscriptionStatus.PendingPayment
                || charge.PeriodStart >= subscription.CurrentPeriodEnd);

        private async Task<SubscriptionCharge?> FindChargeAsync(AsaasPaymentResponse payment, CancellationToken cancellationToken)
        {
            var query = _context.SubscriptionCharges.Include(c => c.Subscription);

            var charge = await query.FirstOrDefaultAsync(c => c.AsaasPaymentId == payment.Id, cancellationToken);
            if (charge is null && !string.IsNullOrEmpty(payment.Installment))
                charge = await query.FirstOrDefaultAsync(c => c.AsaasInstallmentId == payment.Installment, cancellationToken);
            if (charge is null && !string.IsNullOrEmpty(payment.ExternalReference))
                charge = await query.FirstOrDefaultAsync(c => c.IdempotencyKey == payment.ExternalReference, cancellationToken);

            return charge;
        }

        private static ChargeSubmission ApplyRemotePayment(SubscriptionCharge charge, AsaasPaymentResponse payment)
        {
            charge.AsaasPaymentId ??= payment.Id;
            charge.AsaasInstallmentId ??= payment.Installment;
            charge.InvoiceUrl ??= payment.InvoiceUrl;
            charge.BankSlipUrl ??= payment.BankSlipUrl;
            charge.Status = EnumChargeStatus.Pending;

            return payment.Status is "CONFIRMED" or "RECEIVED"
                ? ChargeSubmission.Paid
                : ChargeSubmission.Pending;
        }

        private static void StartPeriodNow(Subscription subscription, SubscriptionCharge charge, DateTime now)
        {
            charge.PeriodStart = now;
            charge.PeriodEnd = BillingCatalog.AddCycle(now, charge.Cycle);
            subscription.CurrentPeriodStart = charge.PeriodStart;
            subscription.CurrentPeriodEnd = charge.PeriodEnd;
        }

        private static string ToAsaasBillingType(EnumBillingMethod method) => method switch
        {
            EnumBillingMethod.CreditCard => "CREDIT_CARD",
            EnumBillingMethod.Pix => "PIX",
            _ => "BOLETO"
        };

        private static string Describe(SubscriptionCharge charge) =>
            $"Quantia {BillingCatalog.GetName(charge.Plan)} - {(charge.Cycle == EnumBillingCycle.Yearly ? "anual" : "mensal")}";

        private static string Truncate(string value, int max) => value.Length <= max ? value : value[..max];
    }
}

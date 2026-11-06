using System.Globalization;
using FinanceControl.Data.Data;
using FinanceControl.Domain.Entities;
using FinanceControl.Domain.Interfaces.Services;
using FinanceControl.Services.Asaas;
using FinanceControl.Services.Billing;
using FinanceControl.Services.Email;
using FinanceControl.Shared.Dtos.Request;
using FinanceControl.Shared.Dtos.Response;
using FinanceControl.Shared.Enums;
using FinanceControl.Shared.Helpers;
using FinanceControl.Shared.Models;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;

namespace FinanceControl.Services.Services
{
    /// <summary>
    /// Signup, cancellation, refunds and plan or card changes. The recurring side — renewals,
    /// expirations, reminders — lives in SubscriptionBillingJobService and the webhook worker.
    /// </summary>
    public class SubscriptionService : ISubscriptionService
    {
        private readonly ApplicationDbContext _context;
        private readonly AsaasClient _asaas;
        private readonly BillingEngine _engine;
        private readonly BillingSecrets _secrets;
        private readonly BillingNotifier _notifier;
        private readonly TurnstileVerifier _turnstile;
        private readonly BillingSettings _settings;
        private readonly ILogger<SubscriptionService> _logger;

        public SubscriptionService(
            ApplicationDbContext context,
            AsaasClient asaas,
            BillingEngine engine,
            BillingSecrets secrets,
            BillingNotifier notifier,
            TurnstileVerifier turnstile,
            IOptions<BillingSettings> settings,
            ILogger<SubscriptionService> logger)
        {
            _context = context;
            _asaas = asaas;
            _engine = engine;
            _secrets = secrets;
            _notifier = notifier;
            _turnstile = turnstile;
            _settings = settings.Value;
            _logger = logger;
        }

        public async Task<GetSubscriptionPlansResponseDto> GetPlansAsync(int userId)
        {
            var trialConsumed = await _context.BillingProfiles
                .AnyAsync(p => p.UserId == userId && p.TrialConsumedAt != null);

            var options = new List<SubscriptionPlanOptionResponseDto>();
            foreach (var plan in new[] { EnumSubscriptionPlan.Basic, EnumSubscriptionPlan.Premium })
            {
                foreach (var cycle in new[] { EnumBillingCycle.Monthly, EnumBillingCycle.Yearly })
                {
                    var price = BillingCatalog.GetPrice(plan, cycle);
                    options.Add(new SubscriptionPlanOptionResponseDto
                    {
                        Plan = plan,
                        Name = BillingCatalog.GetName(plan),
                        Cycle = cycle,
                        Price = price,
                        MonthlyEquivalent = cycle == EnumBillingCycle.Yearly
                            ? (int)Math.Round(price / 12m, MidpointRounding.AwayFromZero)
                            : price,
                        MaxInstallments = cycle == EnumBillingCycle.Yearly ? BillingCatalog.MaxYearlyInstallments : 1
                    });
                }
            }

            return new GetSubscriptionPlansResponseDto
            {
                TrialDays = _settings.TrialDays,
                IsTrialEligible = !trialConsumed,
                Options = options
            };
        }

        public async Task<GetSubscriptionResponseDto> GetSubscriptionAsync(int userId)
        {
            var now = DateTime.UtcNow;

            var subscription = await _context.Subscriptions
                .AsNoTracking()
                .Where(s => s.UserId == userId)
                .OrderBy(s => s.Status == EnumSubscriptionStatus.Expired)
                .ThenByDescending(s => s.Id)
                .FirstOrDefaultAsync();

            if (subscription is null)
                return new GetSubscriptionResponseDto { HasAccess = false };

            var profile = await _context.BillingProfiles.AsNoTracking().FirstOrDefaultAsync(p => p.UserId == userId);

            var charges = await _context.SubscriptionCharges
                .AsNoTracking()
                .Where(c => c.UserId == userId && c.SubscriptionId == subscription.Id)
                .OrderByDescending(c => c.PeriodStart)
                .Take(24)
                .ToListAsync();

            var isLive = SubscriptionRules.IsLive(subscription.Status);
            var pendingCharge = isLive
                ? charges.FirstOrDefault(c => c.Status == EnumChargeStatus.Pending && c.BillingMethod != EnumBillingMethod.CreditCard)
                : null;

            var response = new GetSubscriptionResponseDto
            {
                HasAccess = SubscriptionRules.HasAccess(subscription, now),
                Status = subscription.Status,
                EndReason = subscription.EndReason,
                Plan = subscription.Plan,
                Cycle = subscription.Cycle,
                BillingMethod = subscription.BillingMethod,
                InstallmentCount = subscription.InstallmentCount,
                Price = subscription.Price,
                TrialEndsAt = subscription.TrialEndsAt,
                CurrentPeriodStart = subscription.CurrentPeriodStart,
                CurrentPeriodEnd = subscription.CurrentPeriodEnd,
                CanceledAt = subscription.CanceledAt,
                EndedAt = subscription.EndedAt,
                IsComplimentary = subscription.IsComplimentary,
                PendingCharge = pendingCharge is null ? null : ToChargeDto(pendingCharge),
                // The renewal charge is issued RenewalNoticeDays before its due date (the
                // boleto's sits earlier than the period end), so its existence is the notice.
                ShowRenewalReminder = subscription.Status == EnumSubscriptionStatus.Active
                    && !subscription.IsComplimentary
                    && pendingCharge is not null
                    && pendingCharge.PeriodStart >= subscription.CurrentPeriodEnd,
                CanRequestRefund = FindRefundableCharge(subscription, charges, now) is not null,
                CanResume = subscription.Status == EnumSubscriptionStatus.Canceled
                    && subscription.EarlyTerminatedAt is null
                    && now < subscription.CurrentPeriodEnd,
                Charges = charges.Where(c => c.Status != EnumChargeStatus.Creating).Select(ToChargeDto).ToList()
            };

            if (subscription.BillingMethod == EnumBillingMethod.CreditCard && !subscription.IsComplimentary)
            {
                response.CardBrand = profile?.CardBrand;
                response.CardLast4 = profile?.CardLast4;
            }

            if (isLive && (subscription.PendingPlan is not null || subscription.PendingCycle is not null))
            {
                var plan = subscription.PendingPlan ?? subscription.Plan;
                var cycle = subscription.PendingCycle ?? subscription.Cycle;
                response.PendingChange = new SubscriptionPendingChangeResponseDto
                {
                    Plan = plan,
                    Cycle = cycle,
                    InstallmentCount = subscription.PendingInstallmentCount ?? subscription.InstallmentCount,
                    Price = BillingCatalog.GetPrice(plan, cycle),
                    EffectiveAt = subscription.CurrentPeriodEnd
                };
            }

            return response;
        }

        public async Task<Result<GetSubscriptionResponseDto>> CreateSubscriptionAsync(
            CreateSubscriptionRequestDto requestDto, int userId, string? remoteIp, CancellationToken cancellationToken = default)
        {
            var now = DateTime.UtcNow;

            if (await HasLiveSubscriptionAsync(userId, cancellationToken))
                return Fail(BillingErrors.AlreadySubscribed);

            var user = await _context.Users.FirstOrDefaultAsync(u => u.Id == userId, cancellationToken);
            if (user is null)
                return Fail(BillingErrors.UserNotFound);

            var profile = await GetOrCreateProfileAsync(userId, cancellationToken);
            var payByCard = requestDto.BillingMethod == EnumBillingMethod.CreditCard;

            if (payByCard && CardAttemptsExceeded(profile, now))
                return Fail(BillingErrors.CardAttemptsExceeded);

            if (!await _turnstile.VerifyAsync(requestDto.CaptchaToken, remoteIp, cancellationToken))
                return Fail(BillingErrors.CaptchaFailed);

            var cpf = CpfHelper.Normalize(requestDto.Cpf);
            var cpfHash = _secrets.HashCpf(cpf);

            // One trial per person: this account never had one, and no other account with
            // the same CPF did either — including accounts deleted since (TrialUsages
            // outlives them). Only cards get a trial — Pix and boleto cannot be charged at
            // its end without the user acting.
            var trialEligible = payByCard
                && profile.TrialConsumedAt is null
                && !await _context.TrialUsages.AnyAsync(t => t.CpfHash == cpfHash, cancellationToken)
                && !await _context.BillingProfiles.AnyAsync(
                    p => p.CpfHash == cpfHash && p.TrialConsumedAt != null && p.UserId != userId,
                    cancellationToken);

            // The checkout promised a trial it cannot give: charge nothing, let the client
            // show the price and ask again.
            if (payByCard && requestDto.ExpectTrial && !trialEligible)
                return Fail(BillingErrors.TrialNotEligible);

            var customerError = await EnsureCustomerAsync(
                profile, user, cpf, requestDto.MobilePhone, requestDto.PostalCode, requestDto.AddressNumber, cancellationToken);
            if (customerError is not null)
            {
                await _context.SaveChangesAsync(cancellationToken);
                return Fail(customerError);
            }
            profile.CpfHash = cpfHash;

            if (payByCard)
            {
                var tokenError = await TokenizeCardAsync(
                    profile, user, requestDto.Card!, cpf, requestDto.MobilePhone, requestDto.PostalCode,
                    requestDto.AddressNumber, remoteIp, now, cancellationToken);
                if (tokenError is not null)
                {
                    await _context.SaveChangesAsync(cancellationToken);
                    return Fail(tokenError);
                }
            }

            var installments = BillingCatalog.AllowsInstallments(requestDto.Cycle, requestDto.BillingMethod)
                ? requestDto.InstallmentCount
                : 1;

            var subscription = new Subscription
            {
                UserId = userId,
                Plan = requestDto.Plan,
                Cycle = requestDto.Cycle,
                BillingMethod = requestDto.BillingMethod,
                InstallmentCount = installments,
                Price = BillingCatalog.GetPrice(requestDto.Plan, requestDto.Cycle),
                CurrentPeriodStart = now,
                CurrentPeriodEnd = now
            };

            if (trialEligible)
            {
                subscription.Status = EnumSubscriptionStatus.Trialing;
                subscription.TrialEndsAt = now.AddDays(_settings.TrialDays);
                subscription.CurrentPeriodEnd = subscription.TrialEndsAt.Value;
                profile.TrialConsumedAt = now;
                _context.TrialUsages.Add(new TrialUsage { CpfHash = cpfHash, UsedAt = now });
            }
            else
            {
                subscription.Status = EnumSubscriptionStatus.PendingPayment;
            }

            _context.Subscriptions.Add(subscription);
            if (!await TrySaveNewSubscriptionAsync(cancellationToken))
                return Fail(BillingErrors.AlreadySubscribed);

            if (trialEligible)
            {
                await SendStartedEmailAsync(subscription, profile, cancellationToken);
                return Result<GetSubscriptionResponseDto>.Success(await GetSubscriptionAsync(userId));
            }

            // No trial: the first period is charged now.
            var dueDate = payByCard
                ? BillingClock.ToLocalDate(now)
                : BillingEngine.FirstPaymentDueDate(requestDto.BillingMethod, now);
            var charge = BillingEngine.BuildCharge(subscription, now, dueDate, applyPendingChange: false);
            _context.SubscriptionCharges.Add(charge);
            await _context.SaveChangesAsync(cancellationToken);

            var outcome = await _engine.SubmitChargeAsync(charge, profile, remoteIp, cancellationToken);

            switch (outcome)
            {
                case ChargeSubmission.Paid:
                    await _engine.ConfirmChargeAsync(subscription, charge, now, cancellationToken);
                    await _context.SaveChangesAsync(cancellationToken);
                    await SendStartedEmailAsync(subscription, profile, cancellationToken);
                    break;

                case ChargeSubmission.Failed:
                    // Nothing exists at Asaas; leave no half-made subscription behind.
                    if (payByCard)
                        RegisterCardFailure(profile, now);
                    _context.SubscriptionCharges.Remove(charge);
                    _context.Subscriptions.Remove(subscription);
                    await _context.SaveChangesAsync(cancellationToken);
                    return Fail(payByCard ? BillingErrors.CardDeclined : BillingErrors.GatewayRejected);

                default:
                    // Pending (Pix/Boleto waiting, card under review) or inconclusive (the job
                    // reconciles it). Either way the client shows "processing / pay now".
                    await _context.SaveChangesAsync(cancellationToken);
                    break;
            }

            return Result<GetSubscriptionResponseDto>.Success(await GetSubscriptionAsync(userId));
        }

        public async Task<Result<SubscriptionCancellationPreviewResponseDto>> GetCancellationPreviewAsync(
            int userId, CancellationToken cancellationToken = default)
        {
            var now = DateTime.UtcNow;
            var subscription = await GetLiveSubscriptionAsync(userId, cancellationToken);
            if (subscription is null || subscription.Status == EnumSubscriptionStatus.Canceled)
                return Result<SubscriptionCancellationPreviewResponseDto>.Failure(BillingErrors.NoSubscription);

            var plan = PlanCancellation(subscription, await GetChargesAsync(subscription, cancellationToken), now);

            return Result<SubscriptionCancellationPreviewResponseDto>.Success(plan.Kind switch
            {
                EnumCancellationKind.Withdrawal => new SubscriptionCancellationPreviewResponseDto
                {
                    Kind = plan.Kind,
                    RefundAmount = plan.Charge!.Amount,
                    RefundIsManual = plan.Charge.BillingMethod == EnumBillingMethod.Boleto
                },
                EnumCancellationKind.EarlyTermination => new SubscriptionCancellationPreviewResponseDto
                {
                    Kind = plan.Kind,
                    AccessUntil = plan.Quote!.AccessUntil,
                    RefundAmount = plan.Quote.Refund,
                    FeeAmount = plan.Quote.Fee,
                    MonthsUsed = plan.Quote.MonthsUsed,
                    RefundIsManual = plan.Charge!.BillingMethod == EnumBillingMethod.Boleto
                },
                EnumCancellationKind.Immediate => new SubscriptionCancellationPreviewResponseDto { Kind = plan.Kind },
                _ => new SubscriptionCancellationPreviewResponseDto
                {
                    Kind = plan.Kind,
                    AccessUntil = subscription.CurrentPeriodEnd
                }
            });
        }

        /// <summary>
        /// Cancels the subscription. Monthly plans and trials stop renewing and keep access
        /// until the period paid for ends. A yearly plan inside the withdrawal window is
        /// refunded in full; after it, the months not started are refunded minus the
        /// early-termination fee and access lasts until the current month of the plan ends.
        /// </summary>
        public async Task<Result<GetSubscriptionResponseDto>> CancelSubscriptionAsync(
            int userId, CancellationToken cancellationToken = default)
        {
            var now = DateTime.UtcNow;
            var subscription = await GetLiveSubscriptionAsync(userId, cancellationToken);
            if (subscription is null)
                return Fail(BillingErrors.NoSubscription);

            if (subscription.Status == EnumSubscriptionStatus.Canceled)
                return Result<GetSubscriptionResponseDto>.Success(await GetSubscriptionAsync(userId));

            await CancelOpenManualChargesAsync(subscription, cancellationToken);

            var plan = PlanCancellation(subscription, await GetChargesAsync(subscription, cancellationToken), now);

            switch (plan.Kind)
            {
                case EnumCancellationKind.Immediate:
                    // Never paid: nothing to keep access to.
                    BillingEngine.Expire(subscription, EnumSubscriptionEndReason.Canceled, now);
                    await _context.SaveChangesAsync(cancellationToken);
                    return Result<GetSubscriptionResponseDto>.Success(await GetSubscriptionAsync(userId));

                case EnumCancellationKind.Withdrawal:
                {
                    var error = await WithdrawAsync(subscription, plan.Charge!, now, cancellationToken);
                    return error is not null
                        ? Fail(error)
                        : Result<GetSubscriptionResponseDto>.Success(await GetSubscriptionAsync(userId));
                }

                case EnumCancellationKind.EarlyTermination:
                {
                    var quote = plan.Quote!;
                    var outcome = await _engine.RefundAsync(
                        plan.Charge!, quote.Refund, "Cancelamento antecipado do plano anual", now, cancellationToken);
                    if (ToRefundError(outcome) is { } error)
                        return Fail(error);

                    MarkCanceled(subscription, now);
                    subscription.EarlyTerminatedAt = now;
                    subscription.CurrentPeriodEnd = quote.AccessUntil;
                    await _context.SaveChangesAsync(cancellationToken);

                    await _notifier.SendOnceAsync(
                        userId,
                        $"canceled-{subscription.Id}-{now:yyyyMMddHHmm}",
                        user => BillingEmailTemplates.SubscriptionCanceled(
                            user.Name, user.PreferredLanguage, quote.AccessUntil, _notifier.ManageUrl,
                            quote.Refund, quote.Fee, outcome == RefundOutcome.ManualPending),
                        cancellationToken);
                    return Result<GetSubscriptionResponseDto>.Success(await GetSubscriptionAsync(userId));
                }

                default:
                    MarkCanceled(subscription, now);
                    await _context.SaveChangesAsync(cancellationToken);

                    await _notifier.SendOnceAsync(
                        userId,
                        $"canceled-{subscription.Id}-{now:yyyyMMddHHmm}",
                        user => BillingEmailTemplates.SubscriptionCanceled(
                            user.Name, user.PreferredLanguage, subscription.CurrentPeriodEnd, _notifier.ManageUrl),
                        cancellationToken);
                    return Result<GetSubscriptionResponseDto>.Success(await GetSubscriptionAsync(userId));
            }
        }

        public async Task<Result<GetSubscriptionResponseDto>> ResumeSubscriptionAsync(
            int userId, CancellationToken cancellationToken = default)
        {
            var now = DateTime.UtcNow;
            var subscription = await GetLiveSubscriptionAsync(userId, cancellationToken);

            // An early termination was refunded; it cannot be taken back.
            if (subscription is null
                || subscription.Status != EnumSubscriptionStatus.Canceled
                || subscription.EarlyTerminatedAt is not null
                || now >= subscription.CurrentPeriodEnd)
                return Fail(BillingErrors.NotResumable);

            // Still inside the trial when the period is the trial itself.
            subscription.Status = subscription.TrialEndsAt == subscription.CurrentPeriodEnd
                ? EnumSubscriptionStatus.Trialing
                : EnumSubscriptionStatus.Active;
            subscription.CanceledAt = null;
            await _context.SaveChangesAsync(cancellationToken);

            return Result<GetSubscriptionResponseDto>.Success(await GetSubscriptionAsync(userId));
        }

        public async Task<Result<GetSubscriptionResponseDto>> RequestRefundAsync(
            int userId, CancellationToken cancellationToken = default)
        {
            var now = DateTime.UtcNow;
            var subscription = await GetLiveSubscriptionAsync(userId, cancellationToken);
            if (subscription is null)
                return Fail(BillingErrors.NotRefundable);

            var charge = FindRefundableCharge(subscription, await GetChargesAsync(subscription, cancellationToken), now);
            if (charge is null)
                return Fail(BillingErrors.NotRefundable);

            var error = await WithdrawAsync(subscription, charge, now, cancellationToken);
            return error is not null
                ? Fail(error)
                : Result<GetSubscriptionResponseDto>.Success(await GetSubscriptionAsync(userId));
        }

        public async Task<Result> TerminateForAccountDeletionAsync(int userId, CancellationToken cancellationToken = default)
        {
            var now = DateTime.UtcNow;
            var subscription = await GetLiveSubscriptionAsync(userId, cancellationToken);
            if (subscription is null)
                return Result.Success();

            await CancelOpenManualChargesAsync(subscription, cancellationToken);

            var plan = PlanCancellation(subscription, await GetChargesAsync(subscription, cancellationToken), now);
            var refund = plan.Kind switch
            {
                EnumCancellationKind.Withdrawal => plan.Charge!.Amount,
                EnumCancellationKind.EarlyTermination => plan.Quote!.Refund,
                _ => 0
            };

            if (refund > 0)
            {
                var outcome = await _engine.RefundAsync(
                    plan.Charge!, refund,
                    plan.Kind == EnumCancellationKind.Withdrawal ? "Direito de arrependimento" : "Cancelamento antecipado do plano anual",
                    now, cancellationToken);
                if (ToRefundError(outcome) is { } error)
                    return Result.Failure(error);

                // Sent before the account goes: the e-mail address goes with it.
                await _notifier.SendOnceAsync(
                    userId,
                    $"refunded-{plan.Charge!.Id}",
                    user => BillingEmailTemplates.Refunded(
                        user.Name, user.PreferredLanguage, refund, _notifier.PlansUrl, outcome == RefundOutcome.ManualPending),
                    cancellationToken);
            }

            BillingEngine.Expire(subscription, EnumSubscriptionEndReason.Canceled, now);
            await _context.SaveChangesAsync(cancellationToken);
            return Result.Success();
        }

        private sealed record CancellationPlan(
            EnumCancellationKind Kind, SubscriptionCharge? Charge = null, EarlyTerminationQuote? Quote = null);

        private CancellationPlan PlanCancellation(Subscription subscription, List<SubscriptionCharge> charges, DateTime now)
        {
            if (subscription.Status == EnumSubscriptionStatus.PendingPayment)
                return new CancellationPlan(EnumCancellationKind.Immediate);

            if (subscription.IsComplimentary
                || subscription.Cycle != EnumBillingCycle.Yearly
                || subscription.Status != EnumSubscriptionStatus.Active)
                return new CancellationPlan(EnumCancellationKind.EndOfPeriod);

            var withdrawal = FindRefundableCharge(subscription, charges, now);
            if (withdrawal is not null)
                return new CancellationPlan(EnumCancellationKind.Withdrawal, withdrawal);

            // The charge that paid for the year in course.
            var paid = charges
                .Where(c => c.Status == EnumChargeStatus.Confirmed
                    && c.Cycle == EnumBillingCycle.Yearly
                    && c.PeriodEnd == subscription.CurrentPeriodEnd
                    && (c.AsaasPaymentId is not null || c.AsaasInstallmentId is not null))
                .OrderByDescending(c => c.ConfirmedAt)
                .FirstOrDefault();
            if (paid is null)
                return new CancellationPlan(EnumCancellationKind.EndOfPeriod);

            var quote = BillingEngine.QuoteEarlyTermination(paid, now, _settings.EarlyTerminationFeePercent);
            return quote.Refund > 0
                ? new CancellationPlan(EnumCancellationKind.EarlyTermination, paid, quote)
                : new CancellationPlan(EnumCancellationKind.EndOfPeriod);
        }

        /// Full refund of the first payment and the end of the subscription (CDC art. 49).
        /// Returns an error code, or null when done.
        private async Task<string?> WithdrawAsync(
            Subscription subscription, SubscriptionCharge charge, DateTime now, CancellationToken cancellationToken)
        {
            var outcome = await _engine.RefundAsync(charge, charge.Amount, "Direito de arrependimento", now, cancellationToken);
            if (ToRefundError(outcome) is { } error)
                return error;

            BillingEngine.Expire(subscription, EnumSubscriptionEndReason.Refunded, now);
            await _context.SaveChangesAsync(cancellationToken);

            await _notifier.SendOnceAsync(
                subscription.UserId,
                $"refunded-{charge.Id}",
                user => BillingEmailTemplates.Refunded(
                    user.Name, user.PreferredLanguage, charge.Amount, _notifier.PlansUrl, outcome == RefundOutcome.ManualPending),
                cancellationToken);
            return null;
        }

        private static string? ToRefundError(RefundOutcome outcome) => outcome switch
        {
            RefundOutcome.Unavailable => BillingErrors.GatewayUnavailable,
            RefundOutcome.Rejected => BillingErrors.GatewayRejected,
            _ => null
        };

        private static void MarkCanceled(Subscription subscription, DateTime now)
        {
            subscription.Status = EnumSubscriptionStatus.Canceled;
            subscription.CanceledAt = now;
            subscription.PendingPlan = null;
            subscription.PendingCycle = null;
            subscription.PendingInstallmentCount = null;
        }

        // A Pix or boleto renewal already issued must not be paid after a cancel.
        private async Task CancelOpenManualChargesAsync(Subscription subscription, CancellationToken cancellationToken)
        {
            var openCharges = await _context.SubscriptionCharges
                .Where(c => c.UserId == subscription.UserId && c.SubscriptionId == subscription.Id
                    && (c.Status == EnumChargeStatus.Pending || c.Status == EnumChargeStatus.Creating)
                    && c.BillingMethod != EnumBillingMethod.CreditCard)
                .ToListAsync(cancellationToken);

            foreach (var charge in openCharges)
                await _engine.CancelRemoteChargeAsync(charge, cancellationToken);
        }

        private Task<List<SubscriptionCharge>> GetChargesAsync(Subscription subscription, CancellationToken cancellationToken) =>
            _context.SubscriptionCharges
                .Where(c => c.UserId == subscription.UserId && c.SubscriptionId == subscription.Id)
                .ToListAsync(cancellationToken);

        public async Task<Result<ChangeSubscriptionPlanResponseDto>> ChangePlanAsync(
            ChangeSubscriptionPlanRequestDto requestDto, int userId, CancellationToken cancellationToken = default)
        {
            var subscription = await GetLiveSubscriptionAsync(userId, cancellationToken);
            if (subscription is null
                || subscription.IsComplimentary
                || subscription.Status is not (EnumSubscriptionStatus.Trialing or EnumSubscriptionStatus.Active))
                return Result<ChangeSubscriptionPlanResponseDto>.Failure(BillingErrors.PlanChangeNotAllowed);

            var installments = BillingCatalog.AllowsInstallments(requestDto.Cycle, subscription.BillingMethod)
                ? requestDto.InstallmentCount
                : 1;

            var targetPlan = subscription.PendingPlan ?? subscription.Plan;
            var targetCycle = subscription.PendingCycle ?? subscription.Cycle;
            var targetInstallments = subscription.PendingInstallmentCount ?? subscription.InstallmentCount;
            if (targetPlan == requestDto.Plan && targetCycle == requestDto.Cycle && targetInstallments == installments)
                return Result<ChangeSubscriptionPlanResponseDto>.Failure(BillingErrors.NothingToChange);

            var isTrial = subscription.Status == EnumSubscriptionStatus.Trialing;
            var isUpgrade = requestDto.Plan > subscription.Plan;
            var price = BillingCatalog.GetPrice(requestDto.Plan, requestDto.Cycle);

            var response = new ChangeSubscriptionPlanResponseDto
            {
                Plan = requestDto.Plan,
                Cycle = requestDto.Cycle,
                InstallmentCount = installments,
                Price = price,
                NextChargeAt = subscription.CurrentPeriodEnd,
                PlanAppliesNow = isTrial || isUpgrade,
                Applied = false
            };

            if (!requestDto.Confirm)
                return Result<ChangeSubscriptionPlanResponseDto>.Success(response);

            if (isTrial)
            {
                // Nothing was paid yet: the trial simply continues on the new plan, and the
                // charge at its end uses the new price.
                subscription.Plan = requestDto.Plan;
                subscription.Cycle = requestDto.Cycle;
                subscription.InstallmentCount = installments;
                subscription.Price = price;
                subscription.PendingPlan = null;
                subscription.PendingCycle = null;
                subscription.PendingInstallmentCount = null;
            }
            else
            {
                // The new price waits for the renewal; an upgrade unlocks its features today.
                subscription.PendingPlan = requestDto.Plan;
                subscription.PendingCycle = requestDto.Cycle;
                subscription.PendingInstallmentCount = installments;
                if (isUpgrade)
                    subscription.Plan = requestDto.Plan;

                // A Pix/Boleto renewal already issued carries the old price; drop it so the
                // job issues the right one. Only when Asaas confirms the removal — otherwise
                // the user might pay a charge we no longer know about, and the renewal simply
                // goes through at the old price.
                var issuedRenewals = await _context.SubscriptionCharges
                    .Where(c => c.UserId == userId && c.SubscriptionId == subscription.Id
                        && c.PeriodStart >= subscription.CurrentPeriodEnd
                        && c.Status == EnumChargeStatus.Pending)
                    .ToListAsync(cancellationToken);
                foreach (var charge in issuedRenewals)
                {
                    if (await _engine.CancelRemoteChargeAsync(charge, cancellationToken))
                        _context.SubscriptionCharges.Remove(charge);
                    else
                        charge.Status = EnumChargeStatus.Pending;
                }
            }

            await _context.SaveChangesAsync(cancellationToken);

            response.Applied = true;
            response.Subscription = await GetSubscriptionAsync(userId);
            return Result<ChangeSubscriptionPlanResponseDto>.Success(response);
        }

        public async Task<Result<GetSubscriptionResponseDto>> UpdateCardAsync(
            UpdateSubscriptionCardRequestDto requestDto, int userId, string? remoteIp, CancellationToken cancellationToken = default)
        {
            var now = DateTime.UtcNow;
            var subscription = await GetLiveSubscriptionAsync(userId, cancellationToken);
            if (subscription is null || subscription.Status == EnumSubscriptionStatus.PendingPayment)
                return Fail(BillingErrors.NoSubscription);
            if (subscription.BillingMethod != EnumBillingMethod.CreditCard || subscription.IsComplimentary)
                return Fail(BillingErrors.NotPaidByCard);

            var user = await _context.Users.FirstOrDefaultAsync(u => u.Id == userId, cancellationToken);
            var profile = await _context.BillingProfiles.FirstOrDefaultAsync(p => p.UserId == userId, cancellationToken);
            if (user is null || profile?.AsaasCustomerId is null)
                return Fail(BillingErrors.NoSubscription);

            if (CardAttemptsExceeded(profile, now))
                return Fail(BillingErrors.CardAttemptsExceeded);

            if (!await _turnstile.VerifyAsync(requestDto.CaptchaToken, remoteIp, cancellationToken))
                return Fail(BillingErrors.CaptchaFailed);

            var tokenError = await TokenizeCardAsync(
                profile, user, requestDto.Card, CpfHelper.Normalize(requestDto.Cpf), requestDto.MobilePhone,
                requestDto.PostalCode, requestDto.AddressNumber, remoteIp, now, cancellationToken);
            await _context.SaveChangesAsync(cancellationToken);

            return tokenError is not null
                ? Fail(tokenError)
                : Result<GetSubscriptionResponseDto>.Success(await GetSubscriptionAsync(userId));
        }

        public async Task<Result<SubscriptionPixQrCodeResponseDto>> GetPendingPixQrCodeAsync(
            int userId, CancellationToken cancellationToken = default)
        {
            var now = DateTime.UtcNow;
            var subscription = await GetLiveSubscriptionAsync(userId, cancellationToken);
            if (subscription is null)
                return Result<SubscriptionPixQrCodeResponseDto>.Failure(BillingErrors.NoPendingPix);

            var charge = await _context.SubscriptionCharges
                .Where(c => c.UserId == userId && c.SubscriptionId == subscription.Id
                    && c.Status == EnumChargeStatus.Pending
                    && c.BillingMethod == EnumBillingMethod.Pix
                    && c.AsaasPaymentId != null)
                .OrderByDescending(c => c.PeriodStart)
                .FirstOrDefaultAsync(cancellationToken);
            if (charge is null)
                return Result<SubscriptionPixQrCodeResponseDto>.Failure(BillingErrors.NoPendingPix);

            if (charge.PixPayload is null || charge.PixExpiresAt is null || charge.PixExpiresAt <= now.AddMinutes(1))
            {
                var qr = await _asaas.GetPixQrCodeAsync(charge.AsaasPaymentId!, cancellationToken);
                if (!qr.IsSuccess || qr.Value is null)
                    return Result<SubscriptionPixQrCodeResponseDto>.Failure(
                        qr.IsInconclusive ? BillingErrors.GatewayUnavailable : BillingErrors.GatewayRejected);

                charge.PixPayload = qr.Value!.Payload;
                charge.PixQrImage = qr.Value.EncodedImage;
                charge.PixExpiresAt = ParseAsaasLocalDateTime(qr.Value.ExpirationDate)
                    ?? BillingEngine.ChargeDeadline(charge);
                await _context.SaveChangesAsync(cancellationToken);
            }

            return Result<SubscriptionPixQrCodeResponseDto>.Success(new SubscriptionPixQrCodeResponseDto
            {
                Payload = charge.PixPayload!,
                QrImageBase64 = charge.PixQrImage ?? string.Empty,
                ExpiresAt = charge.PixExpiresAt,
                Amount = charge.Amount,
                DueDate = charge.DueDate
            });
        }

        public async Task<Result<GetSubscriptionResponseDto>> GrantComplimentaryAsync(
            GrantComplimentarySubscriptionRequestDto requestDto, int targetUserId)
        {
            if (!await _context.Users.AnyAsync(u => u.Id == targetUserId))
                return Fail(BillingErrors.UserNotFound);
            if (await HasLiveSubscriptionAsync(targetUserId, CancellationToken.None))
                return Fail(BillingErrors.AlreadySubscribed);

            var now = DateTime.UtcNow;
            _context.Subscriptions.Add(new Subscription
            {
                UserId = targetUserId,
                Plan = requestDto.Plan,
                Cycle = EnumBillingCycle.Monthly,
                BillingMethod = EnumBillingMethod.CreditCard,
                Price = 0,
                Status = EnumSubscriptionStatus.Active,
                IsComplimentary = true,
                CurrentPeriodStart = now,
                CurrentPeriodEnd = now.AddMonths(requestDto.Months)
            });

            if (!await TrySaveNewSubscriptionAsync(CancellationToken.None))
                return Fail(BillingErrors.AlreadySubscribed);

            return Result<GetSubscriptionResponseDto>.Success(await GetSubscriptionAsync(targetUserId));
        }

        // The first paid charge, while it is within the withdrawal window. Renewals are not
        // refundable this way: the right covers the decision to sign up, not each month.
        private SubscriptionCharge? FindRefundableCharge(
            Subscription subscription, IEnumerable<SubscriptionCharge> charges, DateTime now)
        {
            if (subscription.IsComplimentary
                || subscription.Status is not (EnumSubscriptionStatus.Active or EnumSubscriptionStatus.Canceled))
                return null;

            var first = charges
                .Where(c => c.ConfirmedAt != null)
                .OrderBy(c => c.ConfirmedAt)
                .FirstOrDefault();

            return first is { Status: EnumChargeStatus.Confirmed }
                && first.ConfirmedAt >= now.AddDays(-_settings.RefundWindowDays)
                && (first.AsaasPaymentId is not null || first.AsaasInstallmentId is not null)
                ? first
                : null;
        }

        private async Task<string?> EnsureCustomerAsync(
            BillingProfile profile, User user, string cpf, string mobilePhone, string postalCode, string addressNumber,
            CancellationToken cancellationToken)
        {
            var request = new AsaasCustomerRequest
            {
                Name = user.Name,
                CpfCnpj = cpf,
                Email = user.Email,
                MobilePhone = Digits(mobilePhone),
                PostalCode = Digits(postalCode),
                AddressNumber = addressNumber.Trim(),
                ExternalReference = user.Id.ToString(CultureInfo.InvariantCulture),
                NotificationDisabled = true
            };

            var result = profile.AsaasCustomerId is null
                ? await _asaas.CreateCustomerAsync(request, cancellationToken)
                : await _asaas.UpdateCustomerAsync(profile.AsaasCustomerId, request, cancellationToken);

            if (result.IsSuccess && !string.IsNullOrEmpty(result.Value?.Id))
            {
                profile.AsaasCustomerId = result.Value.Id;
                return null;
            }
            if (result.IsSuccess)
                return BillingErrors.GatewayUnavailable;

            return result.IsInconclusive ? BillingErrors.GatewayUnavailable : BillingErrors.GatewayRejected;
        }

        private async Task<string?> TokenizeCardAsync(
            BillingProfile profile, User user, SubscriptionCardRequestDto card, string cpf, string mobilePhone,
            string postalCode, string addressNumber, string? remoteIp, DateTime now, CancellationToken cancellationToken)
        {
            var result = await _asaas.TokenizeCardAsync(new AsaasTokenizeRequest
            {
                Customer = profile.AsaasCustomerId!,
                CreditCard = new AsaasCreditCard
                {
                    HolderName = card.HolderName.Trim(),
                    Number = Digits(card.Number),
                    ExpiryMonth = card.ExpiryMonth.Trim().PadLeft(2, '0'),
                    ExpiryYear = card.ExpiryYear.Trim().Length == 2 ? $"20{card.ExpiryYear.Trim()}" : card.ExpiryYear.Trim(),
                    Ccv = card.Cvv.Trim()
                },
                CreditCardHolderInfo = new AsaasCreditCardHolderInfo
                {
                    Name = card.HolderName.Trim(),
                    Email = user.Email,
                    CpfCnpj = cpf,
                    PostalCode = Digits(postalCode),
                    AddressNumber = addressNumber.Trim(),
                    Phone = Digits(mobilePhone),
                    MobilePhone = Digits(mobilePhone)
                },
                RemoteIp = remoteIp ?? string.Empty
            }, cancellationToken);

            if (result.IsInconclusive || (result.IsSuccess && string.IsNullOrEmpty(result.Value?.CreditCardToken)))
                return BillingErrors.GatewayUnavailable;

            if (!result.IsSuccess)
            {
                RegisterCardFailure(profile, now);
                return BillingErrors.CardDeclined;
            }

            profile.CardTokenCipher = _secrets.ProtectCardToken(result.Value!.CreditCardToken);
            profile.CardBrand = result.Value.CreditCardBrand;
            profile.CardLast4 = LastFour(result.Value.CreditCardNumber);
            return null;
        }

        private bool CardAttemptsExceeded(BillingProfile profile, DateTime now) =>
            profile.CardFailureWindowStart is { } start
            && now - start < TimeSpan.FromDays(1)
            && profile.CardFailureCount >= _settings.MaxCardFailuresPerDay;

        private static void RegisterCardFailure(BillingProfile profile, DateTime now)
        {
            if (profile.CardFailureWindowStart is not { } start || now - start >= TimeSpan.FromDays(1))
            {
                profile.CardFailureWindowStart = now;
                profile.CardFailureCount = 1;
            }
            else
            {
                profile.CardFailureCount++;
            }
        }

        private async Task SendStartedEmailAsync(
            Subscription subscription, BillingProfile profile, CancellationToken cancellationToken) =>
            await _notifier.SendOnceAsync(
                subscription.UserId,
                $"started-{subscription.Id}",
                user => BillingEmailTemplates.SubscriptionStarted(
                    user.Name, user.PreferredLanguage, subscription.Plan, subscription.Price, subscription.Cycle,
                    subscription.Status == EnumSubscriptionStatus.Trialing ? subscription.TrialEndsAt : null,
                    subscription.BillingMethod == EnumBillingMethod.CreditCard ? profile.CardLast4 : null,
                    _notifier.ManageUrl),
                cancellationToken);

        private async Task<BillingProfile> GetOrCreateProfileAsync(int userId, CancellationToken cancellationToken)
        {
            var profile = await _context.BillingProfiles.FirstOrDefaultAsync(p => p.UserId == userId, cancellationToken);
            if (profile is not null)
                return profile;

            profile = new BillingProfile { UserId = userId };
            _context.BillingProfiles.Add(profile);
            return profile;
        }

        private Task<bool> HasLiveSubscriptionAsync(int userId, CancellationToken cancellationToken) =>
            _context.Subscriptions.AnyAsync(
                s => s.UserId == userId && s.Status != EnumSubscriptionStatus.Expired, cancellationToken);

        private Task<Subscription?> GetLiveSubscriptionAsync(int userId, CancellationToken cancellationToken) =>
            _context.Subscriptions.FirstOrDefaultAsync(
                s => s.UserId == userId && s.Status != EnumSubscriptionStatus.Expired, cancellationToken);

        // The filtered unique index is what stops two signups racing past the check above.
        private async Task<bool> TrySaveNewSubscriptionAsync(CancellationToken cancellationToken)
        {
            try
            {
                await _context.SaveChangesAsync(cancellationToken);
                return true;
            }
            catch (DbUpdateException)
            {
                foreach (var entry in _context.ChangeTracker.Entries<Subscription>().Where(e => e.State == EntityState.Added).ToList())
                    entry.State = EntityState.Detached;
                return false;
            }
        }

        // Asaas returns local (Brasília) timestamps without an offset.
        private static DateTime? ParseAsaasLocalDateTime(string? value)
        {
            if (!DateTime.TryParseExact(value, "yyyy-MM-dd HH:mm:ss", CultureInfo.InvariantCulture, DateTimeStyles.None, out var local))
                return null;

            return TimeZoneInfo.ConvertTimeToUtc(local, TimeZoneInfo.FindSystemTimeZoneById("America/Sao_Paulo"));
        }

        private static SubscriptionChargeResponseDto ToChargeDto(SubscriptionCharge charge) => new()
        {
            Id = charge.Id,
            Plan = charge.Plan,
            Cycle = charge.Cycle,
            BillingMethod = charge.BillingMethod,
            Amount = charge.Amount,
            InstallmentCount = charge.InstallmentCount,
            Status = charge.Status,
            DueDate = charge.DueDate,
            PeriodStart = charge.PeriodStart,
            PeriodEnd = charge.PeriodEnd,
            ConfirmedAt = charge.ConfirmedAt,
            RefundedAt = charge.RefundedAt,
            RefundedAmount = charge.RefundedAmount,
            InvoicePdfUrl = charge.InvoiceStatus == "AUTHORIZED" ? charge.InvoicePdfUrl : null,
            InvoiceUrl = charge.InvoiceUrl,
            BankSlipUrl = charge.BankSlipUrl
        };

        private static string Digits(string value) => new(value.Where(char.IsDigit).ToArray());

        private static string? LastFour(string? number)
        {
            if (string.IsNullOrEmpty(number))
                return null;
            var digits = Digits(number);
            return digits.Length <= 4 ? digits : digits[^4..];
        }

        private static Result<GetSubscriptionResponseDto> Fail(string code) => Result<GetSubscriptionResponseDto>.Failure(code);
    }
}

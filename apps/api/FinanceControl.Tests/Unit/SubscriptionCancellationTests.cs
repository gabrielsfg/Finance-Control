using System.Net;
using FinanceControl.Data.Data;
using FinanceControl.Domain.Entities;
using FinanceControl.Domain.Interfaces.Service;
using FinanceControl.Services.Asaas;
using FinanceControl.Services.Billing;
using FinanceControl.Services.Services;
using FinanceControl.Shared.Dtos.Request;
using FinanceControl.Shared.Enums;
using FinanceControl.Tests.Helpers;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging.Abstractions;
using Microsoft.Extensions.Options;

namespace FinanceControl.Tests.Unit
{
    /// <summary>
    /// Cancellation rules of the Terms of Use: yearly plans refunded in full inside the
    /// withdrawal window, the unused months minus 10% after it; the trial promised by the
    /// checkout is never silently replaced by a charge.
    /// </summary>
    public class SubscriptionCancellationTests
    {
        private const string ValidCpf = "52998224725";

        private sealed class NullEmailService : IEmailService
        {
            public Task<bool> SendAsync(string toEmail, string subject, string htmlBody, CancellationToken cancellationToken = default) =>
                Task.FromResult(true);
        }

        private static (ApplicationDbContext Context, FakeAsaasHandler Asaas, SubscriptionService Service) Create(FakeAsaasHandler? asaas = null)
        {
            var context = DbContextHelper.CreateInMemory();
            asaas ??= new FakeAsaasHandler();
            var billingSettings = Options.Create(new BillingSettings
            {
                CpfHashKey = "test-cpf-key",
                CardTokenKey = Convert.ToBase64String(new byte[32]),
                WebBaseUrl = "https://app.test",
                ManualRefundEmail = "financeiro@helmo.test"
            });
            var client = new AsaasClient(
                new HttpClient(asaas) { BaseAddress = new Uri("https://asaas.test/v3/") },
                Options.Create(new AsaasSettings { ApiKey = "$aact_hmlg_test", WebhookToken = new string('x', 32) }),
                NullLogger<AsaasClient>.Instance);
            var secrets = new BillingSecrets(billingSettings);
            var notifier = new BillingNotifier(context, new NullEmailService(), billingSettings, NullLogger<BillingNotifier>.Instance);
            var engine = new BillingEngine(context, client, secrets, notifier, NullLogger<BillingEngine>.Instance);
            var turnstile = new TurnstileVerifier(new HttpClient(), Options.Create(new TurnstileSettings()), NullLogger<TurnstileVerifier>.Instance);
            var service = new SubscriptionService(
                context, client, engine, secrets, notifier, turnstile, billingSettings, NullLogger<SubscriptionService>.Instance);
            return (context, asaas, service);
        }

        private static async Task AddUserAsync(ApplicationDbContext context, int id, bool trialUsed)
        {
            context.Users.Add(new User { Id = id, Email = $"user{id}@test.com", Name = $"User {id}", PasswordHash = "x" });
            if (trialUsed)
                context.BillingProfiles.Add(new BillingProfile { UserId = id, TrialConsumedAt = DateTime.UtcNow.AddYears(-1) });
            await context.SaveChangesAsync();
        }

        private static CreateSubscriptionRequestDto YearlyCard(bool expectTrial = false) => new()
        {
            Plan = EnumSubscriptionPlan.Premium,
            Cycle = EnumBillingCycle.Yearly,
            BillingMethod = EnumBillingMethod.CreditCard,
            Cpf = ValidCpf,
            MobilePhone = "11987654321",
            PostalCode = "01310100",
            AddressNumber = "100",
            ExpectTrial = expectTrial,
            Card = new SubscriptionCardRequestDto
            {
                HolderName = "User One",
                Number = "4242424242424242",
                ExpiryMonth = "12",
                ExpiryYear = (DateTime.UtcNow.Year + 2).ToString(),
                Cvv = "123"
            }
        };

        [Fact]
        public void Quote_ThreeMonthsIntoAR500Year_RefundsNineMonthsMinusTenPercent()
        {
            var start = new DateTime(2026, 1, 10, 12, 0, 0, DateTimeKind.Utc);
            var charge = new SubscriptionCharge { Amount = 50000, PeriodStart = start, PeriodEnd = start.AddYears(1) };

            var quote = BillingEngine.QuoteEarlyTermination(charge, new DateTime(2026, 4, 5, 0, 0, 0, DateTimeKind.Utc), 10);

            Assert.Equal(3, quote.MonthsUsed);
            Assert.Equal(new DateTime(2026, 4, 10, 12, 0, 0, DateTimeKind.Utc), quote.AccessUntil);
            Assert.Equal(37500, quote.RemainingValue);
            Assert.Equal(3750, quote.Fee);
            Assert.Equal(33750, quote.Refund);
        }

        [Fact]
        public void Quote_InTheLastMonth_RefundsNothing()
        {
            var start = new DateTime(2026, 1, 10, 0, 0, 0, DateTimeKind.Utc);
            var charge = new SubscriptionCharge { Amount = 50000, PeriodStart = start, PeriodEnd = start.AddYears(1) };

            var quote = BillingEngine.QuoteEarlyTermination(charge, start.AddMonths(11).AddDays(3), 10);

            Assert.Equal(12, quote.MonthsUsed);
            Assert.Equal(0, quote.Refund);
            Assert.Equal(start.AddYears(1), quote.AccessUntil);
        }

        [Fact]
        public async Task CancelYearly_AfterTheWindow_RefundsUnusedMonthsAndCutsAccessToTheMonthEnd()
        {
            var asaas = new FakeAsaasHandler().On(HttpMethod.Post, "payments/pay_1/refund", HttpStatusCode.OK, "{}");
            var (context, _, service) = Create(asaas);
            await AddUserAsync(context, 1, trialUsed: true);
            await service.CreateSubscriptionAsync(YearlyCard(), 1, null);

            var start = DateTime.UtcNow.AddMonths(-2).AddDays(-5);
            var subscription = await context.Subscriptions.SingleAsync();
            var charge = await context.SubscriptionCharges.SingleAsync();
            charge.PeriodStart = subscription.CurrentPeriodStart = start;
            charge.PeriodEnd = subscription.CurrentPeriodEnd = start.AddYears(1);
            charge.ConfirmedAt = start;
            await context.SaveChangesAsync();

            var preview = await service.GetCancellationPreviewAsync(1);
            var result = await service.CancelSubscriptionAsync(1);

            Assert.Equal(EnumCancellationKind.EarlyTermination, preview.Value!.Kind);
            Assert.Equal(33750, preview.Value.RefundAmount);
            Assert.Equal(3750, preview.Value.FeeAmount);
            Assert.True(result.IsSuccess, result.Error);
            Assert.Equal(EnumSubscriptionStatus.Canceled, result.Value!.Status);
            Assert.True(result.Value.HasAccess);
            Assert.False(result.Value.CanResume);
            Assert.Equal(start.AddMonths(3), result.Value.CurrentPeriodEnd);
            Assert.Contains(asaas.Calls, c => c.Path == "payments/pay_1/refund" && c.Body!.Contains("\"value\":337.5"));
            Assert.Equal(EnumChargeStatus.PartiallyRefunded, (await context.SubscriptionCharges.SingleAsync()).Status);
            Assert.Equal(BillingErrors.NotResumable, (await service.ResumeSubscriptionAsync(1)).Error);
        }

        [Fact]
        public async Task CancelYearly_InsideTheWindow_RefundsEverythingAndEndsNow()
        {
            var asaas = new FakeAsaasHandler().On(HttpMethod.Post, "payments/pay_1/refund", HttpStatusCode.OK, "{}");
            var (context, _, service) = Create(asaas);
            await AddUserAsync(context, 1, trialUsed: true);
            await service.CreateSubscriptionAsync(YearlyCard(), 1, null);

            var result = await service.CancelSubscriptionAsync(1);

            Assert.True(result.IsSuccess, result.Error);
            Assert.Equal(EnumSubscriptionStatus.Expired, result.Value!.Status);
            Assert.Equal(EnumSubscriptionEndReason.Refunded, result.Value.EndReason);
            var call = asaas.Calls.Single(c => c.Path == "payments/pay_1/refund");
            Assert.DoesNotContain("\"value\"", call.Body);
        }

        [Fact]
        public async Task CancelYearly_InsideTheWindow_WhenAsaasRefusesTheRefund_OwesItByHand()
        {
            var asaas = new FakeAsaasHandler().On(HttpMethod.Post, "payments/pay_1/refund", HttpStatusCode.BadRequest,
                """{"errors":[{"code":"invalid_action","description":"Saldo insuficiente."}]}""");
            var (context, _, service) = Create(asaas);
            await AddUserAsync(context, 1, trialUsed: true);
            await service.CreateSubscriptionAsync(YearlyCard(), 1, null);

            var result = await service.CancelSubscriptionAsync(1);

            Assert.True(result.IsSuccess, result.Error);
            Assert.Equal(EnumSubscriptionEndReason.Refunded, result.Value!.EndReason);
            Assert.True(result.Value.Charges.Single().ManualRefundPending);
            var refund = await context.ManualRefunds.SingleAsync();
            Assert.Equal(1, refund.UserId);
            Assert.Equal("user1@test.com", refund.UserEmail);
            Assert.Equal(50000, refund.Amount);
            Assert.Contains("Saldo insuficiente", refund.Reason);
            Assert.NotNull(refund.NotifiedAt);
        }

        [Fact]
        public async Task Signup_ExpectingATrialForACpfThatHadOne_IsRefusedWithoutCharging()
        {
            var (context, asaas, service) = Create();
            await AddUserAsync(context, 1, trialUsed: false);
            await AddUserAsync(context, 2, trialUsed: false);
            await service.CreateSubscriptionAsync(YearlyCard(expectTrial: true), 1, null);

            var result = await service.CreateSubscriptionAsync(YearlyCard(expectTrial: true), 2, null);

            Assert.Equal(BillingErrors.TrialNotEligible, result.Error);
            Assert.Equal(0, asaas.CountOf(HttpMethod.Post, "payments"));
            Assert.Single(await context.TrialUsages.ToListAsync());
        }
    }
}

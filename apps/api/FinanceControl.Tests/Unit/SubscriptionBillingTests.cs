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
    public class SubscriptionBillingTests
    {
        private const string ValidCpf = "52998224725";
        private const string OtherValidCpf = "11144477735";

        private sealed class FakeEmailService : IEmailService
        {
            public List<(string To, string Subject)> Sent { get; } = [];

            public Task<bool> SendAsync(string toEmail, string subject, string htmlBody, CancellationToken cancellationToken = default)
            {
                Sent.Add((toEmail, subject));
                return Task.FromResult(true);
            }
        }

        private sealed class Harness
        {
            public required ApplicationDbContext Context { get; init; }
            public required FakeAsaasHandler Asaas { get; init; }
            public required FakeEmailService Email { get; init; }
            public required SubscriptionService Service { get; init; }
            public required BillingEngine Engine { get; init; }
        }

        private static Harness Create(ApplicationDbContext? context = null, FakeAsaasHandler? asaas = null)
        {
            context ??= DbContextHelper.CreateInMemory();
            asaas ??= new FakeAsaasHandler();
            var email = new FakeEmailService();

            var billingSettings = Options.Create(new BillingSettings
            {
                CpfHashKey = "test-cpf-key",
                CardTokenKey = Convert.ToBase64String(new byte[32]),
                WebBaseUrl = "https://app.test"
            });
            var asaasSettings = Options.Create(new AsaasSettings { ApiKey = "$aact_hmlg_test", WebhookToken = new string('x', 32) });

            var client = new AsaasClient(
                new HttpClient(asaas) { BaseAddress = new Uri("https://asaas.test/v3/") },
                asaasSettings,
                NullLogger<AsaasClient>.Instance);
            var secrets = new BillingSecrets(billingSettings);
            var notifier = new BillingNotifier(context, email, billingSettings, NullLogger<BillingNotifier>.Instance);
            var engine = new BillingEngine(context, client, secrets, notifier, NullLogger<BillingEngine>.Instance);
            var turnstile = new TurnstileVerifier(new HttpClient(), Options.Create(new TurnstileSettings()), NullLogger<TurnstileVerifier>.Instance);
            var service = new SubscriptionService(
                context, client, engine, secrets, notifier, turnstile, billingSettings, NullLogger<SubscriptionService>.Instance);

            return new Harness { Context = context, Asaas = asaas, Email = email, Service = service, Engine = engine };
        }

        private static async Task<User> AddUserAsync(ApplicationDbContext context, int id = 1)
        {
            var user = new User { Id = id, Email = $"user{id}@test.com", Name = $"User {id}", PasswordHash = "x" };
            context.Users.Add(user);
            await context.SaveChangesAsync();
            return user;
        }

        private static CreateSubscriptionRequestDto CardRequest(
            EnumSubscriptionPlan plan = EnumSubscriptionPlan.Basic,
            EnumBillingCycle cycle = EnumBillingCycle.Monthly,
            string cpf = ValidCpf) => new()
        {
            Plan = plan,
            Cycle = cycle,
            BillingMethod = EnumBillingMethod.CreditCard,
            Cpf = cpf,
            MobilePhone = "11987654321",
            PostalCode = "01310100",
            AddressNumber = "100",
            Card = new SubscriptionCardRequestDto
            {
                HolderName = "User One",
                Number = "4242424242424242",
                ExpiryMonth = "12",
                ExpiryYear = (DateTime.UtcNow.Year + 2).ToString(),
                Cvv = "123"
            }
        };

        // ---- catalog and secrets -------------------------------------------------------

        [Theory]
        [InlineData(EnumSubscriptionPlan.Basic, EnumBillingCycle.Monthly, 3499)]
        [InlineData(EnumSubscriptionPlan.Basic, EnumBillingCycle.Yearly, 35000)]
        [InlineData(EnumSubscriptionPlan.Premium, EnumBillingCycle.Monthly, 4999)]
        [InlineData(EnumSubscriptionPlan.Premium, EnumBillingCycle.Yearly, 50000)]
        public void Catalog_HasTheAgreedPrices(EnumSubscriptionPlan plan, EnumBillingCycle cycle, int cents) =>
            Assert.Equal(cents, BillingCatalog.GetPrice(plan, cycle));

        [Fact]
        public void Secrets_RoundTripTheCardTokenAndHashCpfDeterministically()
        {
            var secrets = new BillingSecrets(Options.Create(new BillingSettings
            {
                CpfHashKey = "k",
                CardTokenKey = Convert.ToBase64String(Enumerable.Range(0, 32).Select(i => (byte)i).ToArray())
            }));

            var cipher = secrets.ProtectCardToken("tok_abc");
            Assert.DoesNotContain("tok_abc", cipher);
            Assert.Equal("tok_abc", secrets.UnprotectCardToken(cipher));
            Assert.Equal(secrets.HashCpf(ValidCpf), secrets.HashCpf(ValidCpf));
            Assert.NotEqual(secrets.HashCpf(ValidCpf), secrets.HashCpf(OtherValidCpf));
        }

        [Fact]
        public void Secrets_RefuseToHashWithoutAKey()
        {
            var secrets = new BillingSecrets(Options.Create(new BillingSettings()));
            Assert.Throws<InvalidOperationException>(() => secrets.HashCpf(ValidCpf));
        }

        // ---- signup ----------------------------------------------------------------------

        [Fact]
        public async Task CardSignup_StartsATrialWithoutCharging()
        {
            var h = Create();
            await AddUserAsync(h.Context);

            var result = await h.Service.CreateSubscriptionAsync(CardRequest(), 1, "203.0.113.10");

            Assert.True(result.IsSuccess, result.Error);
            Assert.Equal(EnumSubscriptionStatus.Trialing, result.Value!.Status);
            Assert.True(result.Value.HasAccess);
            Assert.Equal("4242", result.Value.CardLast4);
            Assert.Equal(0, h.Asaas.CountOf(HttpMethod.Post, "payments"));

            var profile = await h.Context.BillingProfiles.SingleAsync();
            Assert.NotNull(profile.TrialConsumedAt);
            Assert.DoesNotContain(ValidCpf, profile.CpfHash);
            Assert.DoesNotContain("tok_123", profile.CardTokenCipher);

            // The customer is created with Asaas' own notifications off.
            var customerCall = h.Asaas.Calls.Single(c => c.Path == "customers");
            Assert.Contains("\"notificationDisabled\":true", customerCall.Body);
        }

        [Fact]
        public async Task CardSignup_WithACpfThatHadATrial_IsChargedNow()
        {
            var h = Create();
            await AddUserAsync(h.Context, 1);
            await AddUserAsync(h.Context, 2);
            await h.Service.CreateSubscriptionAsync(CardRequest(), 1, null);

            var result = await h.Service.CreateSubscriptionAsync(CardRequest(), 2, null);

            Assert.True(result.IsSuccess, result.Error);
            Assert.Equal(EnumSubscriptionStatus.Active, result.Value!.Status);
            Assert.Equal(1, h.Asaas.CountOf(HttpMethod.Post, "payments"));
            var charge = await h.Context.SubscriptionCharges.SingleAsync();
            Assert.Equal(EnumChargeStatus.Confirmed, charge.Status);
            Assert.Equal(3499, charge.Amount);
        }

        [Fact]
        public async Task CardSignup_Declined_LeavesNoSubscriptionAndCountsTheFailure()
        {
            var asaas = new FakeAsaasHandler().On(HttpMethod.Post, "creditCard/tokenizeCreditCard",
                HttpStatusCode.BadRequest, """{"errors":[{"code":"invalid_creditCard","description":"Transação não autorizada."}]}""");
            var h = Create(asaas: asaas);
            await AddUserAsync(h.Context);

            var result = await h.Service.CreateSubscriptionAsync(CardRequest(), 1, null);

            Assert.Equal(BillingErrors.CardDeclined, result.Error);
            Assert.Empty(h.Context.Subscriptions);
            Assert.Equal(1, (await h.Context.BillingProfiles.SingleAsync()).CardFailureCount);
        }

        [Fact]
        public async Task CardSignup_AfterTooManyDeclines_IsRefusedBeforeReachingAsaas()
        {
            var h = Create();
            await AddUserAsync(h.Context);
            h.Context.BillingProfiles.Add(new BillingProfile
            {
                UserId = 1,
                CardFailureCount = 5,
                CardFailureWindowStart = DateTime.UtcNow.AddHours(-1)
            });
            await h.Context.SaveChangesAsync();

            var result = await h.Service.CreateSubscriptionAsync(CardRequest(), 1, null);

            Assert.Equal(BillingErrors.CardAttemptsExceeded, result.Error);
            Assert.Empty(h.Asaas.Calls);
        }

        [Fact]
        public async Task Signup_WhenAlreadySubscribed_IsRejected()
        {
            var h = Create();
            await AddUserAsync(h.Context);
            await h.Service.CreateSubscriptionAsync(CardRequest(), 1, null);

            var again = await h.Service.CreateSubscriptionAsync(CardRequest(), 1, null);

            Assert.Equal(BillingErrors.AlreadySubscribed, again.Error);
        }

        [Fact]
        public async Task PixSignup_WaitsForPaymentWithoutAccess()
        {
            var asaas = new FakeAsaasHandler().On(HttpMethod.Post, "payments", HttpStatusCode.OK,
                """{"id":"pay_pix","status":"PENDING","value":34.99,"invoiceUrl":"https://asaas.test/i/pay_pix"}""");
            var h = Create(asaas: asaas);
            await AddUserAsync(h.Context);
            var request = CardRequest();
            request.BillingMethod = EnumBillingMethod.Pix;
            request.Card = null;

            var result = await h.Service.CreateSubscriptionAsync(request, 1, null);

            Assert.True(result.IsSuccess, result.Error);
            Assert.Equal(EnumSubscriptionStatus.PendingPayment, result.Value!.Status);
            Assert.False(result.Value.HasAccess);
            Assert.NotNull(result.Value.PendingCharge);
            Assert.Equal(0, h.Asaas.CountOf(HttpMethod.Post, "creditCard/tokenizeCreditCard"));
        }

        [Fact]
        public async Task YearlyCardSignupInInstallments_SendsAnInstallmentPlan()
        {
            var h = Create();
            await AddUserAsync(h.Context);
            h.Context.BillingProfiles.Add(new BillingProfile { UserId = 1, TrialConsumedAt = DateTime.UtcNow.AddYears(-1) });
            await h.Context.SaveChangesAsync();
            var request = CardRequest(EnumSubscriptionPlan.Premium, EnumBillingCycle.Yearly);
            request.InstallmentCount = 12;

            var result = await h.Service.CreateSubscriptionAsync(request, 1, null);

            Assert.True(result.IsSuccess, result.Error);
            var body = h.Asaas.Calls.Single(c => c.Method == HttpMethod.Post && c.Path == "payments").Body!;
            Assert.Contains("\"installmentCount\":12", body);
            Assert.Contains("\"totalValue\":500", body);
            Assert.Equal(12, result.Value!.InstallmentCount);
        }

        // ---- cancel / resume / refund ------------------------------------------------------

        [Fact]
        public async Task CancelDuringTrial_KeepsAccessUntilTheTrialEndsAndCanResume()
        {
            var h = Create();
            await AddUserAsync(h.Context);
            await h.Service.CreateSubscriptionAsync(CardRequest(), 1, null);

            var canceled = await h.Service.CancelSubscriptionAsync(1);

            Assert.Equal(EnumSubscriptionStatus.Canceled, canceled.Value!.Status);
            Assert.True(canceled.Value.HasAccess);
            Assert.True(canceled.Value.CanResume);

            var resumed = await h.Service.ResumeSubscriptionAsync(1);
            Assert.Equal(EnumSubscriptionStatus.Trialing, resumed.Value!.Status);
        }

        [Fact]
        public async Task Refund_OfTheFirstPaymentWithinTheWindow_EndsTheSubscription()
        {
            var asaas = new FakeAsaasHandler().On(HttpMethod.Post, "payments/pay_1/refund", HttpStatusCode.OK, "{}");
            var h = Create(asaas: asaas);
            await AddUserAsync(h.Context);
            h.Context.BillingProfiles.Add(new BillingProfile { UserId = 1, TrialConsumedAt = DateTime.UtcNow.AddYears(-1) });
            await h.Context.SaveChangesAsync();
            var created = await h.Service.CreateSubscriptionAsync(CardRequest(), 1, null);
            Assert.True(created.Value!.CanRequestRefund);

            var refunded = await h.Service.RequestRefundAsync(1);

            Assert.True(refunded.IsSuccess, refunded.Error);
            Assert.Equal(EnumSubscriptionStatus.Expired, refunded.Value!.Status);
            Assert.Equal(EnumSubscriptionEndReason.Refunded, refunded.Value.EndReason);
            Assert.False(refunded.Value.HasAccess);
        }

        [Fact]
        public async Task Refund_AfterTheWindow_IsRefused()
        {
            var h = Create();
            await AddUserAsync(h.Context);
            h.Context.BillingProfiles.Add(new BillingProfile { UserId = 1, TrialConsumedAt = DateTime.UtcNow.AddYears(-1) });
            await h.Context.SaveChangesAsync();
            await h.Service.CreateSubscriptionAsync(CardRequest(), 1, null);
            var charge = await h.Context.SubscriptionCharges.SingleAsync();
            charge.ConfirmedAt = DateTime.UtcNow.AddDays(-8);
            await h.Context.SaveChangesAsync();

            var result = await h.Service.RequestRefundAsync(1);

            Assert.Equal(BillingErrors.NotRefundable, result.Error);
        }

        // ---- plan changes ----------------------------------------------------------------

        [Fact]
        public async Task ChangePlan_PreviewChangesNothing_ConfirmInTrialAppliesNow()
        {
            var h = Create();
            await AddUserAsync(h.Context);
            await h.Service.CreateSubscriptionAsync(CardRequest(), 1, null);
            var change = new ChangeSubscriptionPlanRequestDto { Plan = EnumSubscriptionPlan.Premium, Cycle = EnumBillingCycle.Monthly };

            var preview = await h.Service.ChangePlanAsync(change, 1);
            Assert.False(preview.Value!.Applied);
            Assert.Equal(4999, preview.Value.Price);
            Assert.Equal(EnumSubscriptionPlan.Basic, (await h.Context.Subscriptions.SingleAsync()).Plan);

            change.Confirm = true;
            var applied = await h.Service.ChangePlanAsync(change, 1);

            Assert.True(applied.Value!.Applied);
            var subscription = await h.Context.Subscriptions.SingleAsync();
            Assert.Equal(EnumSubscriptionPlan.Premium, subscription.Plan);
            Assert.Equal(4999, subscription.Price);
        }

        [Fact]
        public async Task ChangePlan_UpgradeWhileActive_UnlocksNowAndPricesAtRenewal()
        {
            var h = Create();
            await AddUserAsync(h.Context);
            h.Context.BillingProfiles.Add(new BillingProfile { UserId = 1, TrialConsumedAt = DateTime.UtcNow.AddYears(-1) });
            await h.Context.SaveChangesAsync();
            await h.Service.CreateSubscriptionAsync(CardRequest(), 1, null);

            await h.Service.ChangePlanAsync(new ChangeSubscriptionPlanRequestDto
            {
                Plan = EnumSubscriptionPlan.Premium,
                Cycle = EnumBillingCycle.Monthly,
                Confirm = true
            }, 1);

            var subscription = await h.Context.Subscriptions.SingleAsync();
            Assert.Equal(EnumSubscriptionPlan.Premium, subscription.Plan);
            Assert.Equal(3499, subscription.Price);

            var renewal = BillingEngine.BuildCharge(subscription, subscription.CurrentPeriodEnd, DateOnly.FromDateTime(DateTime.UtcNow), applyPendingChange: true);
            Assert.Equal(4999, renewal.Amount);
            Assert.Equal(EnumSubscriptionPlan.Premium, renewal.Plan);
        }

        // ---- engine and webhooks ----------------------------------------------------------

        [Fact]
        public void BuildCharge_PlainRenewalKeepsThePrice()
        {
            var subscription = new Subscription
            {
                Id = 7, UserId = 1, Plan = EnumSubscriptionPlan.Basic, Cycle = EnumBillingCycle.Monthly,
                BillingMethod = EnumBillingMethod.CreditCard, Price = 2990, CurrentPeriodEnd = new DateTime(2026, 11, 7, 0, 0, 0, DateTimeKind.Utc)
            };

            var charge = BillingEngine.BuildCharge(subscription, subscription.CurrentPeriodEnd, new DateOnly(2026, 11, 7), applyPendingChange: true);

            Assert.Equal(2990, charge.Amount);
            Assert.Equal(new DateTime(2026, 12, 7, 0, 0, 0, DateTimeKind.Utc), charge.PeriodEnd);
            Assert.Equal("sub-7-20261107000000-1", charge.IdempotencyKey);
        }

        [Fact]
        public async Task ConfirmCharge_IsIdempotentAndMovesTrialToActive()
        {
            var h = Create();
            await AddUserAsync(h.Context);
            await h.Service.CreateSubscriptionAsync(CardRequest(), 1, null);
            var subscription = await h.Context.Subscriptions.SingleAsync();
            var charge = BillingEngine.BuildCharge(subscription, subscription.CurrentPeriodEnd, DateOnly.FromDateTime(DateTime.UtcNow), true);
            h.Context.SubscriptionCharges.Add(charge);
            await h.Context.SaveChangesAsync();

            Assert.True(await h.Engine.ConfirmChargeAsync(subscription, charge, DateTime.UtcNow, CancellationToken.None));
            var periodEnd = subscription.CurrentPeriodEnd;
            Assert.False(await h.Engine.ConfirmChargeAsync(subscription, charge, DateTime.UtcNow, CancellationToken.None));

            Assert.Equal(EnumSubscriptionStatus.Active, subscription.Status);
            Assert.Equal(charge.PeriodEnd, periodEnd);
            Assert.Equal(periodEnd, subscription.CurrentPeriodEnd);
        }

        [Fact]
        public async Task Webhook_ReceivedForAPendingPix_ActivatesFromNow()
        {
            var asaas = new FakeAsaasHandler().On(HttpMethod.Post, "payments", HttpStatusCode.OK,
                """{"id":"pay_pix","status":"PENDING","value":34.99}""");
            var h = Create(asaas: asaas);
            await AddUserAsync(h.Context);
            var request = CardRequest();
            request.BillingMethod = EnumBillingMethod.Pix;
            request.Card = null;
            await h.Service.CreateSubscriptionAsync(request, 1, null);

            var payload = new AsaasWebhookPayload
            {
                Id = "evt_1",
                Event = "PAYMENT_RECEIVED",
                Payment = new AsaasPaymentResponse { Id = "pay_pix", Status = "RECEIVED" }
            };
            var now = DateTime.UtcNow;
            await h.Engine.ApplyWebhookAsync(payload, now, CancellationToken.None);
            await h.Engine.ApplyWebhookAsync(payload, now.AddMinutes(1), CancellationToken.None);

            var subscription = await h.Context.Subscriptions.SingleAsync();
            Assert.Equal(EnumSubscriptionStatus.Active, subscription.Status);
            Assert.Equal(now, subscription.CurrentPeriodStart);
            Assert.Equal(now.AddMonths(1), subscription.CurrentPeriodEnd);
            Assert.Single(h.Email.Sent, e => e.Subject == "Pagamento confirmado");
        }

        [Fact]
        public async Task Webhook_RefundOfTheCurrentPeriod_EndsAccess()
        {
            var h = Create();
            await AddUserAsync(h.Context);
            h.Context.BillingProfiles.Add(new BillingProfile { UserId = 1, TrialConsumedAt = DateTime.UtcNow.AddYears(-1) });
            await h.Context.SaveChangesAsync();
            await h.Service.CreateSubscriptionAsync(CardRequest(), 1, null);

            await h.Engine.ApplyWebhookAsync(new AsaasWebhookPayload
            {
                Id = "evt_r",
                Event = "PAYMENT_REFUNDED",
                Payment = new AsaasPaymentResponse { Id = "pay_1", Status = "REFUNDED" }
            }, DateTime.UtcNow, CancellationToken.None);

            var subscription = await h.Context.Subscriptions.SingleAsync();
            Assert.Equal(EnumSubscriptionStatus.Expired, subscription.Status);
            Assert.Equal(EnumSubscriptionEndReason.Refunded, subscription.EndReason);
        }

        [Fact]
        public async Task Webhook_ForAnUnknownPayment_IsIgnored()
        {
            var h = Create();
            await h.Engine.ApplyWebhookAsync(new AsaasWebhookPayload
            {
                Id = "evt_x",
                Event = "PAYMENT_CONFIRMED",
                Payment = new AsaasPaymentResponse { Id = "pay_unknown" }
            }, DateTime.UtcNow, CancellationToken.None);

            Assert.Empty(h.Context.SubscriptionCharges);
        }

        // ---- access ------------------------------------------------------------------------

        [Theory]
        [InlineData(EnumSubscriptionStatus.Trialing, 10, true)]
        [InlineData(EnumSubscriptionStatus.Active, -1, true)]
        [InlineData(EnumSubscriptionStatus.Canceled, 1, true)]
        [InlineData(EnumSubscriptionStatus.Canceled, -1, false)]
        [InlineData(EnumSubscriptionStatus.PendingPayment, 10, false)]
        [InlineData(EnumSubscriptionStatus.Expired, 10, false)]
        public void HasAccess_FollowsTheStatus(EnumSubscriptionStatus status, int daysToPeriodEnd, bool expected)
        {
            var now = DateTime.UtcNow;
            var subscription = new Subscription { Status = status, CurrentPeriodEnd = now.AddDays(daysToPeriodEnd) };
            Assert.Equal(expected, SubscriptionRules.HasAccess(subscription, now));
        }
    }
}

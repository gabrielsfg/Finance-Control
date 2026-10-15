using System.Net;
using FinanceControl.Data.Data;
using FinanceControl.Domain.Entities;
using FinanceControl.Domain.Interfaces.Services;
using FinanceControl.Services.Billing;
using FinanceControl.Services.Pluggy;
using FinanceControl.Services.Services;
using FinanceControl.Shared.Enums;
using FinanceControl.Tests.Helpers;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Logging.Abstractions;
using Microsoft.Extensions.Options;
using Moq;

namespace FinanceControl.Tests.Unit
{
    public class OpenFinanceEntitlementTests
    {
        private const int UserId = 1;

        private sealed class Harness
        {
            public required ApplicationDbContext Context { get; init; }
            public required FakePluggyHandler Pluggy { get; init; }
            public required Mock<INotificationService> Notifications { get; init; }
            public required OpenFinanceEntitlementJobService Job { get; init; }
        }

        private static async Task<Harness> CreateAsync(int connections, EnumSubscriptionPlan? plan)
        {
            var dbName = Guid.NewGuid().ToString();
            var context = DbContextHelper.CreateInMemory(dbName);
            var pluggy = new FakePluggyHandler();
            var notifications = new Mock<INotificationService>();

            var settings = new OpenFinanceSettings { Enabled = true, BasicMaxConnections = 3, PremiumMaxConnections = null };

            var services = new ServiceCollection();
            services.AddSingleton<ILoggerFactory>(NullLoggerFactory.Instance);
            services.AddSingleton(typeof(ILogger<>), typeof(NullLogger<>));
            services.AddScoped(_ => DbContextHelper.CreateInMemory(dbName));
            services.AddSingleton(Options.Create(new BillingSettings { EnforceAccess = true }));
            services.AddSingleton(Options.Create(new PluggySettings { ClientId = "id", ClientSecret = "secret" }));
            services.AddSingleton(new PluggyApiKeyCache());
            services.AddScoped(provider => new PluggyClient(
                new HttpClient(pluggy) { BaseAddress = new Uri("https://api.pluggy.test/") },
                provider.GetRequiredService<IOptions<PluggySettings>>(),
                provider.GetRequiredService<PluggyApiKeyCache>(),
                NullLogger<PluggyClient>.Instance));
            services.AddScoped(_ => notifications.Object);
            var provider = services.BuildServiceProvider();

            var job = new OpenFinanceEntitlementJobService(
                provider.GetRequiredService<IServiceScopeFactory>(),
                Options.Create(settings),
                NullLogger<OpenFinanceEntitlementJobService>.Instance);

            context.Users.Add(new User { Id = UserId, Email = "u@test.com", Name = "U", PasswordHash = "x" });
            if (plan is { } p)
            {
                context.Subscriptions.Add(new Subscription
                {
                    UserId = UserId,
                    Plan = p,
                    Status = EnumSubscriptionStatus.Active,
                    CurrentPeriodStart = DateTime.UtcNow.AddDays(-5),
                    CurrentPeriodEnd = DateTime.UtcNow.AddDays(25)
                });
            }

            for (var i = 1; i <= connections; i++)
            {
                context.BankConnections.Add(new BankConnection
                {
                    UserId = UserId,
                    ItemId = $"item-{i}",
                    ConnectorName = $"Banco {i}",
                    Status = EnumBankConnectionStatus.Active
                });
                // Distinct creation order: the oldest connections are the ones kept.
                await context.SaveChangesAsync();
                await Task.Delay(2);
            }

            for (var i = 1; i <= connections; i++)
                pluggy.On(HttpMethod.Delete, $"items/item-{i}", HttpStatusCode.NoContent, new { });

            return new Harness { Context = context, Pluggy = pluggy, Notifications = notifications, Job = job };
        }

        private static Task<List<string>> RemainingAsync(Harness h) =>
            h.Context.BankConnections.AsNoTracking().OrderBy(c => c.ItemId).Select(c => c.ItemId).ToListAsync();

        [Fact]
        public async Task Basic_KeepsTheThreeConnectedFirst_AndRevokesTheRestAtPluggy()
        {
            var h = await CreateAsync(connections: 5, EnumSubscriptionPlan.Basic);

            await h.Job.RunAsync(CancellationToken.None);

            Assert.Equal(["item-1", "item-2", "item-3"], await RemainingAsync(h));
            Assert.Equal(1, h.Pluggy.CountOf(HttpMethod.Delete, "items/item-4"));
            Assert.Equal(1, h.Pluggy.CountOf(HttpMethod.Delete, "items/item-5"));
            Assert.Equal(0, h.Pluggy.CountOf(HttpMethod.Delete, "items/item-1"));
            h.Notifications.Verify(n => n.CreateAsync(UserId, EnumNotificationType.System, It.IsAny<string>(),
                It.IsAny<string>(), It.IsAny<string?>(), It.IsAny<string?>()), Times.Once);
        }

        [Fact]
        public async Task Premium_KeepsEveryConnection()
        {
            var h = await CreateAsync(connections: 6, EnumSubscriptionPlan.Premium);

            await h.Job.RunAsync(CancellationToken.None);

            Assert.Equal(6, (await RemainingAsync(h)).Count);
            Assert.DoesNotContain(h.Pluggy.Calls, c => c.Method == HttpMethod.Delete);
        }

        [Fact]
        public async Task NoSubscription_RevokesEveryConnection()
        {
            var h = await CreateAsync(connections: 2, plan: null);

            await h.Job.RunAsync(CancellationToken.None);

            Assert.Empty(await RemainingAsync(h));
            Assert.Equal(2, h.Pluggy.Calls.Count(c => c.Method == HttpMethod.Delete));
        }

        [Fact]
        public async Task PluggyFailure_KeepsTheConnection_ForTheNextRun()
        {
            var h = await CreateAsync(connections: 4, EnumSubscriptionPlan.Basic);
            h.Pluggy.On(HttpMethod.Delete, "items/item-4", HttpStatusCode.ServiceUnavailable, new { code = 503 });

            await h.Job.RunAsync(CancellationToken.None);

            Assert.Equal(4, (await RemainingAsync(h)).Count);
            h.Notifications.Verify(n => n.CreateAsync(It.IsAny<int>(), It.IsAny<EnumNotificationType>(), It.IsAny<string>(),
                It.IsAny<string>(), It.IsAny<string?>(), It.IsAny<string?>()), Times.Never);
        }
    }
}

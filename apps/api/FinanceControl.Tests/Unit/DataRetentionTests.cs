using FinanceControl.Data.Data;
using FinanceControl.Domain.Entities;
using FinanceControl.Services.Ai;
using FinanceControl.Services.Services;
using FinanceControl.Shared.Enums;
using FinanceControl.Tests.Helpers;

namespace FinanceControl.Tests.Unit
{
    public class DataRetentionTests
    {
        private static readonly DateTime Now = new(2031, 6, 1, 12, 0, 0, DateTimeKind.Utc);

        private static async Task AddUserAsync(ApplicationDbContext context, int id, DateTime createdAt)
        {
            context.Users.Add(new User { Id = id, Email = $"u{id}@test.com", Name = $"U{id}", PasswordHash = "x" });
            await context.SaveChangesAsync();
            // SaveChanges stamps CreatedAt on insert; set the real one afterwards.
            context.Users.Find(id)!.CreatedAt = createdAt;
            await context.SaveChangesAsync();
        }

        private static void AddSubscription(ApplicationDbContext context, int userId, EnumSubscriptionStatus status, DateTime periodEnd, DateTime? endedAt = null) =>
            context.Subscriptions.Add(new Subscription
            {
                UserId = userId,
                Plan = EnumSubscriptionPlan.Basic,
                Status = status,
                CurrentPeriodStart = periodEnd.AddMonths(-1),
                CurrentPeriodEnd = periodEnd,
                EndedAt = endedAt
            });

        [Fact]
        public async Task SelectsOnlyAccountsWithoutASubscriptionForFiveYears()
        {
            var context = DbContextHelper.CreateInMemory();
            var old = Now.AddYears(-7);

            await AddUserAsync(context, 1, old);                    // never subscribed, signed up 7 years ago → goes
            await AddUserAsync(context, 2, old);                    // subscription ended 6 years ago → goes
            AddSubscription(context, 2, EnumSubscriptionStatus.Expired, Now.AddYears(-6), Now.AddYears(-6));
            await AddUserAsync(context, 3, old);                    // ended 2 years ago → stays
            AddSubscription(context, 3, EnumSubscriptionStatus.Expired, Now.AddYears(-2), Now.AddYears(-2));
            await AddUserAsync(context, 4, old);                    // still subscribed → stays
            AddSubscription(context, 4, EnumSubscriptionStatus.Active, Now.AddDays(10));
            await AddUserAsync(context, 5, Now.AddYears(-1));       // recent signup → stays
            await AddUserAsync(context, 6, old);                    // admin → stays
            await context.SaveChangesAsync();

            var expired = await DataRetentionJobService.FindExpiredAccountsAsync(
                context, Now, years: 5, new AdminSettings { AllowedUserIds = [6] });

            Assert.Equal([1, 2], expired);
        }
    }
}

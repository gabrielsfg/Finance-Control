using FinanceControl.Data.Data;
using FinanceControl.Domain.Entities;
using FinanceControl.Shared.Dtos.Response;
using FinanceControl.Shared.Enums;
using Microsoft.EntityFrameworkCore;

namespace FinanceControl.Services.Billing
{
    /// <summary>The single definition of who has access, shared by every caller.</summary>
    public static class SubscriptionRules
    {
        /// Statuses that occupy the user's one live slot (see the filtered unique index).
        public static bool IsLive(EnumSubscriptionStatus status) => status != EnumSubscriptionStatus.Expired;

        /// Trialing and Active grant access outright — the billing job is what moves them
        /// on when a period ends, so access never hinges on a clock comparison here.
        /// Canceled keeps access until the end of what was paid for.
        public static bool HasAccess(Subscription subscription, DateTime now) => subscription.Status switch
        {
            EnumSubscriptionStatus.Trialing => true,
            EnumSubscriptionStatus.Active => true,
            EnumSubscriptionStatus.Canceled => now < subscription.CurrentPeriodEnd,
            _ => false
        };

        public static async Task<SubscriptionAccessResponseDto> GetAccessAsync(
            ApplicationDbContext context, int userId, DateTime now, CancellationToken cancellationToken = default)
        {
            var subscription = await context.Subscriptions
                .AsNoTracking()
                .Where(s => s.UserId == userId && s.Status != EnumSubscriptionStatus.Expired)
                .FirstOrDefaultAsync(cancellationToken);

            if (subscription is null || !HasAccess(subscription, now))
                return new SubscriptionAccessResponseDto { HasAccess = false };

            return new SubscriptionAccessResponseDto { HasAccess = true, Plan = subscription.Plan };
        }
    }
}

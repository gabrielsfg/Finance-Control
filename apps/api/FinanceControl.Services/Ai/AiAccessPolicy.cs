using FinanceControl.Data.Data;
using FinanceControl.Services.Billing;
using FinanceControl.Shared.Enums;
using Microsoft.EntityFrameworkCore;

namespace FinanceControl.Services.Ai
{
    /// <summary>
    /// The entitlement check every in-app AI feature runs before it touches user data.
    /// </summary>
    /// <remarks>
    /// Callers must run this before building any payload: an account without Premium, or one that
    /// switched the AI off, never has its data serialized for a model, let alone sent.
    /// Quotas are feature-specific and stay with each caller.
    /// </remarks>
    public class AiAccessPolicy
    {
        private readonly ApplicationDbContext _context;
        private readonly ClaudeClient _client;

        public AiAccessPolicy(ApplicationDbContext context, ClaudeClient client)
        {
            _context = context;
            _client = client;
        }

        public async Task<EnumAiAvailability> CheckAsync(int userId)
        {
            var aiEnabled = await _context.Users
                .AsNoTracking()
                .Where(u => u.Id == userId)
                .Select(u => (bool?)u.AiEnabled)
                .FirstOrDefaultAsync();

            // Premium means an active subscription on the Premium plan — see SubscriptionRules.
            var access = await SubscriptionRules.GetAccessAsync(_context, userId, DateTime.UtcNow);
            if (aiEnabled is null || !access.IsPremium)
                return EnumAiAvailability.NotPremium;

            if (!aiEnabled.Value)
                return EnumAiAvailability.AiDisabled;

            if (!_client.IsConfigured)
                return EnumAiAvailability.Unavailable;

            return EnumAiAvailability.Available;
        }

        /// <summary>Calls of a feature this calendar month (UTC) that count against its quota.</summary>
        public Task<int> CountMonthlyUsageAsync(int userId, EnumAiFeature feature)
        {
            var monthStart = MonthStartUtc();

            return _context.AiGenerationLogs
                .AsNoTracking()
                .Where(l => l.UserId == userId && l.Feature == feature && l.CreatedAt >= monthStart)
                .Where(l => l.Outcome == EnumAiOutcome.Delivered || l.Outcome == EnumAiOutcome.GuardRejected)
                .CountAsync();
        }

        public static DateTime MonthStartUtc() =>
            new(DateTime.UtcNow.Year, DateTime.UtcNow.Month, 1, 0, 0, 0, DateTimeKind.Utc);
    }
}

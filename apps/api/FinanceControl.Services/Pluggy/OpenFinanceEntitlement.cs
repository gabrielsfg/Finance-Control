using FinanceControl.Data.Data;
using FinanceControl.Services.Billing;
using FinanceControl.Shared.Enums;

namespace FinanceControl.Services.Pluggy
{
    /// <summary>
    /// How many banks a user may keep connected, from the live subscription — the single
    /// rule shared by the connect endpoint and the job that revokes what is over it.
    /// </summary>
    /// <remarks>
    /// No subscription: none. Basic: <see cref="OpenFinanceSettings.BasicMaxConnections"/>.
    /// Premium: <see cref="OpenFinanceSettings.PremiumMaxConnections"/> (null = no limit).
    /// With the paywall switched off (BillingSettings:EnforceAccess = false, local
    /// development) everyone counts as Premium, the same way the paywall lets everyone in.
    /// </remarks>
    public record OpenFinanceEntitlement(bool HasAccess, EnumSubscriptionPlan? Plan, int? MaxConnections)
    {
        public bool AllowsMore(int connected) => HasAccess && (MaxConnections is null || connected < MaxConnections);

        public static async Task<OpenFinanceEntitlement> GetAsync(
            ApplicationDbContext context,
            int userId,
            OpenFinanceSettings settings,
            BillingSettings billingSettings,
            CancellationToken cancellationToken = default)
        {
            if (!billingSettings.EnforceAccess)
                return new OpenFinanceEntitlement(true, EnumSubscriptionPlan.Premium, settings.PremiumMaxConnections);

            var access = await SubscriptionRules.GetAccessAsync(context, userId, DateTime.UtcNow, cancellationToken);
            if (!access.HasAccess)
                return new OpenFinanceEntitlement(false, null, 0);

            return access.Plan == EnumSubscriptionPlan.Premium
                ? new OpenFinanceEntitlement(true, access.Plan, settings.PremiumMaxConnections)
                : new OpenFinanceEntitlement(true, access.Plan, settings.BasicMaxConnections);
        }
    }
}

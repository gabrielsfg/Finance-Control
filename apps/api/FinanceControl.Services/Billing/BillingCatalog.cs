using FinanceControl.Shared.Enums;

namespace FinanceControl.Services.Billing
{
    /// <summary>The price list, in cents. The client never sends a price — it picks from here.</summary>
    /// <remarks>
    /// Yearly is ten months' worth ("two months free"). A price change applies to new
    /// subscriptions and to existing ones at their next plan change; a renewal keeps the
    /// price the subscription already has.
    /// </remarks>
    public static class BillingCatalog
    {
        public const int MaxYearlyInstallments = 12;

        public static int GetPrice(EnumSubscriptionPlan plan, EnumBillingCycle cycle) => (plan, cycle) switch
        {
            (EnumSubscriptionPlan.Basic, EnumBillingCycle.Monthly) => 3499,
            (EnumSubscriptionPlan.Basic, EnumBillingCycle.Yearly) => 35000,
            (EnumSubscriptionPlan.Premium, EnumBillingCycle.Monthly) => 4999,
            (EnumSubscriptionPlan.Premium, EnumBillingCycle.Yearly) => 50000,
            _ => throw new ArgumentOutOfRangeException(nameof(plan), $"No price for {plan}/{cycle}.")
        };

        public static string GetName(EnumSubscriptionPlan plan) => plan switch
        {
            EnumSubscriptionPlan.Premium => "Premium",
            _ => "Basic"
        };

        public static DateTime AddCycle(DateTime start, EnumBillingCycle cycle) =>
            cycle == EnumBillingCycle.Yearly ? start.AddYears(1) : start.AddMonths(1);

        /// Installment plans exist only for the yearly card charge.
        public static bool AllowsInstallments(EnumBillingCycle cycle, EnumBillingMethod method) =>
            cycle == EnumBillingCycle.Yearly && method == EnumBillingMethod.CreditCard;
    }
}

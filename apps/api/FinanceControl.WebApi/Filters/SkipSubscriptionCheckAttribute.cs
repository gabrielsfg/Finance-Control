namespace FinanceControl.WebApi.Filters
{
    /// <summary>
    /// Lets a controller or action through <see cref="SubscriptionAccessFilter"/>: whatever
    /// a user without a subscription must still reach — signing in, subscribing, exporting
    /// or deleting their data (LGPD), reading the terms.
    /// </summary>
    [AttributeUsage(AttributeTargets.Class | AttributeTargets.Method)]
    public sealed class SkipSubscriptionCheckAttribute : Attribute
    {
    }
}

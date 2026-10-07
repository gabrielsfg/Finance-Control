namespace FinanceControl.Shared.Enums
{
    /// Lifecycle of a subscription. Trialing, Active and Canceled (until its period ends)
    /// grant access; PendingPayment and Expired do not.
    public enum EnumSubscriptionStatus
    {
        Trialing,
        PendingPayment,
        Active,
        Canceled,
        Expired
    }
}

namespace FinanceControl.Shared.Enums
{
    /// The paid tiers. Ordered by rank on purpose: comparing two values tells an upgrade
    /// from a downgrade, so a new tier has to be inserted in its place, not appended.
    public enum EnumSubscriptionPlan
    {
        Basic = 1,
        Premium = 2
    }
}

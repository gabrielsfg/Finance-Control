namespace FinanceControl.Shared.Enums
{
    /// Entitlement gate. The AI features read this and nothing else — a Free account
    /// never reaches the point where a snapshot is built, let alone sent out.
    public enum EnumUserPlan
    {
        Free,
        Premium
    }
}

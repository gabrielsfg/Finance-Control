namespace FinanceControl.Shared.Enums
{
    /// Triage state. Nothing in the app changes it — it exists so whoever reads
    /// the table can work through the backlog without keeping a separate list.
    public enum EnumFeedbackStatus
    {
        New,
        UnderReview,
        Done,
        Dismissed
    }
}

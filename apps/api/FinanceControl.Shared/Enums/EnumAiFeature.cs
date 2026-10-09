namespace FinanceControl.Shared.Enums
{
    /// Which in-app feature made a model call. Quotas and cost reports group by it.
    public enum EnumAiFeature
    {
        SpendingInsight,
        PortfolioInsight,
        Chat,
        ImportCategorization,
        ChatSummary
    }
}

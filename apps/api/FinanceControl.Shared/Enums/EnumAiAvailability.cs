namespace FinanceControl.Shared.Enums
{
    /// Why an in-app AI feature did or did not answer. The clients render a different
    /// card for each — an upsell, a "turn it back on" hint, a quiet empty state.
    public enum EnumAiAvailability
    {
        Available,
        NotPremium,
        AiDisabled,
        Unavailable,
        QuotaExceeded,
        NotEnoughData
    }
}

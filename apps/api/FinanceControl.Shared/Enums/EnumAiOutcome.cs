namespace FinanceControl.Shared.Enums
{
    /// How one generation attempt ended. GuardRejected is a normal path, not an
    /// exception — without it there is no way to tell whether the guard still works.
    public enum EnumAiOutcome
    {
        Delivered,
        GuardRejected,
        ApiError,
        QuotaExceeded,
        Disabled,
        NotEnoughData
    }
}

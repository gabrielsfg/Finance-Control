namespace FinanceControl.Shared.Enums
{
    /// Where a transaction came from. Rows created before this column existed are Manual.
    public enum EnumTransactionSource
    {
        Manual,
        FileImport,
        OpenFinance
    }
}

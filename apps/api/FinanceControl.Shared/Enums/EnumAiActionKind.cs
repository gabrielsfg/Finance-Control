namespace FinanceControl.Shared.Enums
{
    /// What a chat proposal would write once the user confirms it. There is deliberately
    /// no delete kind: the assistant never removes data.
    public enum EnumAiActionKind
    {
        CreateTransaction,
        UpdateTransaction,
        CreateGoal,
        CreateBudget
    }
}

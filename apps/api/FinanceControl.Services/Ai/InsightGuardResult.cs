namespace FinanceControl.Services.Ai
{
    /// <summary>
    /// Outcome of checking one generated analysis. A rejection carries the rule that
    /// tripped, because "the guard rejected something" is useless in a log a month later.
    /// </summary>
    public record InsightGuardResult(bool IsApproved, string? Reason)
    {
        public static InsightGuardResult Approved() => new(true, null);

        public static InsightGuardResult Rejected(string reason) => new(false, reason);
    }
}

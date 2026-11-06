namespace FinanceControl.Services.Ai
{
    /// <summary>
    /// Outcome of checking one generated text. <see cref="Reason"/> is a fixed code from
    /// <see cref="AiReasonCodes"/> and is what gets stored. <see cref="Detail"/> is only
    /// ever a term from our own lists — never the model's text, a ticker or a figure — and
    /// goes to the application log, never to the database.
    /// </summary>
    public record InsightGuardResult(bool IsApproved, string? Reason, string? Detail = null)
    {
        public static InsightGuardResult Approved() => new(true, null);

        public static InsightGuardResult Rejected(string reasonCode, string? detail = null) => new(false, reasonCode, detail);
    }
}

namespace FinanceControl.Services.Billing
{
    /// <summary>
    /// What a yearly plan canceled before the end of its year comes to: the months already
    /// started are kept, the remaining months are refunded minus the fee. Amounts in cents.
    /// </summary>
    /// <param name="MonthsUsed">Months started, the current one included (1 to 12).</param>
    /// <param name="AccessUntil">The end of the current month of the plan — the date the next
    /// monthly installment would have been due.</param>
    /// <param name="RemainingValue">The value of the months not started.</param>
    /// <param name="Fee">The early-termination fee, a share of <paramref name="RemainingValue"/>.</param>
    /// <param name="Refund"><paramref name="RemainingValue"/> minus <paramref name="Fee"/>.</param>
    public record EarlyTerminationQuote(int MonthsUsed, DateTime AccessUntil, int RemainingValue, int Fee, int Refund);
}

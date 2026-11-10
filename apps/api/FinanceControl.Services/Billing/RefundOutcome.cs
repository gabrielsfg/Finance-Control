namespace FinanceControl.Services.Billing
{
    /// What happened when a refund was asked of Asaas.
    public enum RefundOutcome
    {
        /// Asaas accepted it; the money goes back through the same card or Pix.
        Requested,
        /// Asaas did not refund it — a paid boleto, or a refusal such as an insufficient
        /// balance: it is owed, recorded as a ManualRefund and paid back by hand in 48 hours.
        ManualPending,
        /// No conclusive answer; nothing was recorded and the caller may try again.
        Unavailable
    }
}

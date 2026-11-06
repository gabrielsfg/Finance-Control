namespace FinanceControl.Services.Billing
{
    /// What happened when a refund was asked of Asaas.
    public enum RefundOutcome
    {
        /// Asaas accepted it; the money goes back through the same card or Pix.
        Requested,
        /// Asaas cannot refund it by API (a paid boleto): it is owed, to be paid back by hand.
        ManualPending,
        /// No conclusive answer; nothing was recorded and the caller may try again.
        Unavailable,
        /// Asaas refused it.
        Rejected
    }
}

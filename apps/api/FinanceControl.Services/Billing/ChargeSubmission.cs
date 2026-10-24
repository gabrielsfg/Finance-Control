namespace FinanceControl.Services.Billing
{
    /// What happened when a charge was sent to (or looked up at) Asaas.
    public enum ChargeSubmission
    {
        /// Approved and paid on the spot (card) — the period can advance now.
        Paid,
        /// Exists at Asaas, payment still to come: Pix/Boleto, or a card under risk review.
        Pending,
        /// Asaas refused it (card declined, invalid data). Nothing was created there.
        Failed,
        /// No conclusive answer. The charge stays Creating and the job looks it up later.
        Inconclusive
    }
}

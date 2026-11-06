namespace FinanceControl.Shared.Enums
{
    /// What canceling the subscription right now would do.
    public enum EnumCancellationKind
    {
        /// No renewal; access until the end of the period already paid, no refund.
        EndOfPeriod,
        /// Within the withdrawal window of a yearly plan: full refund, access ends now.
        Withdrawal,
        /// Yearly plan after the window: unused months refunded minus the fee, access
        /// until the end of the current month.
        EarlyTermination,
        /// Nothing was paid yet (waiting for the first Pix or boleto): ends now.
        Immediate
    }
}

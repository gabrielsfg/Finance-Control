namespace FinanceControl.Shared.Enums
{
    public enum EnumChargeStatus
    {
        /// Created on our side; the Asaas call has not answered conclusively yet.
        Creating,
        /// Exists at Asaas and waits for payment (Pix/Boleto) or for a risk review (card).
        Pending,
        Confirmed,
        Failed,
        Refunded,
        Canceled
    }
}

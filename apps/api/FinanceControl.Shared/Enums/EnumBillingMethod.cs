namespace FinanceControl.Shared.Enums
{
    /// How a subscription is paid. Only CreditCard renews by itself — Pix and Boleto get a
    /// new charge every period that the user has to pay by hand.
    public enum EnumBillingMethod
    {
        CreditCard,
        Pix,
        Boleto
    }
}

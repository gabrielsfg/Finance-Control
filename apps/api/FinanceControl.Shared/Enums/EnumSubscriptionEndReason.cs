namespace FinanceControl.Shared.Enums
{
    /// Why a subscription reached Expired. The client reads it to pick the message —
    /// "canceled for lack of payment" is a different screen from "your plan ended".
    public enum EnumSubscriptionEndReason
    {
        Canceled,
        PaymentFailed,
        Refunded,
        Chargeback
    }
}

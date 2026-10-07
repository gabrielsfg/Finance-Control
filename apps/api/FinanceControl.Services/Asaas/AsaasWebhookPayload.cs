namespace FinanceControl.Services.Asaas
{
    /// <summary>The envelope of a webhook: event id, event name and the payment it is about.</summary>
    /// <remarks>
    /// Only payment events are subscribed. Other objects (checkout, subscription, transfer)
    /// would arrive under their own property and are ignored by design.
    /// </remarks>
    public class AsaasWebhookPayload
    {
        public string? Id { get; set; }
        public string? Event { get; set; }
        public AsaasPaymentResponse? Payment { get; set; }
    }
}

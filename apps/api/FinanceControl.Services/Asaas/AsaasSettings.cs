namespace FinanceControl.Services.Asaas
{
    /// <summary>
    /// Connection to the Asaas payment gateway, bound from the "AsaasSettings" section.
    /// </summary>
    /// <remarks>
    /// The sandbox and production accounts are fully separate — a different base URL, a
    /// different key, a different webhook — so switching environments means changing all
    /// three together. Both secrets belong in user-secrets or appsettings.Local.json.
    /// </remarks>
    public class AsaasSettings
    {
        public string BaseUrl { get; set; } = "https://api-sandbox.asaas.com/v3";
        public string ApiKey { get; set; } = string.Empty;

        /// Sent back by Asaas in the "asaas-access-token" header of every webhook.
        /// 32 to 255 characters, and never the API key.
        public string WebhookToken { get; set; } = string.Empty;

        /// Mandatory for accounts created after 2024-06-13; Asaas rejects calls without it.
        public string UserAgent { get; set; } = "FinanceControl/1.0";

        /// Card operations can take long at the acquirer; Asaas recommends at least 60s.
        public int TimeoutSeconds { get; set; } = 60;
    }
}

namespace FinanceControl.Shared.Dtos.Response.OpenFinance
{
    /// Everything the Pluggy widget needs to open. The token lasts 30 minutes.
    public class ConnectTokenResponseDto
    {
        public string AccessToken { get; set; } = string.Empty;
        public bool IncludeSandbox { get; set; }

        /// Set when reconnecting: the widget opens in update mode on this item.
        public string? UpdateItemId { get; set; }
    }
}

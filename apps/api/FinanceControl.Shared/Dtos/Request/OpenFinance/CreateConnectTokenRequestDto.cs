namespace FinanceControl.Shared.Dtos.Request.OpenFinance
{
    public class CreateConnectTokenRequestDto
    {
        /// Reconnect this connection (widget in update mode) instead of adding a bank.
        public int? ConnectionId { get; set; }

        /// "web" or "mobile": decides where the bank sends the user back after authorizing.
        public string? Platform { get; set; }
    }
}

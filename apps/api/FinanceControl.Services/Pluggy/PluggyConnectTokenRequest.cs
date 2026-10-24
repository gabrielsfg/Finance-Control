namespace FinanceControl.Services.Pluggy
{
    /// Only itemId belongs at the root; Pluggy silently drops anything else placed there.
    public class PluggyConnectTokenRequest
    {
        public string? ItemId { get; set; }
        public PluggyConnectTokenOptions Options { get; set; } = new();
    }
}

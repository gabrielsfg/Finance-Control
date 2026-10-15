namespace FinanceControl.Services.Pluggy
{
    public class PluggyConnector
    {
        public int Id { get; set; }
        public string Name { get; set; } = string.Empty;
        public string? PrimaryColor { get; set; }
        public string? ImageUrl { get; set; }
        public string? Country { get; set; }
        public string? Type { get; set; }
        public bool IsOpenFinance { get; set; }
        public bool IsSandbox { get; set; }
        public PluggyConnectorHealth? Health { get; set; }
    }
}

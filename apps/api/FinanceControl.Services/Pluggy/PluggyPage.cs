namespace FinanceControl.Services.Pluggy
{
    /// Page-numbered list (accounts, connectors).
    public class PluggyPage<T>
    {
        public List<T> Results { get; set; } = [];
        public int Page { get; set; }
        public int TotalPages { get; set; }
        public int Total { get; set; }
    }
}

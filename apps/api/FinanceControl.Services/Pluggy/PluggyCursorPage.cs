namespace FinanceControl.Services.Pluggy
{
    /// Cursor-paged list (/v2/transactions). Next is null on the last page.
    public class PluggyCursorPage<T>
    {
        public List<T> Results { get; set; } = [];
        public string? Next { get; set; }
    }
}

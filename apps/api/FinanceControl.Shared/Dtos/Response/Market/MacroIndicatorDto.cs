namespace FinanceControl.Shared.Dtos.Response.Market
{
    // A single macroeconomic indicator (latest observation) from Brapi /api/v2/macro.
    public class MacroIndicatorDto
    {
        public string Slug { get; set; } = string.Empty;
        public string Name { get; set; } = string.Empty;
        public string? Unit { get; set; }
        public decimal? Value { get; set; }
        public string? Date { get; set; }            // "YYYY-MM-DD" of the latest observation
        public decimal? PreviousValue { get; set; }  // prior observation, for an optional delta
    }
}

namespace FinanceControl.Shared.Dtos.Others.Insight
{
    /// <summary>
    /// One position the user actually holds. The ticker list built from these is what the
    /// guard uses to reject any asset the text mentions but the user does not own.
    /// </summary>
    public class InsightPositionDto
    {
        public string Ticker { get; set; } = string.Empty;
        public string AssetClass { get; set; } = string.Empty;
        public string Value { get; set; } = string.Empty;
        public string Weight { get; set; } = string.Empty;
        public string Result { get; set; } = string.Empty;
    }
}

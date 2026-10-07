namespace FinanceControl.Shared.Dtos.Others.Insight
{
    /// <summary>
    /// One of the week's largest expenses, so the analysis can name what drove a change
    /// instead of only the category. Description is scrubbed by AiPayloadSanitizer
    /// before it leaves the server.
    /// </summary>
    public class InsightTransactionDto
    {
        public string Date { get; set; } = string.Empty;
        public string Description { get; set; } = string.Empty;
        public string Category { get; set; } = string.Empty;
        public string Account { get; set; } = string.Empty;
        public string Value { get; set; } = string.Empty;
    }
}

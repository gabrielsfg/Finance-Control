namespace FinanceControl.Shared.Dtos.Others.Insight
{
    /// <summary>
    /// The structured output contract. The model may return nothing else — no free-form
    /// text field exists for it to wander into.
    /// </summary>
    public class InsightModelOutputDto
    {
        public string Headline { get; set; } = string.Empty;
        public List<InsightModelParagraphDto> Paragraphs { get; set; } = [];
    }
}

namespace FinanceControl.Shared.Dtos.Others.Insight
{
    public class InsightModelParagraphDto
    {
        public string Text { get; set; } = string.Empty;

        /// <summary>
        /// The figures this paragraph used, copied verbatim from the snapshot. Declaring
        /// them is what makes an unsupported number detectable instead of plausible.
        /// </summary>
        public List<string> Figures { get; set; } = [];
    }
}

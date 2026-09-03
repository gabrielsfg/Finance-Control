using FinanceControl.Shared.Dtos.Others.Insight;

namespace FinanceControl.Services.Ai
{
    /// <summary>
    /// One call to the model: what came back, what it cost, and why it failed when it did.
    /// Token counts are carried even on failure — a call that errored after the input was
    /// read was still billed.
    /// </summary>
    public record InsightGenerationResult(
        InsightModelOutputDto? Output,
        int InputTokens,
        int OutputTokens,
        int CachedInputTokens,
        string? Error)
    {
        public static InsightGenerationResult Failed(string error) => new(null, 0, 0, 0, error);
    }
}

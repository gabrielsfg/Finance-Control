namespace FinanceControl.Services.Ai
{
    /// <summary>
    /// One structured call to the model. Token counts are carried even on failure — a call
    /// that errored after the input was read was still billed.
    /// </summary>
    public record ClaudeCallResult<T>(
        T? Output,
        int InputTokens,
        int OutputTokens,
        int CachedInputTokens,
        string? Error) where T : class
    {
        public static ClaudeCallResult<T> Failed(string error) => new(null, 0, 0, 0, error);
    }
}

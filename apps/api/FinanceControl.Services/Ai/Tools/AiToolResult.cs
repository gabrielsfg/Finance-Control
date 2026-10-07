namespace FinanceControl.Services.Ai.Tools
{
    /// <summary>A sanitized tool result, ready to hand to a model.</summary>
    public sealed record AiToolResult(string Json, bool IsError);
}

namespace FinanceControl.Services.Ai.Tools
{
    /// <summary>
    /// One entry of the tool catalog shared by the in-app chat and the MCP server.
    /// </summary>
    /// <param name="Name">Snake_case name the model calls it by.</param>
    /// <param name="Description">What the model reads to decide when to call it — Portuguese output, English here.</param>
    /// <param name="InputSchemaJson">JSON Schema of the arguments object.</param>
    /// <param name="Scope">OAuth scope an MCP client needs to see it. Chat ignores scopes.</param>
    /// <param name="IsProposal">
    /// True for the propose_* tools: they only create an <c>AiPendingAction</c> for the
    /// user to confirm, and are never exposed over MCP, which is read-only.
    /// </param>
    /// <param name="Handler">Returns the result object; the registry compacts and sanitizes it.</param>
    public sealed record AiTool(
        string Name,
        string Description,
        string InputSchemaJson,
        string Scope,
        bool IsProposal,
        Func<AiToolContext, AiToolArguments, Task<object>> Handler);
}

namespace FinanceControl.Services.Ai.Tools
{
    /// <summary>
    /// Who a tool runs for. UserId always comes from the authenticated session or the MCP
    /// access token — never from the model's arguments — so a tool cannot be talked into
    /// reading someone else's data.
    /// </summary>
    /// <param name="ConversationId">Set for chat calls; proposals attach to it. Null over MCP.</param>
    public sealed record AiToolContext(
        int UserId,
        int? ConversationId,
        IServiceProvider Services,
        CancellationToken CancellationToken);
}

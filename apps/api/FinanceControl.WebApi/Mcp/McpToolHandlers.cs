using System.Diagnostics;
using System.Security.Claims;
using System.Text.Json;
using FinanceControl.Data.Data;
using FinanceControl.Domain.Entities;
using FinanceControl.Services.Ai.Tools;
using FinanceControl.WebApi.Authentication;
using ModelContextProtocol.Protocol;
using ModelContextProtocol.Server;

namespace FinanceControl.WebApi.Mcp
{
    /// <summary>
    /// Serves the read-only half of the AiToolRegistry over MCP. A tool is listed and
    /// callable only when the connection holds its scope, and every call is recorded in
    /// McpAccessLog — without its arguments or result.
    /// </summary>
    public static class McpToolHandlers
    {
        public static ValueTask<ListToolsResult> ListToolsAsync(
            RequestContext<ListToolsRequestParams> request,
            CancellationToken cancellationToken)
        {
            var registry = request.Services!.GetRequiredService<AiToolRegistry>();
            var scopes = ScopesOf(request.User);

            var tools = registry.ReadOnly
                .Where(tool => scopes.Contains(tool.Scope))
                .OrderBy(tool => tool.Name, StringComparer.Ordinal)
                .Select(ToMcpTool)
                .ToList();

            return ValueTask.FromResult(new ListToolsResult { Tools = tools });
        }

        public static async ValueTask<CallToolResult> CallToolAsync(
            RequestContext<CallToolRequestParams> request,
            CancellationToken cancellationToken)
        {
            var services = request.Services!;
            var registry = services.GetRequiredService<AiToolRegistry>();
            var user = request.User;
            var name = request.Params?.Name ?? string.Empty;

            var tool = registry.Find(name);
            if (tool is null || tool.IsProposal)
                return Error($"Unknown tool: {name}.");

            if (!ScopesOf(user).Contains(tool.Scope))
                return Error($"This connection was not granted the '{tool.Scope}' permission. Reconnect and allow it.");

            if (!int.TryParse(user?.FindFirst(ClaimTypes.NameIdentifier)?.Value, out var userId))
                return Error("Not authenticated.");

            var arguments = request.Params?.Arguments is { } args
                ? new AiToolArguments(new Dictionary<string, JsonElement>(args))
                : new AiToolArguments(null);

            var stopwatch = Stopwatch.StartNew();
            var result = await registry.ExecuteAsync(tool, arguments, new AiToolContext(userId, null, services, cancellationToken));
            stopwatch.Stop();

            var db = services.GetRequiredService<ApplicationDbContext>();
            db.McpAccessLogs.Add(new McpAccessLog
            {
                UserId = userId,
                GrantId = ParseClaim(user, McpTokenAuthenticationHandler.GrantClaim),
                PersonalTokenId = ParseClaim(user, McpTokenAuthenticationHandler.PersonalTokenClaim),
                ToolName = tool.Name,
                IsError = result.IsError,
                DurationMs = (int)stopwatch.ElapsedMilliseconds
            });
            await db.SaveChangesAsync(cancellationToken);

            return new CallToolResult
            {
                Content = [new TextContentBlock { Text = result.Json }],
                IsError = result.IsError
            };
        }

        private static Tool ToMcpTool(AiTool tool)
        {
            using var schema = JsonDocument.Parse(tool.InputSchemaJson);

            return new Tool
            {
                Name = tool.Name,
                Description = tool.Description,
                InputSchema = schema.RootElement.Clone(),
                Annotations = new ToolAnnotations
                {
                    ReadOnlyHint = true,
                    DestructiveHint = false,
                    IdempotentHint = true,
                    OpenWorldHint = false
                }
            };
        }

        private static HashSet<string> ScopesOf(ClaimsPrincipal? user) =>
            user?.FindAll(McpTokenAuthenticationHandler.ScopeClaim).Select(c => c.Value).ToHashSet() ?? [];

        private static int? ParseClaim(ClaimsPrincipal? user, string type) =>
            int.TryParse(user?.FindFirst(type)?.Value, out var value) ? value : null;

        private static CallToolResult Error(string message) => new()
        {
            Content = [new TextContentBlock { Text = JsonSerializer.Serialize(new { error = message }) }],
            IsError = true
        };
    }
}

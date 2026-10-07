using System.Text.Json;
using System.Text.Json.Nodes;
using System.Text.Json.Serialization;
using Microsoft.Extensions.Logging;

namespace FinanceControl.Services.Ai.Tools
{
    /// <summary>
    /// The catalog of tools the in-app chat and the MCP server share. One definition per
    /// tool means a question answered in the app is answered the same way in the user's
    /// own Claude or ChatGPT.
    /// </summary>
    /// <remarks>
    /// Every result leaves through <see cref="ExecuteAsync"/>, which strips presentation
    /// noise (logos, colors, timestamps) and runs <see cref="AiPayloadSanitizer"/> — a
    /// handler cannot hand a model anything the sanitizer has not seen.
    /// </remarks>
    public class AiToolRegistry
    {
        /// <summary>Appended to every description so no tool is read without the unit rule.</summary>
        public const string MoneyConvention =
            "Integer money fields are in cents of BRL (12345 = R$ 123,45) unless the field name says 'formatted'; " +
            "percentages are plain decimals (12.5 = 12.5%). Dates are YYYY-MM-DD.";

        /// <summary>Above this the model is told to narrow the filters instead of receiving a wall of rows.</summary>
        private const int MaxResultCharacters = 120_000;

        private static readonly HashSet<string> NoiseProperties = new(StringComparer.OrdinalIgnoreCase)
        {
            "logoUrl", "imageUrl", "color", "categoryColor", "emoji", "subCategoryEmoji",
            "createdAt", "updatedAt"
        };

        private static readonly JsonSerializerOptions SerializerOptions = new()
        {
            PropertyNamingPolicy = JsonNamingPolicy.CamelCase,
            DefaultIgnoreCondition = JsonIgnoreCondition.WhenWritingNull,
            Converters = { new JsonStringEnumConverter() }
        };

        private readonly Dictionary<string, AiTool> _tools;
        private readonly ILogger<AiToolRegistry> _logger;

        public AiToolRegistry(ILogger<AiToolRegistry> logger)
        {
            _logger = logger;
            _tools = FinanceReadTools.Create()
                .Concat(TransactionReadTools.Create())
                .Concat(InvestmentReadTools.Create())
                .Concat(AnalyticsReadTools.Create())
                .Concat(ProposalTools.Create())
                .ToDictionary(t => t.Name);
        }

        public IReadOnlyCollection<AiTool> All => _tools.Values;

        /// <summary>What MCP exposes: everything except the chat-only proposals.</summary>
        public IEnumerable<AiTool> ReadOnly => _tools.Values.Where(t => !t.IsProposal);

        public AiTool? Find(string name) => _tools.GetValueOrDefault(name);

        public async Task<AiToolResult> ExecuteAsync(AiTool tool, AiToolArguments arguments, AiToolContext context)
        {
            try
            {
                var result = await tool.Handler(context, arguments);
                var node = JsonSerializer.SerializeToNode(result, SerializerOptions);
                RemoveNoise(node);

                var json = AiPayloadSanitizer.SanitizeNode(node)?.ToJsonString(SerializerOptions) ?? "null";
                if (json.Length > MaxResultCharacters)
                    return Error("The result is too large. Narrow the period or the filters, or use summarize_transactions for totals.");

                return new AiToolResult(json, IsError: false);
            }
            catch (AiToolException exception)
            {
                return Error(exception.Message);
            }
            catch (Exception exception) when (exception is not OperationCanceledException)
            {
                _logger.LogError(exception, "AI tool {Tool} failed for user {UserId}.", tool.Name, context.UserId);
                return Error("The tool failed unexpectedly. Tell the user the data could not be read right now.");
            }
        }

        private static AiToolResult Error(string message) =>
            new(JsonSerializer.Serialize(new { error = message }), IsError: true);

        private static void RemoveNoise(JsonNode? node)
        {
            switch (node)
            {
                case JsonObject obj:
                    foreach (var key in obj.Select(p => p.Key).Where(NoiseProperties.Contains).ToList())
                        obj.Remove(key);
                    foreach (var child in obj.Select(p => p.Value).ToList())
                        RemoveNoise(child);
                    break;

                case JsonArray array:
                    foreach (var child in array)
                        RemoveNoise(child);
                    break;
            }
        }
    }
}

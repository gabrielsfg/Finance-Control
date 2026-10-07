using System.Text.Json;
using Anthropic;
using Anthropic.Models.Messages;
using FinanceControl.Shared.Dtos.Others.Insight;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;

namespace FinanceControl.Services.Ai
{
    /// <summary>
    /// The only class that talks to the model provider — analyses, import categorisation
    /// and the chat assistant all go through it, on one key and one SDK.
    /// </summary>
    /// <remarks>
    /// Everything above it works with a sanitized payload in and a validated DTO out, which
    /// is what keeps the provider swappable and the guard meaningful. A failure in the
    /// structured calls is a returned error, never an exception that reaches the
    /// middleware — an analysis that cannot be generated is a card that does not render,
    /// not a broken request. The chat loop calls <see cref="CreateMessageAsync"/> directly
    /// and owns its own error handling, because it has to answer the user either way.
    /// </remarks>
    public class ClaudeClient
    {
        private readonly AnthropicSettings _settings;
        private readonly ILogger<ClaudeClient> _logger;
        private readonly Lazy<AnthropicClient> _client;

        private static readonly JsonSerializerOptions OutputSerializerOptions = new()
        {
            PropertyNameCaseInsensitive = true
        };

        public ClaudeClient(
            IOptions<AnthropicSettings> settings,
            ILogger<ClaudeClient> logger)
        {
            _settings = settings.Value;
            _logger = logger;

            // Lazy so that a deployment without a key still boots — the feature stays off
            // instead of taking the API down with it.
            _client = new Lazy<AnthropicClient>(() => new AnthropicClient
            {
                ApiKey = _settings.ApiKey,
                Timeout = TimeSpan.FromSeconds(_settings.TimeoutSeconds)
            });
        }

        public bool IsConfigured =>
            _settings.Enabled && !string.IsNullOrWhiteSpace(_settings.ApiKey);

        /// <summary>The weekly analyses: the shared insight prompt, the insight schema.</summary>
        public async Task<InsightGenerationResult> GenerateInsightAsync(
            string snapshotJson,
            CancellationToken cancellationToken = default)
        {
            var result = await GenerateStructuredAsync<InsightModelOutputDto>(
                _settings.AnalysisModel,
                InsightPrompt.System,
                snapshotJson,
                InsightPrompt.OutputSchemaJson,
                _settings.MaxOutputTokens,
                cancellationToken);

            return new InsightGenerationResult(
                result.Output,
                result.InputTokens,
                result.OutputTokens,
                result.CachedInputTokens,
                result.Error);
        }

        /// <summary>
        /// One request with a JSON-schema constrained answer. The system prompt is sent as
        /// the cached prefix, so it has to be byte-identical across calls — nothing
        /// per-request belongs in it.
        /// </summary>
        public async Task<ClaudeCallResult<T>> GenerateStructuredAsync<T>(
            string model,
            string systemPrompt,
            string userContent,
            string outputSchemaJson,
            int maxTokens,
            CancellationToken cancellationToken = default) where T : class
        {
            if (!IsConfigured)
                return ClaudeCallResult<T>.Failed("Anthropic integration is disabled or unconfigured.");

            try
            {
                var schema = JsonSerializer.Deserialize<Dictionary<string, JsonElement>>(outputSchemaJson)!;

                var response = await _client.Value.Messages.Create(new MessageCreateParams
                {
                    Model = model,
                    MaxTokens = maxTokens,
                    System = new List<TextBlockParam>
                    {
                        new()
                        {
                            Text = systemPrompt,
                            CacheControl = new CacheControlEphemeral()
                        }
                    },
                    Messages =
                    [
                        new() { Role = Role.User, Content = userContent }
                    ],
                    OutputConfig = new OutputConfig
                    {
                        Format = new JsonOutputFormat { Schema = schema }
                    }
                }, cancellationToken);

                var inputTokens = (int)response.Usage.InputTokens;
                var outputTokens = (int)response.Usage.OutputTokens;
                var cachedTokens = (int)(response.Usage.CacheReadInputTokens ?? 0);

                if (response.StopReason == "refusal")
                    return new ClaudeCallResult<T>(null, inputTokens, outputTokens, cachedTokens, "Model refused the request.");

                var text = string.Concat(response.Content
                    .Select(block => block.Value)
                    .OfType<TextBlock>()
                    .Select(block => block.Text));

                if (string.IsNullOrWhiteSpace(text))
                    return new ClaudeCallResult<T>(null, inputTokens, outputTokens, cachedTokens, "Model returned no text.");

                var output = JsonSerializer.Deserialize<T>(text, OutputSerializerOptions);
                if (output is null)
                    return new ClaudeCallResult<T>(null, inputTokens, outputTokens, cachedTokens, "Model output did not match the schema.");

                return new ClaudeCallResult<T>(output, inputTokens, outputTokens, cachedTokens, null);
            }
            catch (Exception exception)
            {
                // Deliberately broad: a provider outage, a schema drift or a serialisation
                // problem all mean the same thing to the caller — no answer this time.
                _logger.LogError(exception, "Structured Claude call failed.");
                return ClaudeCallResult<T>.Failed(exception.GetType().Name + ": " + exception.Message);
            }
        }

        /// <summary>
        /// A raw Messages call for the chat loop, which needs tool use and the full
        /// response. Throws on provider errors; the caller decides what the user sees.
        /// </summary>
        public Task<Message> CreateMessageAsync(
            MessageCreateParams parameters,
            CancellationToken cancellationToken = default)
        {
            if (!IsConfigured)
                throw new InvalidOperationException("Anthropic integration is disabled or unconfigured.");

            return _client.Value.Messages.Create(parameters, cancellationToken);
        }
    }
}

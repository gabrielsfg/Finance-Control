using System.Text.Json;
using Anthropic;
using Anthropic.Models.Messages;
using FinanceControl.Shared.Dtos.Others.Insight;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;

namespace FinanceControl.Services.Ai
{
    /// <summary>
    /// The only class that talks to the model provider.
    /// </summary>
    /// <remarks>
    /// Everything above it works with a snapshot in and a validated DTO out, which is what
    /// keeps the provider swappable and the guard meaningful. A failure here is a returned
    /// error, never an exception that reaches the middleware — an analysis that cannot be
    /// generated is a card that does not render, not a broken request.
    /// </remarks>
    public class AnthropicInsightClient
    {
        private readonly AnthropicSettings _settings;
        private readonly ILogger<AnthropicInsightClient> _logger;
        private readonly Lazy<AnthropicClient> _client;

        private static readonly JsonSerializerOptions OutputSerializerOptions = new()
        {
            PropertyNameCaseInsensitive = true
        };

        public AnthropicInsightClient(
            IOptions<AnthropicSettings> settings,
            ILogger<AnthropicInsightClient> logger)
        {
            _settings = settings.Value;
            _logger = logger;

            // Lazy so that a deployment without a key still boots — the feature stays off
            // instead of taking the API down with it.
            _client = new Lazy<AnthropicClient>(() => new AnthropicClient
            {
                ApiKey = _settings.ApiKey
            });
        }

        public bool IsConfigured =>
            _settings.Enabled && !string.IsNullOrWhiteSpace(_settings.ApiKey);

        public async Task<InsightGenerationResult> GenerateAsync(
            string snapshotJson,
            CancellationToken cancellationToken = default)
        {
            if (!IsConfigured)
                return InsightGenerationResult.Failed("Anthropic integration is disabled or unconfigured.");

            try
            {
                var schema = JsonSerializer.Deserialize<Dictionary<string, JsonElement>>(
                    InsightPrompt.OutputSchemaJson)!;

                var response = await _client.Value.Messages.Create(new MessageCreateParams
                {
                    Model = _settings.AnalysisModel,
                    MaxTokens = _settings.MaxOutputTokens,

                    // The cached prefix. It has to be byte-identical across calls, which is
                    // why nothing per-request is allowed into InsightPrompt.System.
                    System = new List<TextBlockParam>
                    {
                        new()
                        {
                            Text = InsightPrompt.System,
                            CacheControl = new CacheControlEphemeral()
                        }
                    },
                    Messages =
                    [
                        new() { Role = Role.User, Content = snapshotJson }
                    ],
                    OutputConfig = new OutputConfig
                    {
                        Format = new JsonOutputFormat { Schema = schema }
                    }
                }, cancellationToken);

                var text = string.Concat(response.Content
                    .Select(block => block.Value)
                    .OfType<TextBlock>()
                    .Select(block => block.Text));

                if (string.IsNullOrWhiteSpace(text))
                    return InsightGenerationResult.Failed("Model returned no text.");

                var output = JsonSerializer.Deserialize<InsightModelOutputDto>(text, OutputSerializerOptions);
                if (output is null)
                    return InsightGenerationResult.Failed("Model output did not match the schema.");

                return new InsightGenerationResult(
                    output,
                    (int)response.Usage.InputTokens,
                    (int)response.Usage.OutputTokens,
                    (int)(response.Usage.CacheReadInputTokens ?? 0),
                    null);
            }
            catch (Exception exception)
            {
                // Deliberately broad: a provider outage, a schema drift or a serialisation
                // problem all mean the same thing to the caller — no analysis this time.
                _logger.LogError(exception, "Insight generation failed.");
                return InsightGenerationResult.Failed(exception.GetType().Name + ": " + exception.Message);
            }
        }
    }
}

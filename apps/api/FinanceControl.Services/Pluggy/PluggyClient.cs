using System.Net.Http.Json;
using System.Text.Json;
using System.Text.Json.Serialization;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;

namespace FinanceControl.Services.Pluggy
{
    /// <summary>
    /// Thin typed client over the Pluggy REST API.
    /// </summary>
    /// <remarks>
    /// Authenticates with client id and secret for an API key (cached in
    /// <see cref="PluggyApiKeyCache"/>) and sends it as X-API-KEY. Bodies are never logged:
    /// they carry bank transactions. What gets logged is the endpoint, the status and
    /// Pluggy's error code.
    /// </remarks>
    public class PluggyClient
    {
        private const int MaxPages = 200;

        private static readonly JsonSerializerOptions JsonOptions = new(JsonSerializerDefaults.Web)
        {
            DefaultIgnoreCondition = JsonIgnoreCondition.WhenWritingNull
        };

        private readonly HttpClient _httpClient;
        private readonly PluggySettings _settings;
        private readonly PluggyApiKeyCache _apiKeyCache;
        private readonly ILogger<PluggyClient> _logger;

        public PluggyClient(
            HttpClient httpClient,
            IOptions<PluggySettings> settings,
            PluggyApiKeyCache apiKeyCache,
            ILogger<PluggyClient> logger)
        {
            _httpClient = httpClient;
            _settings = settings.Value;
            _apiKeyCache = apiKeyCache;
            _logger = logger;
        }

        public bool IsConfigured =>
            !string.IsNullOrWhiteSpace(_settings.ClientId) && !string.IsNullOrWhiteSpace(_settings.ClientSecret);

        public Task<PluggyResult<PluggyConnectTokenResponse>> CreateConnectTokenAsync(
            PluggyConnectTokenRequest request, CancellationToken cancellationToken = default) =>
            SendAsync<PluggyConnectTokenResponse>(HttpMethod.Post, "connect_token", request, cancellationToken);

        public Task<PluggyResult<PluggyPage<PluggyConnector>>> GetConnectorsAsync(
            bool includeSandbox, CancellationToken cancellationToken = default) =>
            SendAsync<PluggyPage<PluggyConnector>>(
                HttpMethod.Get,
                $"connectors?countries=BR&sandbox={(includeSandbox ? "true" : "false")}",
                null,
                cancellationToken);

        public Task<PluggyResult<PluggyItem>> GetItemAsync(string itemId, CancellationToken cancellationToken = default) =>
            SendAsync<PluggyItem>(HttpMethod.Get, $"items/{Uri.EscapeDataString(itemId)}", null, cancellationToken);

        /// <summary>Asks Pluggy to collect from the bank now. Meant for user-triggered updates only.</summary>
        public Task<PluggyResult<PluggyItem>> UpdateItemAsync(string itemId, CancellationToken cancellationToken = default) =>
            SendAsync<PluggyItem>(HttpMethod.Patch, $"items/{Uri.EscapeDataString(itemId)}", new { }, cancellationToken);

        /// <summary>Deletes the item: Pluggy wipes the credentials and revokes the Open Finance consent.</summary>
        public Task<PluggyResult<JsonElement>> DeleteItemAsync(string itemId, CancellationToken cancellationToken = default) =>
            SendAsync<JsonElement>(HttpMethod.Delete, $"items/{Uri.EscapeDataString(itemId)}", null, cancellationToken);

        public Task<PluggyResult<PluggyPage<PluggyAccount>>> GetAccountsAsync(
            string itemId, CancellationToken cancellationToken = default) =>
            SendAsync<PluggyPage<PluggyAccount>>(
                HttpMethod.Get, $"accounts?itemId={Uri.EscapeDataString(itemId)}", null, cancellationToken);

        /// <summary>Every investment position of an item, following the pages to the end.</summary>
        public async Task<PluggyResult<List<PluggyInvestment>>> ListInvestmentsAsync(
            string itemId, CancellationToken cancellationToken = default)
        {
            var all = new List<PluggyInvestment>();
            for (var page = 1; page <= MaxPages; page++)
            {
                var result = await SendAsync<PluggyPage<PluggyInvestment>>(
                    HttpMethod.Get,
                    $"investments?itemId={Uri.EscapeDataString(itemId)}&page={page}&pageSize=500",
                    null,
                    cancellationToken);
                if (!result.IsSuccess)
                    return result.As<List<PluggyInvestment>>();

                all.AddRange(result.Value!.Results);
                if (result.Value.TotalPages <= page)
                    break;
            }
            return PluggyResult<List<PluggyInvestment>>.Success(all);
        }

        /// <summary>
        /// Every transaction of an account matching the filter, following the cursor of
        /// /v2/transactions to the end (the page-numbered /transactions is retired on
        /// 2026-12-31). One filter is normally set: <paramref name="dateFrom"/> for a
        /// window, <paramref name="createdAtFrom"/> for what a webhook announced,
        /// <paramref name="ids"/> for specific rows (at most 500).
        /// </summary>
        public async Task<PluggyResult<List<PluggyTransaction>>> ListTransactionsAsync(
            string accountId,
            DateOnly? dateFrom = null,
            DateTime? createdAtFrom = null,
            IReadOnlyCollection<string>? ids = null,
            CancellationToken cancellationToken = default)
        {
            var query = new List<string> { $"accountId={Uri.EscapeDataString(accountId)}" };
            if (ids is { Count: > 0 })
                query.Add($"ids={Uri.EscapeDataString(string.Join(',', ids))}");
            else if (createdAtFrom is { } createdAt)
                query.Add($"createdAtFrom={Uri.EscapeDataString(createdAt.ToUniversalTime().ToString("yyyy-MM-ddTHH:mm:ss.fffZ"))}");
            else if (dateFrom is { } from)
                query.Add($"dateFrom={from:yyyy-MM-dd}");

            var path = "v2/transactions?" + string.Join('&', query);
            var all = new List<PluggyTransaction>();

            for (var page = 0; page < MaxPages; page++)
            {
                var result = await SendAsync<PluggyCursorPage<PluggyTransaction>>(HttpMethod.Get, path, null, cancellationToken);
                if (!result.IsSuccess)
                    return result.As<List<PluggyTransaction>>();

                all.AddRange(result.Value!.Results);

                var next = result.Value.Next;
                if (string.IsNullOrEmpty(next))
                    return PluggyResult<List<PluggyTransaction>>.Success(all);

                path = ResolveNext(next, query);
            }

            _logger.LogWarning("Pluggy transaction listing stopped after {MaxPages} pages.", MaxPages);
            return PluggyResult<List<PluggyTransaction>>.Success(all);
        }

        // The cursor arrives as a query string ("?accountId=...&after=..."); a full URL, a
        // path or a bare cursor value are tolerated too, since the format is not pinned down.
        private static string ResolveNext(string next, List<string> baseQuery)
        {
            if (next.StartsWith("http", StringComparison.OrdinalIgnoreCase))
                return next;
            if (next.StartsWith('?'))
                return "v2/transactions" + next;
            if (next.StartsWith('/'))
                return next.TrimStart('/');
            return "v2/transactions?" + string.Join('&', baseQuery) + "&after=" + Uri.EscapeDataString(next);
        }

        private async Task<PluggyResult<T>> SendAsync<T>(
            HttpMethod method, string path, object? body, CancellationToken cancellationToken)
        {
            if (!IsConfigured)
                return PluggyResult<T>.Rejected(0, "not_configured", "The Pluggy credentials are not configured.");

            var apiKey = await _apiKeyCache.GetAsync(() => AuthenticateAsync(cancellationToken), cancellationToken);
            if (apiKey is null)
                return PluggyResult<T>.Inconclusive(null, "Could not authenticate with Pluggy.");

            var result = await SendOnceAsync<T>(method, path, body, apiKey, cancellationToken);

            // An expired or revoked key: renew it once and try again.
            if (result.StatusCode == 401)
            {
                _apiKeyCache.Invalidate(apiKey);
                apiKey = await _apiKeyCache.GetAsync(() => AuthenticateAsync(cancellationToken), cancellationToken);
                if (apiKey is null)
                    return PluggyResult<T>.Inconclusive(null, "Could not authenticate with Pluggy.");
                result = await SendOnceAsync<T>(method, path, body, apiKey, cancellationToken);
            }

            return result;
        }

        private async Task<string?> AuthenticateAsync(CancellationToken cancellationToken)
        {
            var request = new PluggyAuthRequest { ClientId = _settings.ClientId, ClientSecret = _settings.ClientSecret };
            var result = await SendOnceAsync<PluggyAuthResponse>(HttpMethod.Post, "auth", request, null, cancellationToken);
            if (result.IsSuccess && !string.IsNullOrEmpty(result.Value?.ApiKey))
                return result.Value.ApiKey;

            _logger.LogError("Pluggy authentication failed with {StatusCode} ({ErrorCode}).", result.StatusCode, result.ErrorCode);
            return null;
        }

        private async Task<PluggyResult<T>> SendOnceAsync<T>(
            HttpMethod method, string path, object? body, string? apiKey, CancellationToken cancellationToken)
        {
            using var request = new HttpRequestMessage(method, path);
            if (apiKey is not null)
                request.Headers.TryAddWithoutValidation("X-API-KEY", apiKey);
            if (body is not null)
                request.Content = JsonContent.Create(body, body.GetType(), options: JsonOptions);

            HttpResponseMessage response;
            try
            {
                response = await _httpClient.SendAsync(request, cancellationToken);
            }
            catch (TaskCanceledException) when (!cancellationToken.IsCancellationRequested)
            {
                _logger.LogWarning("Pluggy {Method} {Path} timed out.", method, StripQuery(path));
                return PluggyResult<T>.Inconclusive(null, "Timeout.");
            }
            catch (HttpRequestException exception)
            {
                _logger.LogWarning(exception, "Pluggy {Method} {Path} failed on transport.", method, StripQuery(path));
                return PluggyResult<T>.Inconclusive(null, "Transport failure.");
            }

            using (response)
            {
                var statusCode = (int)response.StatusCode;

                if (response.IsSuccessStatusCode)
                {
                    // A DELETE answers 204 with no body; that is still a success.
                    try
                    {
                        var value = await response.Content.ReadFromJsonAsync<T>(JsonOptions, cancellationToken);
                        return PluggyResult<T>.Success(value!);
                    }
                    catch (JsonException)
                    {
                        return PluggyResult<T>.Success(default!);
                    }
                }

                var (errorCode, errorMessage) = await ReadErrorAsync(response, cancellationToken);

                if (statusCode >= 500 || statusCode == 429 || statusCode == 408)
                {
                    _logger.LogWarning("Pluggy {Method} {Path} answered {StatusCode}.", method, StripQuery(path), statusCode);
                    return PluggyResult<T>.Inconclusive(statusCode, errorMessage);
                }

                _logger.LogWarning(
                    "Pluggy {Method} {Path} rejected with {StatusCode} ({ErrorCode}).",
                    method, StripQuery(path), statusCode, errorCode);
                return PluggyResult<T>.Rejected(statusCode, errorCode, errorMessage);
            }
        }

        // Pluggy's error body has a numeric "code" (the HTTP status) and the meaningful
        // name in "codeDescription"; read it loosely, since a proxy error page has neither.
        private static async Task<(string? Code, string? Message)> ReadErrorAsync(
            HttpResponseMessage response, CancellationToken cancellationToken)
        {
            try
            {
                var text = await response.Content.ReadAsStringAsync(cancellationToken);
                using var document = JsonDocument.Parse(text);
                var root = document.RootElement;
                if (root.ValueKind != JsonValueKind.Object)
                    return (null, null);

                string? code = null;
                if (root.TryGetProperty("codeDescription", out var description) && description.ValueKind == JsonValueKind.String)
                    code = description.GetString();
                else if (root.TryGetProperty("code", out var codeElement) && codeElement.ValueKind == JsonValueKind.String)
                    code = codeElement.GetString();

                var message = root.TryGetProperty("message", out var messageElement) && messageElement.ValueKind == JsonValueKind.String
                    ? messageElement.GetString()
                    : null;
                return (code, message);
            }
            catch (JsonException)
            {
                return (null, null);
            }
        }

        // The query string carries account and item ids; the path alone identifies the call.
        private static string StripQuery(string path)
        {
            var index = path.IndexOf('?');
            return index < 0 ? path : path[..index];
        }
    }
}

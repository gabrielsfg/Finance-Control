using System.Net.Http.Json;
using System.Text.Json.Serialization;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;

namespace FinanceControl.Services.Billing
{
    /// <summary>Server-side check of a Turnstile token produced by the web form.</summary>
    public class TurnstileVerifier
    {
        private readonly HttpClient _httpClient;
        private readonly TurnstileSettings _settings;
        private readonly ILogger<TurnstileVerifier> _logger;

        public TurnstileVerifier(HttpClient httpClient, IOptions<TurnstileSettings> settings, ILogger<TurnstileVerifier> logger)
        {
            _httpClient = httpClient;
            _settings = settings.Value;
            _logger = logger;
        }

        public bool IsEnabled => !string.IsNullOrWhiteSpace(_settings.SecretKey);

        public async Task<bool> VerifyAsync(string? token, string? remoteIp, CancellationToken cancellationToken = default)
        {
            if (!IsEnabled)
                return true;

            if (string.IsNullOrWhiteSpace(token))
                return false;

            var form = new Dictionary<string, string>
            {
                ["secret"] = _settings.SecretKey,
                ["response"] = token
            };
            if (!string.IsNullOrWhiteSpace(remoteIp))
                form["remoteip"] = remoteIp;

            try
            {
                using var response = await _httpClient.PostAsync(
                    _settings.VerifyUrl, new FormUrlEncodedContent(form), cancellationToken);
                var result = await response.Content.ReadFromJsonAsync<TurnstileResponse>(cancellationToken);
                return result?.Success == true;
            }
            catch (Exception exception) when (exception is HttpRequestException or TaskCanceledException)
            {
                // Fail closed: a card form that skips the captcha whenever Cloudflare is slow
                // is exactly the window a card-testing script waits for.
                _logger.LogWarning(exception, "Turnstile verification failed on transport.");
                return false;
            }
        }

        private sealed class TurnstileResponse
        {
            [JsonPropertyName("success")]
            public bool Success { get; set; }
        }
    }
}

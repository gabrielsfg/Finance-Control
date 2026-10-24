using System.Globalization;
using System.Net.Http.Json;
using System.Text.Json;
using System.Text.Json.Serialization;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;

namespace FinanceControl.Services.Asaas
{
    /// <summary>
    /// Thin typed client over the Asaas REST API (v3).
    /// </summary>
    /// <remarks>
    /// Request bodies are never logged: they carry card data and CPFs. What gets logged is
    /// the endpoint, the status and Asaas' error code, which is enough to tell a declined
    /// card from a misconfigured key.
    /// </remarks>
    public class AsaasClient
    {
        private static readonly JsonSerializerOptions JsonOptions = new(JsonSerializerDefaults.Web)
        {
            DefaultIgnoreCondition = JsonIgnoreCondition.WhenWritingNull
        };

        private readonly HttpClient _httpClient;
        private readonly AsaasSettings _settings;
        private readonly ILogger<AsaasClient> _logger;

        public AsaasClient(HttpClient httpClient, IOptions<AsaasSettings> settings, ILogger<AsaasClient> logger)
        {
            _httpClient = httpClient;
            _settings = settings.Value;
            _logger = logger;
        }

        public bool IsConfigured => !string.IsNullOrWhiteSpace(_settings.ApiKey);

        public Task<AsaasResult<AsaasCustomerResponse>> CreateCustomerAsync(
            AsaasCustomerRequest request, CancellationToken cancellationToken = default) =>
            SendAsync<AsaasCustomerResponse>(HttpMethod.Post, "customers", request, cancellationToken);

        public Task<AsaasResult<AsaasCustomerResponse>> UpdateCustomerAsync(
            string customerId, AsaasCustomerRequest request, CancellationToken cancellationToken = default) =>
            SendAsync<AsaasCustomerResponse>(HttpMethod.Put, $"customers/{customerId}", request, cancellationToken);

        public Task<AsaasResult<AsaasTokenizeResponse>> TokenizeCardAsync(
            AsaasTokenizeRequest request, CancellationToken cancellationToken = default) =>
            SendAsync<AsaasTokenizeResponse>(HttpMethod.Post, "creditCard/tokenizeCreditCard", request, cancellationToken);

        public Task<AsaasResult<AsaasPaymentResponse>> CreatePaymentAsync(
            AsaasPaymentRequest request, CancellationToken cancellationToken = default) =>
            SendAsync<AsaasPaymentResponse>(HttpMethod.Post, "payments", request, cancellationToken);

        public Task<AsaasResult<AsaasPaymentResponse>> GetPaymentAsync(
            string paymentId, CancellationToken cancellationToken = default) =>
            SendAsync<AsaasPaymentResponse>(HttpMethod.Get, $"payments/{paymentId}", null, cancellationToken);

        /// <summary>
        /// Looks a charge up by our idempotency key — the safe way to resolve a creation
        /// that timed out. Returns a null value when Asaas has no such charge.
        /// </summary>
        public async Task<AsaasResult<AsaasPaymentResponse?>> FindPaymentByExternalReferenceAsync(
            string externalReference, CancellationToken cancellationToken = default)
        {
            var result = await SendAsync<AsaasPaymentListResponse>(
                HttpMethod.Get,
                $"payments?externalReference={Uri.EscapeDataString(externalReference)}&limit=10",
                null,
                cancellationToken);

            if (result.IsInconclusive)
                return AsaasResult<AsaasPaymentResponse?>.Inconclusive(result.StatusCode, result.ErrorDescription);
            if (!result.IsSuccess)
                return AsaasResult<AsaasPaymentResponse?>.Rejected(result.StatusCode ?? 0, result.ErrorCode, result.ErrorDescription);

            // An installment plan answers with one row per installment; the first stands for
            // the plan, and a deleted charge is as good as none.
            var match = result.Value!.Data
                .Where(p => !p.Deleted)
                .OrderBy(p => p.InstallmentNumber ?? 0)
                .FirstOrDefault();

            return AsaasResult<AsaasPaymentResponse?>.Success(match);
        }

        public Task<AsaasResult<JsonElement>> DeletePaymentAsync(
            string paymentId, CancellationToken cancellationToken = default) =>
            SendAsync<JsonElement>(HttpMethod.Delete, $"payments/{paymentId}", null, cancellationToken);

        public Task<AsaasResult<JsonElement>> RefundPaymentAsync(
            string paymentId, AsaasRefundRequest request, CancellationToken cancellationToken = default) =>
            SendAsync<JsonElement>(HttpMethod.Post, $"payments/{paymentId}/refund", request, cancellationToken);

        /// <summary>Refunds every installment of a card installment plan at once.</summary>
        public Task<AsaasResult<JsonElement>> RefundInstallmentAsync(
            string installmentId, CancellationToken cancellationToken = default) =>
            SendAsync<JsonElement>(HttpMethod.Post, $"installments/{installmentId}/refund", new { }, cancellationToken);

        public Task<AsaasResult<AsaasPixQrCodeResponse>> GetPixQrCodeAsync(
            string paymentId, CancellationToken cancellationToken = default) =>
            SendAsync<AsaasPixQrCodeResponse>(HttpMethod.Get, $"payments/{paymentId}/pixQrCode", null, cancellationToken);

        /// <summary>Asaas takes money as reais with two decimals; we keep cents everywhere else.</summary>
        public static decimal ToReais(int cents) => cents / 100m;

        public static string FormatDate(DateOnly date) => date.ToString("yyyy-MM-dd", CultureInfo.InvariantCulture);

        private async Task<AsaasResult<T>> SendAsync<T>(
            HttpMethod method, string path, object? body, CancellationToken cancellationToken)
        {
            if (!IsConfigured)
                return AsaasResult<T>.Rejected(0, "not_configured", "The Asaas API key is not configured.");

            using var request = new HttpRequestMessage(method, path);
            if (body is not null)
                request.Content = JsonContent.Create(body, body.GetType(), options: JsonOptions);

            HttpResponseMessage response;
            try
            {
                response = await _httpClient.SendAsync(request, cancellationToken);
            }
            catch (TaskCanceledException) when (!cancellationToken.IsCancellationRequested)
            {
                _logger.LogWarning("Asaas {Method} {Path} timed out.", method, StripQuery(path));
                return AsaasResult<T>.Inconclusive(null, "Timeout.");
            }
            catch (HttpRequestException exception)
            {
                _logger.LogWarning(exception, "Asaas {Method} {Path} failed on transport.", method, StripQuery(path));
                return AsaasResult<T>.Inconclusive(null, "Transport failure.");
            }

            using (response)
            {
                var statusCode = (int)response.StatusCode;

                if (response.IsSuccessStatusCode)
                {
                    // The operation happened; an empty or odd body (some DELETEs) must not
                    // turn that into an exception the caller would read as a failure.
                    try
                    {
                        var value = await response.Content.ReadFromJsonAsync<T>(JsonOptions, cancellationToken);
                        return AsaasResult<T>.Success(value!);
                    }
                    catch (JsonException)
                    {
                        return AsaasResult<T>.Success(default!);
                    }
                }

                AsaasErrorItem? error = null;
                try
                {
                    var errors = await response.Content.ReadFromJsonAsync<AsaasErrorResponse>(JsonOptions, cancellationToken);
                    error = errors?.Errors?.FirstOrDefault();
                }
                catch (JsonException)
                {
                    // Not every failure has the documented body (a proxy page, an empty 502).
                }

                if (statusCode >= 500 || statusCode == 429)
                {
                    _logger.LogWarning(
                        "Asaas {Method} {Path} answered {StatusCode}.", method, StripQuery(path), statusCode);
                    return AsaasResult<T>.Inconclusive(statusCode, error?.Description);
                }

                _logger.LogWarning(
                    "Asaas {Method} {Path} rejected with {StatusCode} ({ErrorCode}).",
                    method, StripQuery(path), statusCode, error?.Code);
                return AsaasResult<T>.Rejected(statusCode, error?.Code, error?.Description);
            }
        }

        // The query string can carry our references; the path alone identifies the call.
        private static string StripQuery(string path)
        {
            var index = path.IndexOf('?');
            return index < 0 ? path : path[..index];
        }
    }
}

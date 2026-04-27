using FinanceControl.Domain.Interfaces.Services;
using FinanceControl.Shared.Dtos.Response;
using Microsoft.Extensions.Caching.Memory;
using System.Text.Json;

namespace FinanceControl.Services.Services
{
    public class CurrencyService : ICurrencyService
    {
        private readonly HttpClient _httpClient;
        private readonly IMemoryCache _cache;
        private static readonly TimeSpan CacheDuration = TimeSpan.FromHours(1);
        private const string CacheKeyPrefix = "exchange_rates_";
        private const string BaseUrl = "https://open.er-api.com/v6/latest/";

        public CurrencyService(HttpClient httpClient, IMemoryCache cache)
        {
            _httpClient = httpClient;
            _cache = cache;
        }

        public async Task<IReadOnlyList<CurrencyRateResponseDto>> GetRatesAsync(string baseCurrency)
        {
            var key = CacheKeyPrefix + baseCurrency.ToUpper();

            if (_cache.TryGetValue(key, out IReadOnlyList<CurrencyRateResponseDto>? cached))
                return cached!;

            var response = await _httpClient.GetAsync($"{BaseUrl}{baseCurrency.ToUpper()}");
            response.EnsureSuccessStatusCode();

            using var stream = await response.Content.ReadAsStreamAsync();
            using var doc = await JsonDocument.ParseAsync(stream);

            var rates = doc.RootElement
                .GetProperty("rates")
                .EnumerateObject()
                .Select(p => new CurrencyRateResponseDto
                {
                    Code = p.Name,
                    Rate = p.Value.GetDecimal()
                })
                .OrderBy(r => r.Code)
                .ToList();

            _cache.Set(key, (IReadOnlyList<CurrencyRateResponseDto>)rates, CacheDuration);

            return rates;
        }
    }
}

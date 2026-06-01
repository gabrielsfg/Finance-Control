using FinanceControl.Domain.Interfaces.Services;
using FinanceControl.Services.Brapi;
using FinanceControl.Shared.Dtos.Response.Simulation;
using Microsoft.Extensions.Caching.Memory;
using Microsoft.Extensions.Options;
using System.Globalization;
using System.Text.Json;

namespace FinanceControl.Services.Services
{
    public class SimulationService : ISimulationService
    {
        private readonly IHttpClientFactory _httpClientFactory;
        private readonly IMemoryCache _cache;
        private readonly BrapiSettings _brapiSettings;

        // BACEN SGS series codes
        private const int SgsCdi = 4391;        // CDI monthly rate
        private const int SgsSelic = 4390;      // SELIC monthly rate
        private const int SgsIpca = 433;        // IPCA monthly rate

        // Brapi symbols for equity index benchmarks.
        // ^BVSP: confirmed in brapi docs. IFIX/IVVB11: to be validated with a live Pro response.
        private static readonly Dictionary<string, string> BrapiIndexSymbols = new()
        {
            ["IBOVESPA"]  = "^BVSP",
            ["IFIX"]      = "IFIX",    // unconfirmed — validate with Pro account JSON
            ["SP500_BRL"] = "IVVB11",  // proxy ETF in BRL; native S&P500 not confirmed available
        };

        // Fallback annual rates used when Brapi data is unavailable for a benchmark.
        private static readonly Dictionary<string, decimal> FallbackAnnualReturns = new()
        {
            ["CDI"]       = 10.5m,
            ["SELIC"]     = 10.75m,
            ["IPCA+6"]    = 10.5m,
            ["IPCA+5"]    = 9.5m,
            ["IPCA+4"]    = 8.5m,
            ["IBOVESPA"]  = 13.0m,
            ["IFIX"]      = 11.0m,
            ["SP500_BRL"] = 18.0m,
        };

        public SimulationService(IHttpClientFactory httpClientFactory, IMemoryCache cache, IOptions<BrapiSettings> brapiSettings)
        {
            _httpClientFactory = httpClientFactory;
            _cache = cache;
            _brapiSettings = brapiSettings.Value;
        }

        public async Task<BenchmarkRatesDto> GetBenchmarkRatesAsync()
        {
            const string cacheKey = "simulation_benchmark_rates";
            if (_cache.TryGetValue(cacheKey, out BenchmarkRatesDto? cached) && cached is not null)
                return cached;

            var today = DateOnly.FromDateTime(DateTime.UtcNow);
            var from12m = today.AddMonths(-12);

            var cdiRates  = await FetchBacenMonthlyAsync(SgsCdi,   from12m, today);
            var selicRates = await FetchBacenMonthlyAsync(SgsSelic, from12m, today);
            var ipcaRates  = await FetchBacenMonthlyAsync(SgsIpca,  from12m, today);

            // Annualise from monthly compounding
            decimal AnnualFromMonthly(Dictionary<string, decimal> rates)
            {
                if (rates.Count == 0) return 0m;
                var compound = rates.Values.Aggregate(1m, (acc, r) => acc * (1 + r / 100));
                return Math.Round((compound - 1) * 100, 2);
            }

            var dto = new BenchmarkRatesDto
            {
                CdiAnnual       = AnnualFromMonthly(cdiRates),
                SelicAnnual     = AnnualFromMonthly(selicRates),
                IpcaTrailing12m = AnnualFromMonthly(ipcaRates),
                FetchedAt       = DateTime.UtcNow,
            };

            _cache.Set(cacheKey, dto, TimeSpan.FromHours(6));
            return dto;
        }

        public async Task<HistoricalSimulationDto> GetHistoricalSimulationAsync(
            string benchmark,
            DateOnly startDate,
            DateOnly endDate,
            long monthlyContribution,
            long initialAmount)
        {
            var monthly = await GetMonthlyReturnsForBenchmarkAsync(benchmark, startDate, endDate);
            bool isEquityBenchmark = benchmark is "IBOVESPA" or "IFIX" or "SP500_BRL";
            bool brapiDataEmpty = isEquityBenchmark && monthly.Count == 0;
            bool isPartial = !isEquityBenchmark && monthly.Count == 0;

            var points = new List<HistoricalSimulationPointDto>();
            long value    = initialAmount;
            long invested = initialAmount;

            var cursor = new DateOnly(startDate.Year, startDate.Month, 1);
            while (cursor <= new DateOnly(endDate.Year, endDate.Month, 1))
            {
                invested += monthlyContribution;
                value    += monthlyContribution;

                var key = $"{cursor.Year:D4}-{cursor.Month:D2}";
                var monthReturnPct = monthly.TryGetValue(key, out var r) ? r : GetFallbackMonthly(benchmark);

                value = (long)Math.Round(value * (1 + (double)monthReturnPct / 100));

                points.Add(new HistoricalSimulationPointDto
                {
                    Label            = cursor.ToString("MMM/yy", new CultureInfo("pt-BR")),
                    Month            = cursor.Month,
                    Year             = cursor.Year,
                    Invested         = invested,
                    Value            = value,
                    Interest         = value - invested,
                    MonthlyReturnPct = monthReturnPct,
                });

                cursor = cursor.AddMonths(1);
            }

            int months = points.Count;
            decimal totalReturnPct = invested > 0
                ? Math.Round((decimal)(value - invested) / invested * 100, 2)
                : 0m;

            decimal annualizedReturnPct = 0m;
            if (months > 0 && invested > 0 && value > 0)
            {
                var ratio = (double)value / initialAmount.Clamp(1, long.MaxValue);
                annualizedReturnPct = Math.Round(
                    (decimal)(Math.Pow(ratio, 12.0 / months) - 1) * 100, 2);
            }

            string? note = GetDataNote(benchmark, isPartial, brapiDataEmpty);

            return new HistoricalSimulationDto
            {
                Benchmark            = benchmark,
                StartDate            = startDate,
                EndDate              = endDate,
                TotalInvested        = invested,
                FinalValue           = value,
                TotalReturnPct       = totalReturnPct,
                AnnualizedReturnPct  = annualizedReturnPct,
                Points               = points,
                IsPartialData        = isPartial || IsStubBenchmark(benchmark, brapiDataEmpty),
                DataNote             = note,
            };
        }

        // Returns the appropriate monthly series for the requested benchmark.
        // CDI/SELIC/IPCA+X: BACEN (free, long history). Equity indices: Brapi Pro.
        private async Task<Dictionary<string, decimal>> GetMonthlyReturnsForBenchmarkAsync(
            string benchmark, DateOnly from, DateOnly to)
        {
            return benchmark switch
            {
                "CDI"      => await FetchBacenMonthlyDecimalAsync(SgsCdi, from, to),
                "SELIC"    => await FetchBacenMonthlyDecimalAsync(SgsSelic, from, to),
                "IPCA+6"   => await BuildIpcaPlusAsync(from, to, 6m),
                "IPCA+5"   => await BuildIpcaPlusAsync(from, to, 5m),
                "IPCA+4"   => await BuildIpcaPlusAsync(from, to, 4m),
                "IBOVESPA" or "IFIX" or "SP500_BRL"
                           => await GetMonthlyReturnsFromBrapiAsync(benchmark, from, to),
                _          => [],
            };
        }

        public async Task<List<AssetRateDto>> GetAssetRatesAsync(IEnumerable<string> tickers)
        {
            var results = new List<AssetRateDto>();

            foreach (var ticker in tickers)
            {
                var rate = await GetCagrForTickerAsync(ticker);
                results.Add(rate);
            }

            return results;
        }

        // Fetches up to 10 years of monthly closing prices for a ticker and computes
        // the annualised CAGR (price return only, dividends not included).
        private async Task<AssetRateDto> GetCagrForTickerAsync(string ticker)
        {
            if (string.IsNullOrEmpty(_brapiSettings.Token))
                return new AssetRateDto { Ticker = ticker, IsReal = false, RateSource = "Sem token Brapi" };

            var cacheKey = $"brapi_cagr_{ticker}";
            if (_cache.TryGetValue(cacheKey, out AssetRateDto? cached) && cached is not null)
                return cached;

            try
            {
                using var client = _httpClientFactory.CreateClient();
                client.Timeout = TimeSpan.FromSeconds(10);

                var url = $"https://brapi.dev/api/quote/{Uri.EscapeDataString(ticker)}?range=10y&interval=1mo&token={_brapiSettings.Token}";
                var json = await client.GetStringAsync(url);
                var doc = JsonDocument.Parse(json);

                if (!doc.RootElement.TryGetProperty("results", out var results) ||
                    results.GetArrayLength() == 0)
                    return new AssetRateDto { Ticker = ticker, IsReal = false, RateSource = "Sem dados Brapi" };

                var firstResult = results[0];
                if (!firstResult.TryGetProperty("historicalDataPrice", out var history))
                    return new AssetRateDto { Ticker = ticker, IsReal = false, RateSource = "Sem histórico Brapi" };

                var points = new List<(DateOnly Date, decimal Close)>();
                foreach (var point in history.EnumerateArray())
                {
                    if (!point.TryGetProperty("date", out var dateProp)) continue;
                    if (!point.TryGetProperty("close", out var closeProp)) continue;
                    if (closeProp.ValueKind == JsonValueKind.Null) continue;

                    var date = DateOnly.FromDateTime(DateTimeOffset.FromUnixTimeSeconds(dateProp.GetInt64()).UtcDateTime);
                    points.Add((date, closeProp.GetDecimal()));
                }

                if (points.Count < 2)
                    return new AssetRateDto { Ticker = ticker, IsReal = false, RateSource = "Dados insuficientes" };

                points.Sort((a, b) => a.Date.CompareTo(b.Date));

                var first = points[0];
                var last  = points[^1];

                if (first.Close <= 0)
                    return new AssetRateDto { Ticker = ticker, IsReal = false, RateSource = "Preço inicial inválido" };

                var years = (last.Date.Year - first.Date.Year) + (last.Date.Month - first.Date.Month) / 12.0;
                if (years <= 0)
                    return new AssetRateDto { Ticker = ticker, IsReal = false, RateSource = "Período inválido" };

                var cagr = (Math.Pow((double)(last.Close / first.Close), 1.0 / years) - 1) * 100;

                var dto = new AssetRateDto
                {
                    Ticker          = ticker,
                    AnnualReturnPct = Math.Round(cagr, 2),
                    YearsOfData     = (int)Math.Floor(years),
                    IsReal          = true,
                    RateSource      = $"CAGR {(int)Math.Floor(years)}a (Brapi, somente preço)",
                };

                _cache.Set(cacheKey, dto, TimeSpan.FromHours(12));
                return dto;
            }
            catch
            {
                return new AssetRateDto { Ticker = ticker, IsReal = false, RateSource = "Erro ao buscar Brapi" };
            }
        }

        // Fetches monthly closing prices from Brapi for an equity index benchmark and
        // converts them to a month-by-month return series. Uses interval=1mo so each
        // data point is already one calendar month — no aggregation needed.
        private async Task<Dictionary<string, decimal>> GetMonthlyReturnsFromBrapiAsync(
            string benchmark, DateOnly from, DateOnly to)
        {
            if (!BrapiIndexSymbols.TryGetValue(benchmark, out var symbol))
                return [];

            if (string.IsNullOrEmpty(_brapiSettings.Token))
                return [];

            // Determine the range parameter that covers from→to.
            var months = (to.Year - from.Year) * 12 + (to.Month - from.Month);
            var range = months switch
            {
                <= 1   => "1mo",
                <= 3   => "3mo",
                <= 6   => "6mo",
                <= 12  => "1y",
                <= 24  => "2y",
                <= 60  => "5y",
                <= 120 => "10y",
                _      => "max",
            };

            var cacheKey = $"brapi_index_{symbol}_{range}";
            if (_cache.TryGetValue(cacheKey, out Dictionary<string, decimal>? cached) && cached is not null)
                return cached;

            try
            {
                using var client = _httpClientFactory.CreateClient();
                client.Timeout = TimeSpan.FromSeconds(10);

                // Encode symbol — index tickers like ^BVSP contain reserved chars
                var url = $"https://brapi.dev/api/quote/{Uri.EscapeDataString(symbol)}?range={range}&interval=1mo&token={_brapiSettings.Token}";
                var json = await client.GetStringAsync(url);
                var doc = JsonDocument.Parse(json);

                if (!doc.RootElement.TryGetProperty("results", out var results) ||
                    results.GetArrayLength() == 0)
                    return [];

                var firstResult = results[0];
                if (!firstResult.TryGetProperty("historicalDataPrice", out var history))
                    return [];

                // Build list of (date, close) sorted ascending.
                var points = new List<(DateOnly Date, decimal Close)>();
                foreach (var point in history.EnumerateArray())
                {
                    if (!point.TryGetProperty("date", out var dateProp)) continue;
                    if (!point.TryGetProperty("close", out var closeProp)) continue;
                    if (closeProp.ValueKind == JsonValueKind.Null) continue;

                    var unixSeconds = dateProp.GetInt64();
                    var date = DateOnly.FromDateTime(DateTimeOffset.FromUnixTimeSeconds(unixSeconds).UtcDateTime);
                    var close = closeProp.GetDecimal();
                    points.Add((date, close));
                }

                points.Sort((a, b) => a.Date.CompareTo(b.Date));

                // Filter to the requested date range.
                points = points.Where(p => p.Date >= from && p.Date <= to).ToList();

                // Derive month-over-month return % from consecutive closing prices.
                var returns = new Dictionary<string, decimal>();
                for (int i = 1; i < points.Count; i++)
                {
                    var prev = points[i - 1].Close;
                    if (prev == 0) continue;
                    var curr = points[i].Close;
                    var key = $"{points[i].Date.Year:D4}-{points[i].Date.Month:D2}";
                    returns[key] = Math.Round((curr / prev - 1) * 100, 6);
                }

                _cache.Set(cacheKey, returns, TimeSpan.FromHours(12));
                return returns;
            }
            catch
            {
                return [];
            }
        }

        // Converts annual real spread to monthly and adds to IPCA monthly series
        private async Task<Dictionary<string, decimal>> BuildIpcaPlusAsync(
            DateOnly from, DateOnly to, decimal annualRealSpread)
        {
            var ipca = await FetchBacenMonthlyDecimalAsync(SgsIpca, from, to);
            var monthlyRealSpread = (decimal)(Math.Pow(1 + (double)annualRealSpread / 100, 1.0 / 12) - 1) * 100;

            return ipca.ToDictionary(
                kv => kv.Key,
                kv => Math.Round(kv.Value + monthlyRealSpread, 6));
        }

        private decimal GetFallbackMonthly(string benchmark)
        {
            var annual = FallbackAnnualReturns.TryGetValue(benchmark, out var a) ? a : 10m;
            return Math.Round((decimal)(Math.Pow(1 + (double)annual / 100, 1.0 / 12) - 1) * 100, 6);
        }

        private static bool IsStubBenchmark(string benchmark, bool brapiDataEmpty) =>
            benchmark is "IBOVESPA" or "IFIX" or "SP500_BRL" && brapiDataEmpty;

        private static string? GetDataNote(string benchmark, bool noData, bool brapiDataEmpty) => benchmark switch
        {
            "IBOVESPA" when brapiDataEmpty  => "Dados simulados com base na média histórica do Ibovespa. Ative o plano Pro da Brapi para dados reais.",
            "IFIX"     when brapiDataEmpty  => "Dados simulados com base na média histórica do IFIX. Ative o plano Pro da Brapi para dados reais.",
            "SP500_BRL" when brapiDataEmpty => "Dados simulados com base na média histórica do S&P 500 em BRL. Ative o plano Pro da Brapi para dados reais.",
            _ when noData => "Não foi possível obter dados históricos reais. Usando estimativa baseada em média histórica.",
            _             => null,
        };

        // Fetches BACEN SGS monthly series and returns values as double (for backward compat)
        private async Task<Dictionary<string, decimal>> FetchBacenMonthlyAsync(
            int series, DateOnly from, DateOnly to)
            => await FetchBacenMonthlyDecimalAsync(series, from, to);

        private async Task<Dictionary<string, decimal>> FetchBacenMonthlyDecimalAsync(
            int series, DateOnly from, DateOnly to)
        {
            var cacheKey = $"bacen_{series}_{from:yyyyMM}_{to:yyyyMM}";
            if (_cache.TryGetValue(cacheKey, out Dictionary<string, decimal>? cached) && cached is not null)
                return cached;

            var result   = new Dictionary<string, decimal>();
            var startStr = from.ToString("dd/MM/yyyy");
            var endStr   = to.ToString("dd/MM/yyyy");
            var url      = $"https://api.bcb.gov.br/dados/serie/bcdata.sgs.{series}/dados?formato=json&dataInicial={startStr}&dataFinal={endStr}";

            try
            {
                using var client = _httpClientFactory.CreateClient();
                client.Timeout   = TimeSpan.FromSeconds(8);
                var json         = await client.GetStringAsync(url);
                var entries      = System.Text.Json.JsonDocument.Parse(json).RootElement;

                foreach (var entry in entries.EnumerateArray())
                {
                    var dateStr = entry.GetProperty("data").GetString() ?? "";
                    var valStr  = entry.GetProperty("valor").GetString() ?? "0";

                    if (dateStr.Length == 10 && decimal.TryParse(valStr,
                            NumberStyles.Any, CultureInfo.InvariantCulture, out var val))
                    {
                        var parts = dateStr.Split('/');
                        result[$"{parts[2]}-{parts[1]}"] = val;
                    }
                }

                _cache.Set(cacheKey, result, TimeSpan.FromHours(12));
            }
            catch { }

            return result;
        }
    }

    internal static class LongExtensions
    {
        internal static long Clamp(this long value, long min, long max)
            => value < min ? min : value > max ? max : value;
    }
}

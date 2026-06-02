using FinanceControl.Data.Data;
using FinanceControl.Domain.Interfaces.Services;
using FinanceControl.Services.Brapi;
using FinanceControl.Shared.Dtos.Request.Simulation;
using FinanceControl.Shared.Dtos.Response.Simulation;
using Microsoft.EntityFrameworkCore;
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
        private readonly ApplicationDbContext _context;

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

        public SimulationService(
            IHttpClientFactory httpClientFactory,
            IMemoryCache cache,
            IOptions<BrapiSettings> brapiSettings,
            ApplicationDbContext context)
        {
            _httpClientFactory = httpClientFactory;
            _cache = cache;
            _brapiSettings = brapiSettings.Value;
            _context = context;
        }

        public async Task<List<AvailableBenchmarkDto>> GetAvailableBenchmarksAsync()
        {
            const string cacheKey = "simulation_available_benchmarks";
            if (_cache.TryGetValue(cacheKey, out List<AvailableBenchmarkDto>? cached) && cached is not null)
                return cached;

            // Join MarketAsset with MarketPriceHistory to find assets that actually have
            // historical price data in the DB, and return the usable date range.
            var results = await _context.MarketAssets
                .Where(a => a.PriceHistory.Any())
                .Select(a => new AvailableBenchmarkDto
                {
                    Ticker           = a.Ticker,
                    Name             = a.Name,
                    AssetType        = a.AssetType.ToString(),
                    EarliestDate     = a.PriceHistory.Min(h => h.Date),
                    LatestDate       = a.PriceHistory.Max(h => h.Date),
                    MonthsAvailable  = a.PriceHistory.Select(h => new { h.Date.Year, h.Date.Month }).Distinct().Count(),
                })
                .OrderByDescending(a => a.MonthsAvailable)
                .ThenBy(a => a.Ticker)
                .ToListAsync();

            _cache.Set(cacheKey, results, TimeSpan.FromHours(6));
            return results;
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
            bool isFixedBenchmark = benchmark is "CDI" or "SELIC" or "IPCA+6" or "IPCA+5" or "IPCA+4"
                                               or "IBOVESPA" or "IFIX" or "SP500_BRL";
            bool isEquityBenchmark = benchmark is "IBOVESPA" or "IFIX" or "SP500_BRL";
            bool isDbTicker = !isFixedBenchmark;
            bool brapiDataEmpty = isEquityBenchmark && monthly.Count == 0;
            // For DB tickers, no fallback — missing months use 0% return (data gaps).
            bool isPartial = !isEquityBenchmark && !isDbTicker && monthly.Count == 0;

            var points = new List<HistoricalSimulationPointDto>();
            long value    = initialAmount;
            long invested = initialAmount;

            var cursor = new DateOnly(startDate.Year, startDate.Month, 1);
            while (cursor <= new DateOnly(endDate.Year, endDate.Month, 1))
            {
                invested += monthlyContribution;
                value    += monthlyContribution;

                var key = $"{cursor.Year:D4}-{cursor.Month:D2}";
                var monthReturnPct = monthly.TryGetValue(key, out var r) ? r
                    : isDbTicker ? 0m
                    : GetFallbackMonthly(benchmark);

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

        // Simulates the historical performance of a multi-asset portfolio.
        // For each asset we fetch the same monthly-return series used by the single-benchmark
        // simulation, then apply the user-defined weights month by month (implicit monthly
        // rebalancing). The simulated range is reduced to the months for which EVERY asset
        // has data, so the portfolio return is always well defined.
        public async Task<PortfolioBacktestDto> GetPortfolioBacktestAsync(
            IReadOnlyList<PortfolioAssetInputDto> assets,
            DateOnly startDate,
            DateOnly endDate,
            long monthlyContribution,
            long initialAmount)
        {
            // Fetch the monthly-return series for each distinct ticker.
            var seriesByTicker = new Dictionary<string, Dictionary<string, decimal>>(StringComparer.OrdinalIgnoreCase);
            foreach (var asset in assets)
            {
                if (seriesByTicker.ContainsKey(asset.Ticker)) continue;
                seriesByTicker[asset.Ticker] = await GetMonthlyReturnsForBenchmarkAsync(asset.Ticker, startDate, endDate);
            }

            // Build the list of month keys requested by the caller.
            var requestedKeys = new HashSet<string>();
            var cursor = new DateOnly(startDate.Year, startDate.Month, 1);
            var endMonth = new DateOnly(endDate.Year, endDate.Month, 1);
            while (cursor <= endMonth)
            {
                requestedKeys.Add($"{cursor.Year:D4}-{cursor.Month:D2}");
                cursor = cursor.AddMonths(1);
            }

            // Fixed benchmarks (CDI/SELIC/IPCA+X and equity indices) fall back to the historical
            // average for any month without real data — same behaviour as the single-asset simulator.
            // This keeps the benchmark fully covered so the simulated range is driven by DB tickers only.
            static bool IsFixedBenchmark(string t) => t is "CDI" or "SELIC" or "IPCA+6" or "IPCA+5" or "IPCA+4"
                                                          or "IBOVESPA" or "IFIX" or "SP500_BRL";
            var stubbedTickers = new List<string>();
            foreach (var ticker in seriesByTicker.Keys.ToList())
            {
                if (!IsFixedBenchmark(ticker)) continue;
                var series = seriesByTicker[ticker];
                bool wasEmpty = series.Count == 0;
                var fallback = GetFallbackMonthly(ticker);
                foreach (var key in requestedKeys)
                    if (!series.ContainsKey(key)) series[key] = fallback;
                if (wasEmpty && ticker is "IBOVESPA" or "IFIX" or "SP500_BRL")
                    stubbedTickers.Add(ticker);
            }

            // Months with data for EVERY asset, intersected with the requested range.
            HashSet<string>? common = null;
            foreach (var ticker in seriesByTicker.Keys)
            {
                var months = seriesByTicker[ticker].Keys.ToHashSet();
                common = common is null ? new HashSet<string>(months) : common.Intersect(months).ToHashSet();
            }
            common ??= [];
            common.IntersectWith(requestedKeys);

            var orderedKeys = common.OrderBy(k => k, StringComparer.Ordinal).ToList();

            if (orderedKeys.Count == 0)
            {
                return new PortfolioBacktestDto
                {
                    Points              = [],
                    AssetReturns        = assets.Select(a => new PortfolioAssetReturnDto { Ticker = a.Ticker, TotalReturnPct = 0m }).ToList(),
                    TotalInvested       = initialAmount,
                    FinalValue          = initialAmount,
                    AnnualizedReturnPct = 0m,
                    EffectiveStartDate  = startDate.ToString("yyyy-MM-dd"),
                    EffectiveEndDate    = endDate.ToString("yyyy-MM-dd"),
                    IsPartialData       = true,
                    DataNote            = "Não há período em comum com dados históricos para todos os ativos selecionados. Ajuste o período ou os ativos da carteira.",
                };
            }

            // Per-asset cumulative growth factor (geometric, over the effective months).
            var assetFactors = new Dictionary<string, decimal>(StringComparer.OrdinalIgnoreCase);
            foreach (var ticker in seriesByTicker.Keys)
            {
                decimal factor = 1m;
                foreach (var key in orderedKeys)
                    factor *= 1 + (seriesByTicker[ticker].TryGetValue(key, out var v) ? v : 0m) / 100;
                assetFactors[ticker] = factor;
            }

            var ptBr = new CultureInfo("pt-BR");
            var points = new List<PortfolioBacktestPointDto>();
            long value    = initialAmount;
            long invested = initialAmount;
            decimal portfolioFactor = 1m;

            foreach (var key in orderedKeys)
            {
                invested += monthlyContribution;
                value    += monthlyContribution;

                // Weighted return of the portfolio for this month.
                decimal weightedReturn = 0m;
                foreach (var asset in assets)
                {
                    var r = seriesByTicker[asset.Ticker].TryGetValue(key, out var v) ? v : 0m;
                    weightedReturn += (decimal)(asset.WeightPct / 100.0) * r;
                }

                value = (long)Math.Round(value * (1 + (double)weightedReturn / 100));
                portfolioFactor *= 1 + weightedReturn / 100;

                var year  = int.Parse(key[..4]);
                var month = int.Parse(key[5..7]);
                var label = new DateOnly(year, month, 1).ToString("MMM/yy", ptBr);

                points.Add(new PortfolioBacktestPointDto
                {
                    Label            = label,
                    Month            = month,
                    Year             = year,
                    Invested         = invested,
                    Value            = value,
                    MonthlyReturnPct = Math.Round(weightedReturn, 4),
                });
            }

            int monthCount = points.Count;
            decimal annualizedReturnPct = monthCount > 0
                ? Math.Round((decimal)(Math.Pow((double)portfolioFactor, 12.0 / monthCount) - 1) * 100, 2)
                : 0m;

            // Per-asset total return over the effective period (deduplicated by ticker order in request).
            var seenTickers = new HashSet<string>(StringComparer.OrdinalIgnoreCase);
            var assetReturns = new List<PortfolioAssetReturnDto>();
            foreach (var asset in assets)
            {
                if (!seenTickers.Add(asset.Ticker)) continue;
                assetReturns.Add(new PortfolioAssetReturnDto
                {
                    Ticker         = asset.Ticker,
                    TotalReturnPct = Math.Round((assetFactors[asset.Ticker] - 1) * 100, 2),
                });
            }

            var effectiveStart = orderedKeys[0];
            var effectiveEnd   = orderedKeys[^1];
            bool isReducedRange = monthCount < requestedKeys.Count;

            string? note = null;
            if (stubbedTickers.Count > 0)
                note = $"Dados estimados (média histórica) para: {string.Join(", ", stubbedTickers)}. Ative o plano Pro da Brapi para dados reais.";
            if (isReducedRange)
            {
                var rangeNote = $"Período reduzido para {effectiveStart} → {effectiveEnd} ({monthCount} meses), o intervalo com cobertura de dados para todos os ativos.";
                note = note is null ? rangeNote : $"{note} {rangeNote}";
            }

            return new PortfolioBacktestDto
            {
                Points              = points,
                AssetReturns        = assetReturns,
                TotalInvested       = invested,
                FinalValue          = value,
                AnnualizedReturnPct = annualizedReturnPct,
                EffectiveStartDate  = $"{effectiveStart}-01",
                EffectiveEndDate    = $"{effectiveEnd}-01",
                IsPartialData       = isReducedRange || stubbedTickers.Count > 0,
                DataNote            = note,
            };
        }

        // Returns the appropriate monthly series for the requested benchmark.
        // CDI/SELIC/IPCA+X: BACEN (free, long history). Equity indices: Brapi Pro.
        // Any other value is treated as a DB ticker (MarketPriceHistory).
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
                _          => await GetMonthlyReturnsFromDbAsync(benchmark, from, to),
            };
        }

        // Reads daily prices from MarketPriceHistory and derives month-end-to-month-end returns.
        private async Task<Dictionary<string, decimal>> GetMonthlyReturnsFromDbAsync(
            string ticker, DateOnly from, DateOnly to)
        {
            var asset = await _context.MarketAssets
                .Where(a => a.Ticker == ticker)
                .Select(a => new { a.Id })
                .FirstOrDefaultAsync();

            if (asset is null) return [];

            // Fetch a window slightly before 'from' so we have a prior-month close for the first return.
            var windowStart = from.AddMonths(-2);

            var prices = await _context.MarketPriceHistories
                .Where(h => h.MarketAssetId == asset.Id && h.Date >= windowStart && h.Date <= to)
                .OrderBy(h => h.Date)
                .Select(h => new { h.Date, h.Price })
                .ToListAsync();

            if (prices.Count < 2) return [];

            // For each month in [from, to], find the last available price in that month
            // and compute the return vs the last available price of the previous month.
            var byMonth = prices
                .GroupBy(p => (p.Date.Year, p.Date.Month))
                .ToDictionary(
                    g => g.Key,
                    g => g.OrderByDescending(p => p.Date).First().Price);

            var returns = new Dictionary<string, decimal>();
            DateOnly cursor = new(from.Year, from.Month, 1);
            var prev = cursor.AddMonths(-1);

            while (cursor <= new DateOnly(to.Year, to.Month, 1))
            {
                var prevKey  = (prev.Year, prev.Month);
                var currKey  = (cursor.Year, cursor.Month);

                if (byMonth.TryGetValue(prevKey, out var prevPrice) &&
                    byMonth.TryGetValue(currKey, out var currPrice) &&
                    prevPrice > 0)
                {
                    var key = $"{cursor.Year:D4}-{cursor.Month:D2}";
                    returns[key] = Math.Round(((decimal)currPrice / prevPrice - 1) * 100, 6);
                }

                prev   = cursor;
                cursor = cursor.AddMonths(1);
            }

            return returns;
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

        public async Task<AssetRateDto?> GetAssetRateForPeriodAsync(string ticker, string period)
        {
            var today = DateOnly.FromDateTime(DateTime.UtcNow);
            var from = period switch
            {
                "7D"  => today.AddDays(-7),
                "30D" => today.AddDays(-30),
                "1A"  => today.AddYears(-1),
                "2A"  => today.AddYears(-2),
                "5A"  => today.AddYears(-5),
                "10A" => today.AddYears(-10),
                "15A" => today.AddYears(-15),
                _     => (DateOnly?)null,
            };

            if (from is null)
                return null;

            var history = await _context.MarketPriceHistories
                .Where(h => h.MarketAsset.Ticker == ticker.ToUpper() && h.Date >= from)
                .OrderBy(h => h.Date)
                .Select(h => new { h.Date, h.Price })
                .ToListAsync();

            if (history.Count < 2)
                return new AssetRateDto { Ticker = ticker.ToUpper(), IsReal = false, RateSource = "Dados insuficientes no período" };

            var first = history[0];
            var last  = history[^1];

            if (first.Price <= 0)
                return new AssetRateDto { Ticker = ticker.ToUpper(), IsReal = false, RateSource = "Preço inicial inválido" };

            var days  = (last.Date.DayNumber - first.Date.DayNumber);
            var years = days / 365.25;

            if (years <= 0)
                return new AssetRateDto { Ticker = ticker.ToUpper(), IsReal = false, RateSource = "Período inválido" };

            var cagr = (Math.Pow((double)last.Price / first.Price, 1.0 / years) - 1) * 100;

            return new AssetRateDto
            {
                Ticker          = ticker.ToUpper(),
                AnnualReturnPct = Math.Round(cagr, 2),
                YearsOfData     = (int)Math.Floor(years),
                IsReal          = true,
                RateSource      = $"CAGR {period} (histórico local, somente preço)",
            };
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

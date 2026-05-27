using FinanceControl.Domain.Interfaces.Services;
using FinanceControl.Shared.Dtos.Response.Simulation;
using Microsoft.Extensions.Caching.Memory;
using System.Globalization;

namespace FinanceControl.Services.Services
{
    public class SimulationService : ISimulationService
    {
        private readonly IHttpClientFactory _httpClientFactory;
        private readonly IMemoryCache _cache;

        // BACEN SGS series codes
        private const int SgsCdi = 4391;        // CDI monthly rate
        private const int SgsSelic = 4390;      // SELIC monthly rate
        private const int SgsIpca = 433;        // IPCA monthly rate

        // Historical annual averages used when BACEN data is unavailable (fallback)
        // These represent long-run Brazilian market estimates
        private static readonly Dictionary<string, decimal> FallbackAnnualReturns = new()
        {
            ["CDI"]       = 10.5m,
            ["SELIC"]     = 10.75m,
            ["IPCA+6"]    = 10.5m,  // approx IPCA (~4.5%) + 6% real
            ["IPCA+5"]    = 9.5m,
            ["IPCA+4"]    = 8.5m,
            ["IBOVESPA"]  = 13.0m,  // long-run Ibovespa nominal avg (future: real API)
            ["IFIX"]      = 11.0m,  // FII index estimate (future: real API)
            ["SP500_BRL"] = 18.0m,  // S&P500 in BRL estimate (future: real API)
        };

        public SimulationService(IHttpClientFactory httpClientFactory, IMemoryCache cache)
        {
            _httpClientFactory = httpClientFactory;
            _cache = cache;
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
            bool isPartial = monthly.Count == 0;

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

            string? note = GetDataNote(benchmark, isPartial);

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
                IsPartialData        = isPartial || IsStubBenchmark(benchmark),
                DataNote             = note,
            };
        }

        // Returns the appropriate monthly series for the requested benchmark.
        // CDI and SELIC come from BACEN with real data.
        // IPCA+X is BACEN IPCA + fixed real spread.
        // Equity indices (Ibovespa, IFIX, S&P500) use historical averages until a market data API is integrated.
        private async Task<Dictionary<string, decimal>> GetMonthlyReturnsForBenchmarkAsync(
            string benchmark, DateOnly from, DateOnly to)
        {
            return benchmark switch
            {
                "CDI"       => await FetchBacenMonthlyDecimalAsync(SgsCdi, from, to),
                "SELIC"     => await FetchBacenMonthlyDecimalAsync(SgsSelic, from, to),
                "IPCA+6"    => await BuildIpcaPlusAsync(from, to, 6m),
                "IPCA+5"    => await BuildIpcaPlusAsync(from, to, 5m),
                "IPCA+4"    => await BuildIpcaPlusAsync(from, to, 4m),
                // Equity stubs: return empty so the caller uses fallback monthly rate
                _           => [],
            };
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

        private static bool IsStubBenchmark(string benchmark) =>
            benchmark is "IBOVESPA" or "IFIX" or "SP500_BRL";

        private static string? GetDataNote(string benchmark, bool noData) => benchmark switch
        {
            "IBOVESPA"  => "Dados simulados com base na média histórica do Ibovespa. A integração com dados reais será implementada em breve.",
            "IFIX"      => "Dados simulados com base na média histórica do IFIX. A integração com dados reais será implementada em breve.",
            "SP500_BRL" => "Dados simulados com base na média histórica do S&P 500 convertida para BRL. A integração com dados reais será implementada em breve.",
            _ when noData => "Não foi possível obter dados históricos reais. Usando estimativa baseada em média histórica.",
            _           => null,
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

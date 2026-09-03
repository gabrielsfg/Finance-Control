using System.Text.Json;
using FinanceControl.Shared.Enums;
using Microsoft.Extensions.Caching.Memory;

namespace FinanceControl.Services.Investments
{
    /// <summary>
    /// Values fixed-income positions that no market quotes.
    /// </summary>
    /// <remarks>
    /// A CDB has no ticker anyone publishes a price for, so its worth today has to be
    /// derived from what it earns: a share of the CDI, inflation plus a spread, or a flat
    /// agreed rate. The first two come from the Banco Central series the simulator already
    /// reads.
    /// <para>
    /// Only whole closed months accrue. The current month is left out because its index is
    /// not published yet — understating slightly is honest, while extrapolating the running
    /// month would show the user a number the market has not produced.
    /// </para>
    /// </remarks>
    public class FixedIncomeAccrual
    {
        private const int SgsCdi = 4391;   // CDI, monthly
        private const int SgsIpca = 433;   // IPCA, monthly

        private static readonly TimeSpan CacheDuration = TimeSpan.FromHours(12);

        private readonly IHttpClientFactory _httpClientFactory;
        private readonly IMemoryCache _cache;

        public FixedIncomeAccrual(IHttpClientFactory httpClientFactory, IMemoryCache cache)
        {
            _httpClientFactory = httpClientFactory;
            _cache = cache;
        }

        /// <summary>
        /// How much one unit invested on <paramref name="from"/> is worth today: 1.0 when
        /// nothing has accrued yet, 1.08 after eight percent.
        /// </summary>
        /// <remarks>
        /// Returns exactly 1 whenever the series cannot be reached. A position showing its
        /// purchase price is obviously un-updated; one showing an invented yield is not.
        /// </remarks>
        public async Task<decimal> GetFactorAsync(
            EnumYieldIndex index,
            decimal ratePct,
            DateOnly from,
            DateOnly to,
            CancellationToken cancellationToken = default)
        {
            if (ratePct <= 0 || from >= to)
                return 1m;

            try
            {
                return index switch
                {
                    EnumYieldIndex.Prefixed => PrefixedFactor(ratePct, from, to),
                    EnumYieldIndex.Cdi => await IndexedFactorAsync(
                        SgsCdi, from, to, monthly => monthly * (ratePct / 100m), cancellationToken),
                    EnumYieldIndex.Ipca => await IndexedFactorAsync(
                        SgsIpca, from, to, monthly => monthly + MonthlyFromAnnual(ratePct), cancellationToken),
                    _ => 1m
                };
            }
            catch
            {
                // Network, shape change, anything: fall back to "no yield yet" rather than
                // guessing. The caller renders the invested amount, which is never wrong.
                return 1m;
            }
        }

        /// <summary>A flat annual rate compounded over the elapsed days.</summary>
        private static decimal PrefixedFactor(decimal annualRatePct, DateOnly from, DateOnly to)
        {
            var days = to.DayNumber - from.DayNumber;
            if (days <= 0) return 1m;

            return (decimal)Math.Pow(1 + (double)annualRatePct / 100, days / 365.0);
        }

        /// <summary>
        /// Compounds the monthly series between the two dates, with each month's published
        /// rate passed through <paramref name="adjust"/> — that is where "110% of it" or
        /// "plus a real spread" is applied.
        /// </summary>
        private async Task<decimal> IndexedFactorAsync(
            int series,
            DateOnly from,
            DateOnly to,
            Func<decimal, decimal> adjust,
            CancellationToken cancellationToken)
        {
            var monthly = await FetchMonthlyAsync(series, from, to, cancellationToken);
            if (monthly.Count == 0)
                return 1m;

            var factor = 1m;
            foreach (var (month, rate) in monthly)
            {
                // The purchase month is skipped: the position did not exist for all of it,
                // and crediting a whole month of yield to a partial one overstates.
                if (month <= new DateOnly(from.Year, from.Month, 1))
                    continue;

                factor *= 1 + adjust(rate) / 100m;
            }

            return factor;
        }

        private static decimal MonthlyFromAnnual(decimal annualPct) =>
            (decimal)(Math.Pow(1 + (double)annualPct / 100, 1.0 / 12) - 1) * 100m;

        private async Task<List<(DateOnly Month, decimal Rate)>> FetchMonthlyAsync(
            int series,
            DateOnly from,
            DateOnly to,
            CancellationToken cancellationToken)
        {
            var key = $"sgs:{series}:{from:yyyy-MM}:{to:yyyy-MM}";
            if (_cache.TryGetValue(key, out List<(DateOnly, decimal)>? cached) && cached is not null)
                return cached;

            var url = $"https://api.bcb.gov.br/dados/serie/bcdata.sgs.{series}/dados" +
                      $"?formato=json&dataInicial={from:dd/MM/yyyy}&dataFinal={to:dd/MM/yyyy}";

            using var client = _httpClientFactory.CreateClient();
            client.Timeout = TimeSpan.FromSeconds(20);

            var json = await client.GetStringAsync(url, cancellationToken);
            using var document = JsonDocument.Parse(json);

            var result = new List<(DateOnly, decimal)>();
            foreach (var element in document.RootElement.EnumerateArray())
            {
                var dateText = element.GetProperty("data").GetString();
                var valueText = element.GetProperty("valor").GetString();

                if (!DateOnly.TryParseExact(dateText, "dd/MM/yyyy", out var date))
                    continue;
                if (!decimal.TryParse(valueText, System.Globalization.NumberStyles.Any,
                        System.Globalization.CultureInfo.InvariantCulture, out var rate))
                    continue;

                result.Add((new DateOnly(date.Year, date.Month, 1), rate));
            }

            _cache.Set(key, result, CacheDuration);
            return result;
        }
    }
}

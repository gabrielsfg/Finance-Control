using System.Net;
using System.Text;
using System.Text.Json;
using System.Text.RegularExpressions;
using FinanceControl.Services.Brapi;
using FinanceControl.Services.Services;
using FinanceControl.Shared.Dtos.Request.Simulation;
using FinanceControl.Tests.Helpers;
using Microsoft.Extensions.Caching.Memory;
using Microsoft.Extensions.Options;
using Moq;

namespace FinanceControl.Tests.Unit
{
    // The simulator must flag every result that used the fixed fallback annual rates
    // because the BCB SGS series (CDI 4391, SELIC 4390, IPCA 433) were unavailable.
    public class SimulationFallbackTests
    {
        private const int SgsCdi = 4391;
        private const int SgsSelic = 4390;
        private const int SgsIpca = 433;

        private static readonly DateOnly Start = new(2024, 1, 1);
        private static readonly DateOnly End = new(2024, 6, 30);

        /// Stands in for the BCB SGS API: serves the configured months per series, 500 for any other series.
        private sealed class FakeBcbHandler : HttpMessageHandler
        {
            private readonly Dictionary<int, List<string>> _monthsBySeries = new();

            public FakeBcbHandler Serve(int series, params string[] monthKeys)
            {
                _monthsBySeries[series] = [.. monthKeys];
                return this;
            }

            protected override Task<HttpResponseMessage> SendAsync(HttpRequestMessage request, CancellationToken cancellationToken)
            {
                var match = Regex.Match(request.RequestUri!.AbsolutePath, @"bcdata\.sgs\.(\d+)");
                if (!match.Success || !_monthsBySeries.TryGetValue(int.Parse(match.Groups[1].Value), out var months))
                    return Task.FromResult(new HttpResponseMessage(HttpStatusCode.InternalServerError));

                // SGS format: [{ "data": "01/MM/yyyy", "valor": "1.00" }]
                var body = months.Select(key => new { data = $"01/{key[5..7]}/{key[..4]}", valor = "1.00" });
                return Task.FromResult(new HttpResponseMessage(HttpStatusCode.OK)
                {
                    Content = new StringContent(JsonSerializer.Serialize(body), Encoding.UTF8, "application/json")
                });
            }
        }

        private static SimulationService CreateService(FakeBcbHandler handler)
        {
            var factory = new Mock<IHttpClientFactory>();
            factory.Setup(f => f.CreateClient(It.IsAny<string>()))
                   .Returns(() => new HttpClient(handler, disposeHandler: false));

            return new SimulationService(
                factory.Object,
                new MemoryCache(new MemoryCacheOptions()),
                Options.Create(new BrapiSettings()),
                DbContextHelper.CreateInMemory());
        }

        private static string[] MonthsBetween(DateOnly from, DateOnly to)
        {
            var keys = new List<string>();
            for (var cursor = new DateOnly(from.Year, from.Month, 1); cursor <= to; cursor = cursor.AddMonths(1))
                keys.Add($"{cursor.Year:D4}-{cursor.Month:D2}");
            return [.. keys];
        }

        private static string[] LastTwelveMonths()
        {
            var today = DateOnly.FromDateTime(DateTime.UtcNow);
            return MonthsBetween(today.AddMonths(-12), today);
        }

        [Fact]
        public async Task BenchmarkRates_WhenBcbUnavailable_UsesFallbackRatesAndFlagsEverySeries()
        {
            var service = CreateService(new FakeBcbHandler());

            var rates = await service.GetBenchmarkRatesAsync();

            Assert.Equal(10.5m, rates.CdiAnnual);
            Assert.Equal(10.75m, rates.SelicAnnual);
            Assert.Equal(4.5m, rates.IpcaTrailing12m);
            Assert.Equal(new[] { "CDI", "SELIC", "IPCA" }, rates.FallbackSeries);
        }

        [Fact]
        public async Task BenchmarkRates_WhenOnlyOneSeriesFails_FlagsOnlyThatSeries()
        {
            var months = LastTwelveMonths();
            var service = CreateService(new FakeBcbHandler()
                .Serve(SgsSelic, months)
                .Serve(SgsIpca, months));

            var rates = await service.GetBenchmarkRatesAsync();

            Assert.Equal(new[] { "CDI" }, rates.FallbackSeries);
            Assert.Equal(10.5m, rates.CdiAnnual);
            Assert.NotEqual(10.75m, rates.SelicAnnual);
        }

        [Fact]
        public async Task BenchmarkRates_WhenBcbAvailable_HasNoFallback()
        {
            var months = LastTwelveMonths();
            var service = CreateService(new FakeBcbHandler()
                .Serve(SgsCdi, months)
                .Serve(SgsSelic, months)
                .Serve(SgsIpca, months));

            var rates = await service.GetBenchmarkRatesAsync();

            Assert.Empty(rates.FallbackSeries);
            Assert.True(rates.CdiAnnual > 0);
        }

        [Fact]
        public async Task Historical_WhenBcbUnavailable_FlagsCdiAsEstimated()
        {
            var service = CreateService(new FakeBcbHandler());

            var result = await service.GetHistoricalSimulationAsync("CDI", Start, End, 10000, 100000);

            Assert.True(result.IsPartialData);
            Assert.Equal(new[] { "CDI" }, result.FallbackSeries);
            Assert.NotNull(result.DataNote);
            Assert.Contains("10,5%", result.DataNote);
        }

        [Fact]
        public async Task Historical_WhenIpcaUnavailable_FlagsIpcaPlusAsEstimated()
        {
            var service = CreateService(new FakeBcbHandler());

            var result = await service.GetHistoricalSimulationAsync("IPCA+6", Start, End, 10000, 100000);

            Assert.True(result.IsPartialData);
            Assert.Equal(new[] { "IPCA+6" }, result.FallbackSeries);
        }

        [Fact]
        public async Task Historical_WhenOneMonthIsMissing_FlagsAndCountsTheFallbackMonth()
        {
            var months = MonthsBetween(Start, End).Take(5).ToArray(); // June missing
            var service = CreateService(new FakeBcbHandler().Serve(SgsCdi, months));

            var result = await service.GetHistoricalSimulationAsync("CDI", Start, End, 10000, 100000);

            Assert.True(result.IsPartialData);
            Assert.Equal(new[] { "CDI" }, result.FallbackSeries);
            Assert.Contains("1 de 6 meses", result.DataNote);
        }

        [Fact]
        public async Task Historical_WhenBcbCoversThePeriod_IsNotEstimated()
        {
            var service = CreateService(new FakeBcbHandler().Serve(SgsCdi, MonthsBetween(Start, End)));

            var result = await service.GetHistoricalSimulationAsync("CDI", Start, End, 10000, 100000);

            Assert.False(result.IsPartialData);
            Assert.Empty(result.FallbackSeries);
            Assert.Null(result.DataNote);
        }

        [Fact]
        public async Task PortfolioBacktest_WhenBcbUnavailable_FlagsTheFallbackSeries()
        {
            var service = CreateService(new FakeBcbHandler().Serve(SgsSelic, MonthsBetween(Start, End)));
            var assets = new List<PortfolioAssetInputDto>
            {
                new() { Ticker = "CDI",   WeightPct = 50 },
                new() { Ticker = "SELIC", WeightPct = 50 },
            };

            var result = await service.GetPortfolioBacktestAsync(assets, Start, End, 10000, 100000);

            Assert.True(result.IsPartialData);
            Assert.Equal(new[] { "CDI" }, result.FallbackSeries);
            Assert.NotNull(result.DataNote);
            Assert.Contains("CDI", result.DataNote);
        }

        [Fact]
        public async Task PortfolioBacktest_WhenBcbCoversThePeriod_IsNotEstimated()
        {
            var months = MonthsBetween(Start, End);
            var service = CreateService(new FakeBcbHandler().Serve(SgsCdi, months).Serve(SgsSelic, months));
            var assets = new List<PortfolioAssetInputDto>
            {
                new() { Ticker = "CDI",   WeightPct = 50 },
                new() { Ticker = "SELIC", WeightPct = 50 },
            };

            var result = await service.GetPortfolioBacktestAsync(assets, Start, End, 10000, 100000);

            Assert.False(result.IsPartialData);
            Assert.Empty(result.FallbackSeries);
            Assert.Null(result.DataNote);
        }
    }
}

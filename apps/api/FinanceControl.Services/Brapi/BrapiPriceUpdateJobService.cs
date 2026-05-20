using System.Text.Json;
using FinanceControl.Data.Data;
using FinanceControl.Domain.Entities;
using FinanceControl.Shared.Dtos.Response.Investment;
using FinanceControl.Shared.Enums;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;

namespace FinanceControl.Services.Brapi
{
    public class BrapiPriceUpdateJobService
    {
        private readonly IServiceScopeFactory _scopeFactory;
        private readonly ILogger<BrapiPriceUpdateJobService> _logger;
        private readonly BrapiSettings _settings;
        private readonly IHttpClientFactory _httpClientFactory;

        private static readonly HashSet<EnumAssetType> QuoteAssetTypes =
        [
            EnumAssetType.Acao, EnumAssetType.FII, EnumAssetType.BDR,
            EnumAssetType.ETF, EnumAssetType.Stock, EnumAssetType.Reit,
            EnumAssetType.ETFInternacional,
        ];

        private static readonly JsonSerializerOptions JsonOptions = new()
        {
            PropertyNameCaseInsensitive = true,
        };

        public BrapiJobStatusDto LastStatus { get; private set; } = new();

        public BrapiPriceUpdateJobService(
            IServiceScopeFactory scopeFactory,
            ILogger<BrapiPriceUpdateJobService> logger,
            IOptions<BrapiSettings> settings,
            IHttpClientFactory httpClientFactory)
        {
            _scopeFactory = scopeFactory;
            _logger = logger;
            _settings = settings.Value;
            _httpClientFactory = httpClientFactory;
        }

        public async Task RunAsync(CancellationToken cancellationToken)
        {
            _logger.LogInformation("BrapiPriceUpdateJob started at {Time} UTC", DateTime.UtcNow);

            var status = new BrapiJobStatusDto { LastRunAt = DateTime.UtcNow };

            await using var scope = _scopeFactory.CreateAsyncScope();
            var context = scope.ServiceProvider.GetRequiredService<ApplicationDbContext>();

            var allInvestments = await context.Investments
                .AsNoTracking()
                .ToListAsync(cancellationToken);

            var quoteGroup = allInvestments
                .Where(i => QuoteAssetTypes.Contains(i.AssetType))
                .GroupBy(i => i.Ticker)
                .Select(g => g.First())
                .ToList();

            var cryptoGroup = allInvestments
                .Where(i => i.AssetType == EnumAssetType.Cripto)
                .GroupBy(i => i.Ticker)
                .Select(g => g.First())
                .ToList();

            var semaphore = new SemaphoreSlim(_settings.MaxParallelBatches);

            var quoteBatches = quoteGroup.Chunk(_settings.BatchSize).ToList();
            var cryptoBatches = cryptoGroup.Chunk(_settings.BatchSize).ToList();

            var quoteTasks = quoteBatches.Select(batch =>
                ProcessWithSemaphoreAsync(semaphore, () => ProcessQuoteBatchAsync(context, batch, status, cancellationToken), cancellationToken));

            var cryptoTasks = cryptoBatches.Select(batch =>
                ProcessWithSemaphoreAsync(semaphore, () => ProcessCryptoBatchAsync(context, batch, status, cancellationToken), cancellationToken));

            await Task.WhenAll(quoteTasks.Concat(cryptoTasks));

            LastStatus = status;

            _logger.LogInformation(
                "BrapiPriceUpdateJob finished. Assets updated: {Assets}, dividends inserted: {Dividends}, errors: {Errors}",
                status.AssetsUpdated, status.DividendsInserted, status.ErrorCount);
        }

        private async Task ProcessWithSemaphoreAsync(SemaphoreSlim semaphore, Func<Task> action, CancellationToken cancellationToken)
        {
            await semaphore.WaitAsync(cancellationToken);
            try
            {
                await action();
            }
            finally
            {
                semaphore.Release();
            }
        }

        private async Task ProcessQuoteBatchAsync(
            ApplicationDbContext context,
            Investment[] batch,
            BrapiJobStatusDto status,
            CancellationToken cancellationToken)
        {
            var tickers = string.Join(",", batch.Select(i => i.Ticker));
            var isFirstRun = await HasAnyFirstRunAsync(context, batch, cancellationToken);
            var rangeParam = isFirstRun ? "&range=1y&interval=1d" : string.Empty;
            var url = $"https://brapi.dev/api/quote/{tickers}?dividends=true{rangeParam}&token={_settings.Token}";

            BrapiQuoteResponse? response = null;
            try
            {
                response = await FetchWithRetryAsync<BrapiQuoteResponse>(url, cancellationToken);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Quote batch failed for tickers: {Tickers}", tickers);
                lock (status.Errors)
                {
                    status.ErrorCount++;
                    status.Errors.Add($"Quote batch [{tickers}]: {ex.Message}");
                }
                return;
            }

            if (response?.Results is null) return;

            var today = DateOnly.FromDateTime(DateTime.UtcNow);

            foreach (var result in response.Results)
            {
                if (result.RegularMarketPrice is null) continue;

                var price = (long)Math.Round(result.RegularMarketPrice.Value * 100);

                var investments = await context.Investments
                    .Where(i => i.Ticker == result.Symbol)
                    .ToListAsync(cancellationToken);

                foreach (var inv in investments)
                {
                    inv.CurrentPrice = price;
                    inv.LastPriceUpdate = DateTime.UtcNow;
                    if (result.LogoUrl is not null) inv.LogoUrl = result.LogoUrl;
                    inv.Currency = result.Currency ?? "BRL";
                }

                await UpsertPriceHistoryAsync(context, investments, result.HistoricalDataPrice, today, isFirstRun, cancellationToken);

                if (result.DividendsData?.CashDividends is not null)
                {
                    foreach (var inv in investments)
                        await InsertNewDividendsAsync(context, inv, result.DividendsData.CashDividends, cancellationToken, status);
                }

                lock (status.Errors)
                {
                    status.AssetsUpdated += investments.Count;
                }
            }

            await context.SaveChangesAsync(cancellationToken);
        }

        private async Task ProcessCryptoBatchAsync(
            ApplicationDbContext context,
            Investment[] batch,
            BrapiJobStatusDto status,
            CancellationToken cancellationToken)
        {
            var coins = string.Join(",", batch.Select(i => i.Ticker));
            var isFirstRun = await HasAnyFirstRunAsync(context, batch, cancellationToken);
            var rangeParam = isFirstRun ? "&range=1y&interval=1d" : string.Empty;
            var url = $"https://brapi.dev/api/v2/crypto?coin={coins}{rangeParam}&token={_settings.Token}";

            BrapiCryptoResponse? response = null;
            try
            {
                response = await FetchWithRetryAsync<BrapiCryptoResponse>(url, cancellationToken);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Crypto batch failed for coins: {Coins}", coins);
                lock (status.Errors)
                {
                    status.ErrorCount++;
                    status.Errors.Add($"Crypto batch [{coins}]: {ex.Message}");
                }
                return;
            }

            if (response?.Coins is null) return;

            var today = DateOnly.FromDateTime(DateTime.UtcNow);

            foreach (var coin in response.Coins)
            {
                if (coin.RegularMarketPrice is null) continue;

                var price = (long)Math.Round(coin.RegularMarketPrice.Value * 100);

                var investments = await context.Investments
                    .Where(i => i.Ticker == coin.Coin)
                    .ToListAsync(cancellationToken);

                foreach (var inv in investments)
                {
                    inv.CurrentPrice = price;
                    inv.LastPriceUpdate = DateTime.UtcNow;
                    if (coin.CoinImageUrl is not null) inv.LogoUrl = coin.CoinImageUrl;
                    inv.Currency = coin.Currency ?? "BRL";
                }

                await UpsertPriceHistoryAsync(context, investments, coin.HistoricalDataPrice, today, isFirstRun, cancellationToken);

                status.AssetsUpdated += investments.Count;
            }

            await context.SaveChangesAsync(cancellationToken);
        }

        private static async Task UpsertPriceHistoryAsync(
            ApplicationDbContext context,
            List<Investment> investments,
            List<BrapiHistoricalPrice>? historicalData,
            DateOnly today,
            bool isFirstRun,
            CancellationToken cancellationToken)
        {
            foreach (var inv in investments)
            {
                if (isFirstRun && historicalData is not null)
                {
                    var existingDates = await context.InvestmentPriceHistories
                        .Where(h => h.InvestmentId == inv.Id)
                        .Select(h => h.Date)
                        .ToHashSetAsync(cancellationToken);

                    foreach (var point in historicalData)
                    {
                        if (point.Close is null) continue;
                        var date = DateOnly.FromDateTime(DateTimeOffset.FromUnixTimeSeconds(point.Date).UtcDateTime);
                        if (existingDates.Contains(date)) continue;

                        context.InvestmentPriceHistories.Add(new InvestmentPriceHistory
                        {
                            InvestmentId = inv.Id,
                            Date = date,
                            Price = (long)Math.Round(point.Close.Value * 100),
                        });
                    }
                }
                else
                {
                    var exists = await context.InvestmentPriceHistories
                        .AnyAsync(h => h.InvestmentId == inv.Id && h.Date == today, cancellationToken);

                    if (!exists)
                    {
                        context.InvestmentPriceHistories.Add(new InvestmentPriceHistory
                        {
                            InvestmentId = inv.Id,
                            Date = today,
                            Price = inv.CurrentPrice,
                        });
                    }
                }
            }
        }

        private static async Task InsertNewDividendsAsync(
            ApplicationDbContext context,
            Investment inv,
            List<BrapiCashDividend> cashDividends,
            CancellationToken cancellationToken,
            BrapiJobStatusDto status)
        {
            foreach (var cashDiv in cashDividends)
            {
                var paymentDate = TryParseDate(cashDiv.PaymentDate);
                var lastDatePrior = TryParseDate(cashDiv.LastDatePrior);
                var dividendType = cashDiv.Label == "JCP"
                    ? EnumDividendType.JurosCapitalProprio
                    : EnumDividendType.Dividend;

                var exists = await context.InvestmentDividends
                    .AnyAsync(d =>
                        d.InvestmentId == inv.Id &&
                        d.PaymentDate == paymentDate &&
                        d.Type == dividendType,
                        cancellationToken);

                if (exists) continue;

                context.InvestmentDividends.Add(new InvestmentDividend
                {
                    UserId = inv.UserId,
                    InvestmentId = inv.Id,
                    PaymentDate = paymentDate,
                    LastDatePrior = lastDatePrior,
                    Amount = (long)Math.Round(cashDiv.Rate * 100),
                    Type = dividendType,
                    LinkedTransactionId = null,
                });

                status.DividendsInserted++;
            }
        }

        private async Task<T?> FetchWithRetryAsync<T>(string url, CancellationToken cancellationToken)
        {
            using var client = _httpClientFactory.CreateClient();
            client.Timeout = TimeSpan.FromSeconds(_settings.TimeoutSeconds);

            try
            {
                return await FetchAsync<T>(client, url, cancellationToken);
            }
            catch
            {
                await Task.Delay(TimeSpan.FromMinutes(_settings.RetryDelayMinutes), cancellationToken);
                return await FetchAsync<T>(client, url, cancellationToken);
            }
        }

        private static async Task<T?> FetchAsync<T>(HttpClient client, string url, CancellationToken cancellationToken)
        {
            var response = await client.GetAsync(url, cancellationToken);
            response.EnsureSuccessStatusCode();
            var json = await response.Content.ReadAsStringAsync(cancellationToken);
            return JsonSerializer.Deserialize<T>(json, JsonOptions);
        }

        private static async Task<bool> HasAnyFirstRunAsync(
            ApplicationDbContext context,
            Investment[] batch,
            CancellationToken cancellationToken)
        {
            var ids = batch.Select(i => i.Id).ToList();
            var idsWithHistory = await context.InvestmentPriceHistories
                .Where(h => ids.Contains(h.InvestmentId))
                .Select(h => h.InvestmentId)
                .Distinct()
                .ToListAsync(cancellationToken);

            return idsWithHistory.Count < ids.Count;
        }

        private static DateOnly? TryParseDate(string? value)
        {
            if (string.IsNullOrWhiteSpace(value)) return null;
            return DateOnly.TryParse(value, out var date) ? date : null;
        }
    }
}

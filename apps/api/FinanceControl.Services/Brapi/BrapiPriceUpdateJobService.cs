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
            EnumAssetType.ETFInternacional, EnumAssetType.FundoInvestimento,
            EnumAssetType.Index,
        ];

        // Benchmark indices to track for simulations (not present in /quote/list stocks)
        private static readonly (string Ticker, string Name)[] BenchmarkIndices =
        [
            ("^BVSP", "Ibovespa"),
            ("IFIX", "Índice de Fundos Imobiliários"),
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

        // Called by the intraday worker every 15 minutes during market hours.
        // Updates CurrentPrice + writes one MarketPriceIntraday tick per asset.
        // Does NOT sync the asset universe or write daily history.
        public async Task RunIntradayAsync(CancellationToken cancellationToken)
        {
            _logger.LogInformation("BrapiIntradayJob started at {Time} UTC", DateTime.UtcNow);

            var status = new BrapiJobStatusDto
            {
                IsRunning = true,
                StartedAt = DateTime.UtcNow,
                LastRunAt = DateTime.UtcNow,
            };

            await using var scope = _scopeFactory.CreateAsyncScope();
            var context = scope.ServiceProvider.GetRequiredService<ApplicationDbContext>();

            var allAssets = await context.MarketAssets
                .AsNoTracking()
                .ToListAsync(cancellationToken);

            var quoteGroup = allAssets.Where(a => QuoteAssetTypes.Contains(a.AssetType)).ToList();
            var cryptoGroup = allAssets.Where(a => a.AssetType == EnumAssetType.Cripto).ToList();

            var semaphore = new SemaphoreSlim(_settings.MaxParallelBatches);

            var quoteTasks = quoteGroup.Chunk(_settings.BatchSize).Select(batch =>
                ProcessWithSemaphoreAsync(semaphore, async () =>
                {
                    await using var batchScope = _scopeFactory.CreateAsyncScope();
                    var batchCtx = batchScope.ServiceProvider.GetRequiredService<ApplicationDbContext>();
                    await ProcessQuoteBatchAsync(batchCtx, batch, status, cancellationToken, writeIntraday: true);
                }, cancellationToken));

            var cryptoTasks = cryptoGroup.Chunk(_settings.BatchSize).Select(batch =>
                ProcessWithSemaphoreAsync(semaphore, async () =>
                {
                    await using var batchScope = _scopeFactory.CreateAsyncScope();
                    var batchCtx = batchScope.ServiceProvider.GetRequiredService<ApplicationDbContext>();
                    await ProcessCryptoBatchAsync(batchCtx, batch, status, cancellationToken, writeIntraday: true);
                }, cancellationToken));

            await Task.WhenAll(quoteTasks.Concat(cryptoTasks));

            status.IsRunning = false;
            status.FinishedAt = DateTime.UtcNow;

            _logger.LogInformation(
                "BrapiIntradayJob finished in {Elapsed:mm\\:ss}. Assets updated: {Assets}, errors: {Errors}",
                status.FinishedAt - status.StartedAt, status.AssetsUpdated, status.ErrorCount);
        }

        public async Task RunAsync(CancellationToken cancellationToken)
        {
            _logger.LogInformation("BrapiPriceUpdateJob started at {Time} UTC", DateTime.UtcNow);

            var status = new BrapiJobStatusDto
            {
                IsRunning = true,
                StartedAt = DateTime.UtcNow,
                LastRunAt = DateTime.UtcNow,
            };
            LastStatus = status;

            await using var scope = _scopeFactory.CreateAsyncScope();
            var context = scope.ServiceProvider.GetRequiredService<ApplicationDbContext>();

            // Discover/refresh the full asset universe so every asset exists in our DB,
            // ready for search/buy/simulate without per-request Brapi calls.
            try
            {
                await SyncAssetUniverseAsync(context, status, cancellationToken);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Asset universe sync failed.");
                lock (status.Errors)
                {
                    status.ErrorCount++;
                    status.Errors.Add($"Universe sync: {ex.Message}");
                }
            }

            // Market assets are global and already unique per ticker — no grouping needed.
            var allAssets = await context.MarketAssets
                .AsNoTracking()
                .ToListAsync(cancellationToken);

            var quoteGroup = allAssets
                .Where(a => QuoteAssetTypes.Contains(a.AssetType))
                .ToList();

            var cryptoGroup = allAssets
                .Where(a => a.AssetType == EnumAssetType.Cripto)
                .ToList();

            var semaphore = new SemaphoreSlim(_settings.MaxParallelBatches);

            var quoteBatches = quoteGroup.Chunk(_settings.BatchSize).ToList();
            var cryptoBatches = cryptoGroup.Chunk(_settings.BatchSize).ToList();

            // Each batch gets its own scope+context — DbContext is not thread-safe.
            var quoteTasks = quoteBatches.Select(batch =>
                ProcessWithSemaphoreAsync(semaphore, async () =>
                {
                    await using var batchScope = _scopeFactory.CreateAsyncScope();
                    var batchCtx = batchScope.ServiceProvider.GetRequiredService<ApplicationDbContext>();
                    await ProcessQuoteBatchAsync(batchCtx, batch, status, cancellationToken);
                }, cancellationToken));

            var cryptoTasks = cryptoBatches.Select(batch =>
                ProcessWithSemaphoreAsync(semaphore, async () =>
                {
                    await using var batchScope = _scopeFactory.CreateAsyncScope();
                    var batchCtx = batchScope.ServiceProvider.GetRequiredService<ApplicationDbContext>();
                    await ProcessCryptoBatchAsync(batchCtx, batch, status, cancellationToken);
                }, cancellationToken));

            await Task.WhenAll(quoteTasks.Concat(cryptoTasks));

            status.IsRunning   = false;
            status.FinishedAt  = DateTime.UtcNow;
            LastStatus = status;

            _logger.LogInformation(
                "BrapiPriceUpdateJob finished in {Elapsed:mm\\:ss}. Assets updated: {Assets}, dividends inserted: {Dividends}, errors: {Errors}",
                status.FinishedAt - status.StartedAt, status.AssetsUpdated, status.DividendsInserted, status.ErrorCount);
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

        // Discovers the full B3 asset universe from /api/quote/list and upserts each as a
        // MarketAsset (name, type, logo, current price). Cheap metadata pass — full price
        // history is then backfilled by the batch logic. Also seeds benchmark indices.
        private async Task SyncAssetUniverseAsync(
            ApplicationDbContext context,
            BrapiJobStatusDto status,
            CancellationToken cancellationToken)
        {
            var existing = await context.MarketAssets.ToDictionaryAsync(a => a.Ticker, cancellationToken);
            var discovered = 0;

            const int limit = 200;
            var page = 1;
            while (page <= 2000) // safety bound
            {
                var url = $"https://brapi.dev/api/quote/list?limit={limit}&page={page}&token={_settings.Token}";
                var resp = await FetchWithRetryAsync<BrapiAssetListResponse>(url, cancellationToken);
                if (resp?.Stocks is null || resp.Stocks.Count == 0) break;

                foreach (var item in resp.Stocks)
                {
                    if (string.IsNullOrWhiteSpace(item.Stock)) continue;
                    var ticker = item.Stock.ToUpperInvariant();
                    var type = MapAssetType(item.SubType, item.Type);
                    var price = item.Close.HasValue ? (long)Math.Round(item.Close.Value * 100) : 0;

                    if (existing.TryGetValue(ticker, out var asset))
                    {
                        if (!string.IsNullOrWhiteSpace(item.Name)) asset.Name = item.Name;
                        asset.AssetType = type;
                        if (!string.IsNullOrWhiteSpace(item.Logo)) asset.LogoUrl = item.Logo;
                        if (price > 0) asset.CurrentPrice = price;
                    }
                    else
                    {
                        asset = new MarketAsset
                        {
                            Ticker = ticker,
                            Name = string.IsNullOrWhiteSpace(item.Name) ? ticker : item.Name,
                            AssetType = type,
                            CurrentPrice = price,
                            LogoUrl = item.Logo,
                            Currency = "BRL",
                        };
                        context.MarketAssets.Add(asset);
                        existing[ticker] = asset;
                        discovered++;
                    }
                }

                if (!resp.HasNextPage) break;
                page++;
            }

            // Seed benchmark indices (not present in /quote/list stocks)
            foreach (var (ticker, name) in BenchmarkIndices)
            {
                if (existing.ContainsKey(ticker)) continue;
                context.MarketAssets.Add(new MarketAsset
                {
                    Ticker = ticker,
                    Name = name,
                    AssetType = EnumAssetType.Index,
                    CurrentPrice = 0,
                    Currency = "BRL",
                });
                discovered++;
            }

            // Discover crypto coins from /api/v2/crypto/available
            try
            {
                var cryptoUrl = $"https://brapi.dev/api/v2/crypto/available?token={_settings.Token}";
                var cryptoResp = await FetchWithRetryAsync<BrapiCryptoAvailableResponse>(cryptoUrl, cancellationToken);
                if (cryptoResp?.Coins is not null)
                {
                    foreach (var coin in cryptoResp.Coins)
                    {
                        if (string.IsNullOrWhiteSpace(coin)) continue;
                        var ticker = coin.ToUpperInvariant();
                        if (existing.ContainsKey(ticker)) continue;

                        context.MarketAssets.Add(new MarketAsset
                        {
                            Ticker = ticker,
                            Name = ticker,
                            AssetType = EnumAssetType.Cripto,
                            CurrentPrice = 0,
                            Currency = "USD",
                        });
                        existing[ticker] = null!; // mark as added to avoid duplicates in loop
                        discovered++;
                    }
                }
            }
            catch (Exception ex)
            {
                _logger.LogWarning(ex, "Crypto universe discovery failed — continuing without it.");
            }

            await context.SaveChangesAsync(cancellationToken);
            status.AssetsDiscovered = discovered;
            _logger.LogInformation("Asset universe synced. New assets: {New}, total tracked: {Total}", discovered, existing.Count);
        }

        // Maps Brapi's subType (granular) / type (coarse) to our EnumAssetType.
        private static EnumAssetType MapAssetType(string? subType, string? type)
        {
            switch ((subType ?? string.Empty).ToLowerInvariant())
            {
                case "fii":      return EnumAssetType.FII;
                case "etf":      return EnumAssetType.ETF;
                case "bdr":      return EnumAssetType.BDR;
                case "unit":     return EnumAssetType.Acao;
                case "stock":    return EnumAssetType.Acao;
                case "fi-infra":
                case "fi-agro":
                case "fip":
                case "fidc":     return EnumAssetType.FundoInvestimento;
            }

            return (type ?? string.Empty).ToLowerInvariant() switch
            {
                "fund"  => EnumAssetType.FundoInvestimento,
                "bdr"   => EnumAssetType.BDR,
                "stock" => EnumAssetType.Acao,
                _       => EnumAssetType.Outro,
            };
        }

        private async Task ProcessQuoteBatchAsync(
            ApplicationDbContext context,
            MarketAsset[] batch,
            BrapiJobStatusDto status,
            CancellationToken cancellationToken,
            bool writeIntraday = false)
        {
            var tickers = string.Join(",", batch.Select(a => a.Ticker));
            var isFirstRun = await HasAnyFirstRunAsync(context, batch, cancellationToken);
            var rangeParam = isFirstRun ? $"&range={_settings.BackfillRange}&interval=1d" : string.Empty;
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

                var asset = await FindAssetBySymbolAsync(context, result.Symbol, cancellationToken);
                if (asset is null) continue;

                // One update to the shared market asset
                var newPrice = (long)Math.Round(result.RegularMarketPrice.Value * 100);
                asset.CurrentPrice = newPrice;
                asset.LastPriceUpdate = DateTime.UtcNow;
                if (result.LogoUrl is not null) asset.LogoUrl = result.LogoUrl;
                asset.Currency = result.Currency ?? "BRL";

                // One price-history row per asset per day (closing job only)
                await UpsertPriceHistoryAsync(context, asset, result.HistoricalDataPrice, today, isFirstRun, cancellationToken);

                if (writeIntraday)
                    await InsertIntradayTickAsync(context, asset, cancellationToken);

                // Dividends are per-user — insert one per owner of this asset
                if (result.DividendsData?.CashDividends is not null)
                {
                    var owners = await context.Investments
                        .Where(i => i.MarketAssetId == asset.Id)
                        .ToListAsync(cancellationToken);

                    foreach (var inv in owners)
                        await InsertNewDividendsAsync(context, inv, result.DividendsData.CashDividends, cancellationToken, status);
                }

                lock (status.Errors)
                {
                    status.AssetsUpdated++;
                }
            }

            await context.SaveChangesAsync(cancellationToken);
        }

        private async Task ProcessCryptoBatchAsync(
            ApplicationDbContext context,
            MarketAsset[] batch,
            BrapiJobStatusDto status,
            CancellationToken cancellationToken,
            bool writeIntraday = false)
        {
            var coins = string.Join(",", batch.Select(a => a.Ticker));
            var isFirstRun = await HasAnyFirstRunAsync(context, batch, cancellationToken);
            var rangeParam = isFirstRun ? $"&range={_settings.BackfillRange}&interval=1d" : string.Empty;
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

                var asset = await context.MarketAssets
                    .FirstOrDefaultAsync(a => a.Ticker == coin.Coin, cancellationToken);
                if (asset is null) continue;

                var newCoinPrice = (long)Math.Round(coin.RegularMarketPrice.Value * 100);
                asset.CurrentPrice = newCoinPrice;
                asset.LastPriceUpdate = DateTime.UtcNow;
                if (coin.CoinImageUrl is not null) asset.LogoUrl = coin.CoinImageUrl;
                asset.Currency = coin.Currency ?? "BRL";

                await UpsertPriceHistoryAsync(context, asset, coin.HistoricalDataPrice, today, isFirstRun, cancellationToken);

                if (writeIntraday)
                    await InsertIntradayTickAsync(context, asset, cancellationToken);

                status.AssetsUpdated++;
            }

            await context.SaveChangesAsync(cancellationToken);
        }

        private static async Task InsertIntradayTickAsync(
            ApplicationDbContext context,
            MarketAsset asset,
            CancellationToken cancellationToken)
        {
            // Truncate timestamp to the nearest 15-min slot for idempotency.
            var now = DateTime.UtcNow;
            var slot = new DateTime(now.Year, now.Month, now.Day, now.Hour,
                now.Minute / 15 * 15, 0, DateTimeKind.Utc);

            var exists = await context.MarketPriceIntradays
                .AnyAsync(h => h.MarketAssetId == asset.Id && h.Timestamp == slot, cancellationToken);

            if (!exists)
            {
                context.MarketPriceIntradays.Add(new MarketPriceIntraday
                {
                    MarketAssetId = asset.Id,
                    Timestamp = slot,
                    Price = asset.CurrentPrice,
                });
            }
        }

        private static async Task UpsertPriceHistoryAsync(
            ApplicationDbContext context,
            MarketAsset asset,
            List<BrapiHistoricalPrice>? historicalData,
            DateOnly today,
            bool isFirstRun,
            CancellationToken cancellationToken)
        {
            if (isFirstRun && historicalData is not null)
            {
                var existingDates = await context.MarketPriceHistories
                    .Where(h => h.MarketAssetId == asset.Id)
                    .Select(h => h.Date)
                    .ToHashSetAsync(cancellationToken);

                foreach (var point in historicalData)
                {
                    if (point.Close is null) continue;
                    var date = DateOnly.FromDateTime(DateTimeOffset.FromUnixTimeSeconds(point.Date).UtcDateTime);
                    if (existingDates.Contains(date)) continue;

                    context.MarketPriceHistories.Add(new MarketPriceHistory
                    {
                        MarketAssetId = asset.Id,
                        Date = date,
                        Price = (long)Math.Round(point.Close.Value * 100),
                    });
                }
            }
            else
            {
                var exists = await context.MarketPriceHistories
                    .AnyAsync(h => h.MarketAssetId == asset.Id && h.Date == today, cancellationToken);

                if (!exists)
                {
                    context.MarketPriceHistories.Add(new MarketPriceHistory
                    {
                        MarketAssetId = asset.Id,
                        Date = today,
                        Price = asset.CurrentPrice,
                    });
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

        // Brapi sometimes returns symbols with a ".SA" suffix (e.g. IFIX → IFIX.SA).
        // Match on the exact symbol first, then on the suffix-stripped form.
        private static async Task<MarketAsset?> FindAssetBySymbolAsync(
            ApplicationDbContext context, string symbol, CancellationToken cancellationToken)
        {
            var asset = await context.MarketAssets
                .FirstOrDefaultAsync(a => a.Ticker == symbol, cancellationToken);

            if (asset is null && symbol.EndsWith(".SA", StringComparison.OrdinalIgnoreCase))
            {
                var stripped = symbol[..^3];
                asset = await context.MarketAssets
                    .FirstOrDefaultAsync(a => a.Ticker == stripped, cancellationToken);
            }

            return asset;
        }

        private static async Task<bool> HasAnyFirstRunAsync(
            ApplicationDbContext context,
            MarketAsset[] batch,
            CancellationToken cancellationToken)
        {
            var ids = batch.Select(a => a.Id).ToList();
            var idsWithHistory = await context.MarketPriceHistories
                .Where(h => ids.Contains(h.MarketAssetId))
                .Select(h => h.MarketAssetId)
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

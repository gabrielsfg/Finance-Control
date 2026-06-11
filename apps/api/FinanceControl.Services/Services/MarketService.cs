using FinanceControl.Data.Data;
using FinanceControl.Domain.Entities;
using FinanceControl.Domain.Interfaces.Services;
using FinanceControl.Services.Brapi;
using FinanceControl.Shared.Dtos.Response.Investment;
using FinanceControl.Shared.Dtos.Response.Market;
using FinanceControl.Shared.Enums;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Caching.Memory;
using Microsoft.Extensions.Options;
using System.Globalization;
using System.Text;
using System.Text.Json;

namespace FinanceControl.Services.Services
{
    public class MarketService : IMarketService
    {
        private readonly IDbContextFactory<ApplicationDbContext> _contextFactory;
        private readonly IHttpClientFactory _httpClientFactory;
        private readonly BrapiSettings _brapiSettings;
        private readonly IMemoryCache _cache;

        private const string BrapiModules =
            "summaryProfile,defaultKeyStatistics,financialData,balanceSheetHistory";

        // Curated macro series shown in the market indicators strip, in display order.
        private static readonly string[] MacroSlugs = ["selic", "cdi", "ipca12m", "igpm"];

        private static readonly Dictionary<EnumAssetType, string> AssetTypeLabels = new()
        {
            { EnumAssetType.Acao,              "Ação" },
            { EnumAssetType.FundoInvestimento, "Fundo de Investimento" },
            { EnumAssetType.FII,               "FII" },
            { EnumAssetType.Cripto,            "Cripto" },
            { EnumAssetType.Stock,             "Stock" },
            { EnumAssetType.Reit,              "REIT" },
            { EnumAssetType.BDR,               "BDR" },
            { EnumAssetType.ETF,               "ETF" },
            { EnumAssetType.ETFInternacional,  "ETF Internacional" },
            { EnumAssetType.TesouroDireto,     "Tesouro Direto" },
            { EnumAssetType.RendaFixa,         "Renda Fixa" },
            { EnumAssetType.Index,             "Índice" },
            { EnumAssetType.Moeda,             "Moeda" },
            { EnumAssetType.Outro,             "Outro" },
        };

        public MarketService(
            IDbContextFactory<ApplicationDbContext> contextFactory,
            IHttpClientFactory httpClientFactory,
            IOptions<BrapiSettings> brapiSettings,
            IMemoryCache cache)
        {
            _contextFactory = contextFactory;
            _httpClientFactory = httpClientFactory;
            _brapiSettings = brapiSettings.Value;
            _cache = cache;
        }

        private static readonly HashSet<string> FundamentalSorts =
            ["dy_desc", "pl_asc", "pvp_asc", "marketcap_desc", "revenue_desc", "roe_desc"];

        public async Task<List<MarketAssetDto>> ListAsync(string? assetType, string sort, int limit)
        {
            await using var context = _contextFactory.CreateDbContext();

            EnumAssetType? parsedType = null;
            if (!string.IsNullOrWhiteSpace(assetType) &&
                Enum.TryParse<EnumAssetType>(assetType, out var pt))
                parsedType = pt;

            var isFundamentalSort = FundamentalSorts.Contains(sort);

            List<MarketAsset> assets;

            if (isFundamentalSort)
            {
                // Only show fundamentals data refreshed within the last 7 days so stale snapshots
                // never surface in rankings after an asset stops being covered by Brapi.
                var staleCutoff = DateTime.UtcNow.AddDays(-7);

                // Rank by a stored fundamental metric — order/limit in the DB via the join.
                var fq = context.MarketAssets
                    .Where(a => a.CurrentPrice > 0 && a.Fundamentals != null
                                && a.Fundamentals.FetchedAt >= staleCutoff);
                if (parsedType.HasValue)
                    fq = fq.Where(a => a.AssetType == parsedType.Value);

                var ordered = sort switch
                {
                    "dy_desc"        => fq.Where(a => a.Fundamentals!.DividendYield != null)
                                          .OrderByDescending(a => a.Fundamentals!.DividendYield),
                    "pl_asc"         => fq.Where(a => a.Fundamentals!.PriceToEarnings != null && a.Fundamentals!.PriceToEarnings > 0)
                                          .OrderBy(a => a.Fundamentals!.PriceToEarnings),
                    "pvp_asc"        => fq.Where(a => a.Fundamentals!.PriceToBook != null && a.Fundamentals!.PriceToBook > 0)
                                          .OrderBy(a => a.Fundamentals!.PriceToBook),
                    "marketcap_desc" => fq.Where(a => a.Fundamentals!.MarketCap != null)
                                          .OrderByDescending(a => a.Fundamentals!.MarketCap),
                    "revenue_desc"   => fq.Where(a => a.Fundamentals!.TotalRevenue != null)
                                          .OrderByDescending(a => a.Fundamentals!.TotalRevenue),
                    _                => fq.Where(a => a.Fundamentals!.ReturnOnEquity != null)
                                          .OrderByDescending(a => a.Fundamentals!.ReturnOnEquity),
                };

                assets = await ordered.Include(a => a.Fundamentals).Take(limit).ToListAsync();
            }
            else
            {
                // For change_desc/change_asc we need previous close, so fetch a larger pool to
                // filter down to assets that actually have two history points.
                var needsHistory = sort is "change_desc" or "change_asc";
                var poolSize = needsHistory ? limit * 5 : limit;

                var q = context.MarketAssets.Where(a => a.CurrentPrice > 0);
                if (parsedType.HasValue)
                    q = q.Where(a => a.AssetType == parsedType.Value);

                // Pull a pool ordered by price desc (good proxy for relevance / liquidity)
                assets = await q
                    .OrderByDescending(a => a.CurrentPrice)
                    .Take(poolSize)
                    .ToListAsync();
            }

            var assetIds = assets.Select(a => a.Id).ToList();

            var previousCloses = await context.MarketPriceHistories
                .Where(h => assetIds.Contains(h.MarketAssetId))
                .GroupBy(h => h.MarketAssetId)
                .Select(g => new
                {
                    MarketAssetId = g.Key,
                    PreviousClose = g.OrderByDescending(h => h.Date).Skip(1).Select(h => (long?)h.Price).FirstOrDefault(),
                })
                .ToListAsync();

            var prevCloseMap = previousCloses.ToDictionary(x => x.MarketAssetId, x => x.PreviousClose);

            var result = assets.Select(a =>
            {
                var prev = prevCloseMap.GetValueOrDefault(a.Id);
                var dayChangePct = prev.HasValue && prev.Value > 0
                    ? Math.Round((decimal)(a.CurrentPrice - prev.Value) / prev.Value * 100, 2)
                    : (decimal?)null;

                var f = a.Fundamentals;

                return new MarketAssetDto
                {
                    Id              = a.Id,
                    Ticker          = a.Ticker,
                    Name            = a.Name,
                    CoinName        = a.CoinName,
                    AssetType       = a.AssetType,
                    AssetClass      = AssetTypeLabels.GetValueOrDefault(a.AssetType, "Outro"),
                    LogoUrl         = a.LogoUrl,
                    Currency        = a.Currency,
                    CurrentPrice    = a.CurrentPrice,
                    LastPriceUpdate = a.LastPriceUpdate,
                    PreviousClose   = prev,
                    DayChangePct    = dayChangePct,
                    DividendYield   = f?.DividendYield,
                    PriceToEarnings = f?.PriceToEarnings,
                    PriceToBook     = f?.PriceToBook,
                    ReturnOnEquity  = f?.ReturnOnEquity,
                    MarketCap       = f?.MarketCap,
                    TotalRevenue    = f?.TotalRevenue,
                };
            });

            var sorted = sort switch
            {
                "change_desc" => result.Where(a => a.DayChangePct.HasValue)
                                       .OrderByDescending(a => a.DayChangePct)
                                       .Take(limit),
                "change_asc"  => result.Where(a => a.DayChangePct.HasValue)
                                       .OrderBy(a => a.DayChangePct)
                                       .Take(limit),
                "price_desc"  => result.OrderByDescending(a => a.CurrentPrice).Take(limit),
                _ when isFundamentalSort => result, // already ordered + limited by the DB
                _             => result.Take(limit),
            };

            return sorted.ToList();
        }

        // Portuguese names for ISO currency codes so "BRL-USD" (stored with no descriptive
        // name in the DB) still matches when the user types "dolar" or "real".
        private static readonly Dictionary<string, string> CurrencyNames =
            new(StringComparer.OrdinalIgnoreCase)
            {
                ["USD"] = "dolar americano",
                ["EUR"] = "euro",
                ["GBP"] = "libra esterlina",
                ["JPY"] = "iene japones",
                ["BRL"] = "real brasileiro",
                ["ARS"] = "peso argentino",
                ["CAD"] = "dolar canadense",
                ["AUD"] = "dolar australiano",
                ["CHF"] = "franco suico",
                ["CNY"] = "yuan chines",
                ["MXN"] = "peso mexicano",
                ["CLP"] = "peso chileno",
                ["COP"] = "peso colombiano",
                ["PEN"] = "sol peruano",
                ["UYU"] = "peso uruguaio",
                ["ZAR"] = "rand sul africano",
                ["RUB"] = "rublo russo",
                ["INR"] = "rupia indiana",
                ["KRW"] = "won coreano",
                ["NOK"] = "coroa norueguesa",
                ["SEK"] = "coroa sueca",
                ["DKK"] = "coroa dinamarquesa",
                ["NZD"] = "dolar nova zelandia",
                ["TRY"] = "lira turca",
                ["SGD"] = "dolar cingapura",
                ["HKD"] = "dolar hong kong",
                ["BTC"] = "bitcoin",
                ["ETH"] = "ethereum",
            };

        private static bool MatchesCurrencyAlias(string ticker, string qNorm)
        {
            foreach (var code in ticker.Split(['-', '/'], StringSplitOptions.RemoveEmptyEntries))
                if (CurrencyNames.TryGetValue(code, out var alias) &&
                    StripDiacritics(alias).Contains(qNorm, StringComparison.OrdinalIgnoreCase))
                    return true;
            return false;
        }

        // Strip diacritics so "dolar" matches "Dólar", "real" matches "Réal", etc.
        private static string StripDiacritics(string text)
        {
            var normalized = text.Normalize(NormalizationForm.FormD);
            var sb = new StringBuilder(normalized.Length);
            foreach (var c in normalized)
                if (CharUnicodeInfo.GetUnicodeCategory(c) != UnicodeCategory.NonSpacingMark)
                    sb.Append(c);
            return sb.ToString().Normalize(NormalizationForm.FormC);
        }

        public async Task<List<MarketAssetDto>> SearchAsync(string query)
        {
            await using var context = _contextFactory.CreateDbContext();

            var q = query.Trim().ToUpperInvariant();

            var assets = await context.MarketAssets
                .Where(a =>
                    a.Ticker.ToUpper().Contains(q) ||
                    a.Name.ToUpper().Contains(q) ||
                    (a.CoinName != null && a.CoinName.ToUpper().Contains(q)))
                .OrderBy(a => a.Ticker)
                .Take(20)
                .ToListAsync();

            // Secondary in-memory pass with accent-stripped comparison so that "dolar"
            // matches "Dólar Americano/Real Brasileiro". The query is never accented (user
            // types without diacritics), but the stored names are — so strip both sides and
            // always run this pass for Moeda assets.
            var qNorm = StripDiacritics(q);
            var existingIds = assets.Select(a => a.Id).ToHashSet();
            var currencyCandidates = await context.MarketAssets
                .Where(a => a.AssetType == EnumAssetType.Moeda)
                .ToListAsync();
            var extraCurrencies = currencyCandidates.Where(a =>
                !existingIds.Contains(a.Id) &&
                (StripDiacritics(a.Name.ToUpperInvariant()).Contains(qNorm) ||
                 StripDiacritics(a.Ticker.ToUpperInvariant()).Contains(qNorm) ||
                 MatchesCurrencyAlias(a.Ticker, qNorm)));
            assets = [.. assets, .. extraCurrencies];

            var assetIds = assets.Select(a => a.Id).ToList();

            // Fetch previous close for each asset to compute day change %
            var previousCloses = await context.MarketPriceHistories
                .Where(h => assetIds.Contains(h.MarketAssetId))
                .GroupBy(h => h.MarketAssetId)
                .Select(g => new
                {
                    MarketAssetId = g.Key,
                    PreviousClose = g.OrderByDescending(h => h.Date).Skip(1).Select(h => (long?)h.Price).FirstOrDefault(),
                })
                .ToListAsync();

            var prevCloseMap = previousCloses.ToDictionary(x => x.MarketAssetId, x => x.PreviousClose);

            return assets.Select(a =>
            {
                var prev = prevCloseMap.GetValueOrDefault(a.Id);
                var dayChangePct = prev.HasValue && prev.Value > 0
                    ? Math.Round((decimal)(a.CurrentPrice - prev.Value) / prev.Value * 100, 2)
                    : (decimal?)null;

                return new MarketAssetDto
                {
                    Id              = a.Id,
                    Ticker          = a.Ticker,
                    Name            = a.Name,
                    CoinName        = a.CoinName,
                    AssetType       = a.AssetType,
                    AssetClass      = AssetTypeLabels.GetValueOrDefault(a.AssetType, "Outro"),
                    LogoUrl         = a.LogoUrl,
                    Currency        = a.Currency,
                    CurrentPrice    = a.CurrentPrice,
                    LastPriceUpdate = a.LastPriceUpdate,
                    PreviousClose   = prev,
                    DayChangePct    = dayChangePct,
                };
            }).ToList();
        }

        public async Task<MarketAssetDetailDto> GetDetailAsync(string ticker)
        {
            await using var context = _contextFactory.CreateDbContext();

            var t = ticker.Trim().ToUpperInvariant();

            var asset = await context.MarketAssets
                .FirstOrDefaultAsync(a => a.Ticker == t)
                ?? throw new KeyNotFoundException($"Ticker {ticker} not found.");

            var history = await context.MarketPriceHistories
                .Where(h => h.MarketAssetId == asset.Id)
                .OrderBy(h => h.Date)
                .Select(h => new InvestmentPriceHistoryDto
                {
                    Date  = h.Date,
                    Price = h.Price,
                })
                .ToListAsync();

            var previousClose = history.Count >= 2 ? history[^2].Price : (long?)null;
            var dayChangePct = previousClose.HasValue && previousClose.Value > 0
                ? Math.Round((decimal)(asset.CurrentPrice - previousClose.Value) / previousClose.Value * 100, 2)
                : (decimal?)null;

            return new MarketAssetDetailDto
            {
                Id              = asset.Id,
                Ticker          = asset.Ticker,
                Name            = asset.Name,
                CoinName        = asset.CoinName,
                AssetType       = asset.AssetType,
                AssetClass      = AssetTypeLabels.GetValueOrDefault(asset.AssetType, "Outro"),
                LogoUrl         = asset.LogoUrl,
                Currency        = asset.Currency,
                CurrentPrice    = asset.CurrentPrice,
                LastPriceUpdate = asset.LastPriceUpdate,
                PreviousClose   = previousClose,
                DayChangePct    = dayChangePct,
                PriceHistory    = history,
            };
        }

        public async Task<FundamentalsDto> GetFundamentalsAsync(string ticker)
        {
            var t = ticker.Trim().ToUpperInvariant();
            var cacheKey = $"fundamentals_{t}";

            if (_cache.TryGetValue(cacheKey, out FundamentalsDto? cached) && cached is not null)
                return cached;

            if (string.IsNullOrEmpty(_brapiSettings.Token))
                throw new InvalidOperationException("Brapi token not configured.");

            using var client = _httpClientFactory.CreateClient();
            client.Timeout = TimeSpan.FromSeconds(15);

            var url = $"https://brapi.dev/api/quote/{t}?modules={BrapiModules}&dividends=true&token={_brapiSettings.Token}";
            var json = await client.GetStringAsync(url);
            var doc = JsonDocument.Parse(json);

            if (!doc.RootElement.TryGetProperty("results", out var results) || results.GetArrayLength() == 0)
                throw new KeyNotFoundException($"No fundamentals data found for ticker {t}.");

            var r = results[0];

            var dto = new FundamentalsDto { Ticker = t, FetchedAt = DateTime.UtcNow };

            var hasStats = r.TryGetProperty("defaultKeyStatistics", out var stats);
            var hasFin   = r.TryGetProperty("financialData", out var fin);

            // Top-level quote fields (returned regardless of modules)
            dto.CompanyName      = GetString(r, "longName");
            dto.PriceToEarnings  = GetDecimal(r, "priceEarnings") ?? (hasStats ? GetDecimal(stats, "trailingPE") : null);
            dto.EarningsPerShare = GetDecimal(r, "earningsPerShare") ?? (hasStats ? GetDecimal(stats, "trailingEps") : null);
            dto.MarketCap        = GetLong(r, "marketCap");

            // summaryProfile
            if (r.TryGetProperty("summaryProfile", out var profile))
            {
                dto.Sector            = GetString(profile, "sector");
                dto.Industry          = GetString(profile, "industry");
                dto.Website           = GetString(profile, "website");
                dto.BusinessSummary   = GetString(profile, "longBusinessSummary");
                dto.FullTimeEmployees = GetInt(profile, "fullTimeEmployees");
                dto.AdministratorName = GetString(profile, "administratorName");
            }

            // defaultKeyStatistics
            if (hasStats)
            {
                dto.PriceToBook       = GetDecimal(stats, "priceToBook");
                dto.DividendYield     = GetDecimal(stats, "dividendYield");
                dto.Beta              = GetDecimal(stats, "beta");
                dto.EnterpriseValue   = GetDecimal(stats, "enterpriseValue");
                dto.AnnualNetIncome   = GetDecimal(stats, "netIncomeToCommon");
                dto.BookValue         = GetDecimal(stats, "bookValue");
                dto.SharesOutstanding = GetLong(stats, "sharesOutstanding");
            }

            // financialData (ROE/ROA live here, not in defaultKeyStatistics)
            if (hasFin)
            {
                dto.Ebitda           = GetDecimal(fin, "ebitda");
                dto.TotalRevenue     = GetDecimal(fin, "totalRevenue");
                dto.GrossMargin      = GetDecimal(fin, "grossMargins");
                dto.EbitdaMargin     = GetDecimal(fin, "ebitdaMargins");
                dto.OperatingMargin  = GetDecimal(fin, "operatingMargins");
                dto.ProfitMargin     = GetDecimal(fin, "profitMargins");
                dto.ReturnOnEquity   = GetDecimal(fin, "returnOnEquity");
                dto.ReturnOnAssets   = GetDecimal(fin, "returnOnAssets");
                dto.DebtToEquity     = GetDecimal(fin, "debtToEquity");
                dto.TotalCash        = GetDecimal(fin, "totalCash");
                dto.TotalDebt        = GetDecimal(fin, "totalDebt");
                dto.FreeCashflow     = GetDecimal(fin, "freeCashflow");
                // DRE (TTM) sourced from financialData
                dto.AnnualRevenue     = GetDecimal(fin, "totalRevenue");
                dto.AnnualGrossProfit = GetDecimal(fin, "grossProfits");
            }

            // balanceSheetHistory is a flat array of yearly statements (most recent first)
            if (r.TryGetProperty("balanceSheetHistory", out var bsArr) &&
                bsArr.ValueKind == JsonValueKind.Array &&
                bsArr.GetArrayLength() > 0)
            {
                var bs = bsArr[0];
                dto.TotalAssets            = GetDecimal(bs, "totalAssets");
                dto.TotalLiabilities       = GetDecimal(bs, "totalLiab");
                // brapi often returns totalStockholderEquity null but fills shareholdersEquity
                dto.TotalStockholderEquity = GetDecimal(bs, "totalStockholderEquity") ?? GetDecimal(bs, "shareholdersEquity");
                dto.Cash                   = GetDecimal(bs, "cash");
                dto.LongTermDebt           = GetDecimal(bs, "longTermDebt") ?? GetDecimal(bs, "longTermLoansAndFinancing");
            }

            // dividendsData — recent dividends/yields (especially relevant for FIIs)
            if (r.TryGetProperty("dividendsData", out var divData) &&
                divData.TryGetProperty("cashDividends", out var cashDivs) &&
                cashDivs.ValueKind == JsonValueKind.Array)
            {
                dto.RecentDividends = cashDivs.EnumerateArray()
                    .Take(12)
                    .Select(d => new FundamentalDividendDto
                    {
                        PaymentDate = TryParseDate(GetString(d, "paymentDate")),
                        Rate        = GetDecimal(d, "rate") ?? 0,
                        Label       = GetString(d, "label") ?? string.Empty,
                    })
                    .ToList();
            }

            _cache.Set(cacheKey, dto, TimeSpan.FromHours(6));
            return dto;
        }

        public async Task<FiiIndicatorsDto> GetFiiIndicatorsAsync(string ticker)
        {
            var t = ticker.Trim().ToUpperInvariant();
            var cacheKey = $"fii_indicators_{t}";

            if (_cache.TryGetValue(cacheKey, out FiiIndicatorsDto? cached) && cached is not null)
                return cached;

            if (string.IsNullOrEmpty(_brapiSettings.Token))
                throw new InvalidOperationException("Brapi token not configured.");

            using var client = _httpClientFactory.CreateClient();
            client.Timeout = TimeSpan.FromSeconds(15);

            var url = $"https://brapi.dev/api/v2/fii/list?symbols={t}&token={_brapiSettings.Token}";
            var json = await client.GetStringAsync(url);

            var resp = JsonSerializer.Deserialize<BrapiFiiListResponse>(json);
            var fii = resp?.Fiis?.FirstOrDefault();
            if (fii is null)
                throw new KeyNotFoundException($"No FII data found for ticker {t}.");

            var dto = new FiiIndicatorsDto
            {
                Ticker            = t,
                Name              = fii.Name,
                SegmentType       = fii.SegmentType,
                Segment           = fii.SegmentoAtuacao,
                ManagementType    = fii.TipoGestao,
                Mandate           = fii.Mandate,
                AdministratorName = fii.AdministratorName,
                Price             = fii.Price,
                NavPerShare       = fii.NavPerShare,
                PriceToNav        = fii.PriceToNav,
                DividendYield12m  = fii.DividendYield12m,
                TotalInvestors    = fii.TotalInvestors,
                FetchedAt         = DateTime.UtcNow,
            };

            _cache.Set(cacheKey, dto, TimeSpan.FromHours(6));
            return dto;
        }

        public async Task<List<MacroIndicatorDto>> GetMacroIndicatorsAsync()
        {
            const string cacheKey = "market_macro_indicators";
            if (_cache.TryGetValue(cacheKey, out List<MacroIndicatorDto>? cached) && cached is not null)
                return cached;

            if (string.IsNullOrEmpty(_brapiSettings.Token))
                throw new InvalidOperationException("Brapi token not configured.");

            using var client = _httpClientFactory.CreateClient();
            client.Timeout = TimeSpan.FromSeconds(15);

            var symbols = string.Join(",", MacroSlugs);
            var url = $"https://brapi.dev/api/v2/macro?symbols={symbols}&sortOrder=desc&limit=2&token={_brapiSettings.Token}";
            var json = await client.GetStringAsync(url);

            var resp = JsonSerializer.Deserialize<BrapiMacroResponse>(json);
            var bySlug = (resp?.Results ?? [])
                .Where(r => !string.IsNullOrWhiteSpace(r.Series?.Slug))
                .GroupBy(r => r.Series!.Slug!, StringComparer.OrdinalIgnoreCase)
                .ToDictionary(g => g.Key, g => g.First(), StringComparer.OrdinalIgnoreCase);

            var indicators = new List<MacroIndicatorDto>();
            foreach (var slug in MacroSlugs)
            {
                if (!bySlug.TryGetValue(slug, out var r) || r.Observations is null || r.Observations.Count == 0)
                    continue;

                // sortOrder=desc → observations[0] is the most recent.
                var obs = r.Observations;
                indicators.Add(new MacroIndicatorDto
                {
                    Slug          = slug,
                    Name          = r.Series?.Name ?? slug,
                    Unit          = r.Series?.Unit,
                    Value         = obs[0].Value,
                    Date          = obs[0].Date,
                    PreviousValue = obs.Count > 1 ? obs[1].Value : null,
                });
            }

            _cache.Set(cacheKey, indicators, TimeSpan.FromHours(6));
            return indicators;
        }

        private static DateOnly? TryParseDate(string? value)
        {
            if (string.IsNullOrWhiteSpace(value)) return null;
            return DateTimeOffset.TryParse(value, out var dto) ? DateOnly.FromDateTime(dto.UtcDateTime) : null;
        }

        private static string? GetString(JsonElement el, string key) =>
            el.TryGetProperty(key, out var v) && v.ValueKind == JsonValueKind.String ? v.GetString() : null;

        private static decimal? GetDecimal(JsonElement el, string key)
        {
            if (!el.TryGetProperty(key, out var v)) return null;
            if (v.ValueKind == JsonValueKind.Number && v.TryGetDecimal(out var d)) return d;
            return null;
        }

        private static long? GetLong(JsonElement el, string key)
        {
            if (!el.TryGetProperty(key, out var v)) return null;
            if (v.ValueKind == JsonValueKind.Number && v.TryGetInt64(out var l)) return l;
            return null;
        }

        private static int? GetInt(JsonElement el, string key)
        {
            if (!el.TryGetProperty(key, out var v)) return null;
            if (v.ValueKind == JsonValueKind.Number && v.TryGetInt32(out var i)) return i;
            return null;
        }
    }
}

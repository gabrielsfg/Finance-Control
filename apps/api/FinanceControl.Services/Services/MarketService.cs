using FinanceControl.Data.Data;
using FinanceControl.Domain.Interfaces.Services;
using FinanceControl.Shared.Dtos.Response.Investment;
using FinanceControl.Shared.Dtos.Response.Market;
using FinanceControl.Shared.Enums;
using Microsoft.EntityFrameworkCore;

namespace FinanceControl.Services.Services
{
    public class MarketService : IMarketService
    {
        private readonly IDbContextFactory<ApplicationDbContext> _contextFactory;

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
            { EnumAssetType.Outro,             "Outro" },
        };

        public MarketService(IDbContextFactory<ApplicationDbContext> contextFactory)
        {
            _contextFactory = contextFactory;
        }

        public async Task<List<MarketAssetDto>> SearchAsync(string query)
        {
            await using var context = _contextFactory.CreateDbContext();

            var q = query.Trim().ToUpperInvariant();

            var assets = await context.Investments
                .Where(i =>
                    i.Ticker.ToUpper().Contains(q) ||
                    i.Name.ToUpper().Contains(q))
                .GroupBy(i => i.Ticker)
                .Select(g => g.OrderByDescending(i => i.LastPriceUpdate).First())
                .OrderBy(i => i.Ticker)
                .Take(20)
                .ToListAsync();

            var tickers = assets.Select(a => a.Ticker).ToList();

            // Fetch previous close for each ticker to compute day change %
            var previousCloses = await context.InvestmentPriceHistories
                .Where(h => tickers.Contains(h.Investment.Ticker))
                .GroupBy(h => h.Investment.Ticker)
                .Select(g => new
                {
                    Ticker = g.Key,
                    PreviousClose = g.OrderByDescending(h => h.Date).Skip(1).Select(h => (long?)h.Price).FirstOrDefault(),
                })
                .ToListAsync();

            var prevCloseMap = previousCloses.ToDictionary(x => x.Ticker, x => x.PreviousClose);

            return assets.Select(a =>
            {
                var prev = prevCloseMap.GetValueOrDefault(a.Ticker);
                var dayChangePct = prev.HasValue && prev.Value > 0
                    ? Math.Round((decimal)(a.CurrentPrice - prev.Value) / prev.Value * 100, 2)
                    : (decimal?)null;

                return new MarketAssetDto
                {
                    Id              = a.Id,
                    Ticker          = a.Ticker,
                    Name            = a.Name,
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

            var asset = await context.Investments
                .Where(i => i.Ticker == t)
                .OrderByDescending(i => i.LastPriceUpdate)
                .FirstOrDefaultAsync()
                ?? throw new KeyNotFoundException($"Ticker {ticker} not found.");

            var history = await context.InvestmentPriceHistories
                .Where(h => h.InvestmentId == asset.Id)
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
    }
}

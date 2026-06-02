using FinanceControl.Data.Data;
using FinanceControl.Domain.Entities;
using FinanceControl.Domain.Interfaces.Services;
using FinanceControl.Shared.Dtos.Request;
using FinanceControl.Shared.Dtos.Response.Investment;
using FinanceControl.Shared.Enums;
using Microsoft.EntityFrameworkCore;

namespace FinanceControl.Services.Services
{
    public class InvestmentService : IInvestmentService
    {
        private readonly IDbContextFactory<ApplicationDbContext> _contextFactory;

        // Colors assigned per asset type for allocation charts
        private static readonly Dictionary<EnumAssetType, string> AssetTypeColors = new()
        {
            { EnumAssetType.Acao,              "#00C98D" },
            { EnumAssetType.FundoInvestimento, "#4A9EFF" },
            { EnumAssetType.FII,               "#F5A623" },
            { EnumAssetType.Cripto,            "#F25F5C" },
            { EnumAssetType.Stock,             "#00D4A0" },
            { EnumAssetType.Reit,              "#7C6FE0" },
            { EnumAssetType.BDR,               "#F5CE42" },
            { EnumAssetType.ETF,               "#4A9EFF" },
            { EnumAssetType.ETFInternacional,  "#7C6FE0" },
            { EnumAssetType.TesouroDireto,     "#00C98D" },
            { EnumAssetType.RendaFixa,         "#4A9EFF" },
            { EnumAssetType.Outro,             "#8A95A3" },
        };

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

        public InvestmentService(IDbContextFactory<ApplicationDbContext> contextFactory)
        {
            _contextFactory = contextFactory;
        }

        public async Task<InvestmentPortfolioDto> GetPortfolioAsync(int userId)
        {
            await using var context = _contextFactory.CreateDbContext();

            var investments = await context.Investments
                .Include(i => i.MarketAsset)
                .Where(i => i.UserId == userId && i.CurrentQuantity > 0)
                .OrderBy(i => i.MarketAsset.Ticker)
                .ToListAsync();

            return BuildPortfolio(investments);
        }

        public async Task<InvestmentDto> GetByIdAsync(int id, int userId)
        {
            await using var context = _contextFactory.CreateDbContext();

            var investment = await context.Investments
                .Include(i => i.MarketAsset)
                .FirstOrDefaultAsync(i => i.Id == id && i.UserId == userId)
                ?? throw new KeyNotFoundException($"Investment {id} not found.");

            return MapToDto(investment);
        }

        public async Task<List<InvestmentTransactionDto>> GetTransactionsAsync(int investmentId, int userId)
        {
            await using var context = _contextFactory.CreateDbContext();

            return await context.InvestmentTransactions
                .Include(t => t.Investment).ThenInclude(i => i.MarketAsset)
                .Where(t => t.InvestmentId == investmentId && t.UserId == userId)
                .OrderByDescending(t => t.Date)
                .Select(t => new InvestmentTransactionDto
                {
                    Id           = t.Id,
                    InvestmentId = t.InvestmentId,
                    Ticker       = t.Investment.MarketAsset.Ticker,
                    Name         = t.Investment.MarketAsset.Name,
                    Operation    = t.Operation,
                    Date         = t.Date,
                    Quantity     = t.Quantity,
                    UnitPrice    = t.UnitPrice,
                    OtherCosts   = t.OtherCosts,
                    TotalValue   = t.TotalValue,
                })
                .ToListAsync();
        }

        public async Task<List<InvestmentDividendDto>> GetDividendsAsync(int investmentId, int userId)
        {
            await using var context = _contextFactory.CreateDbContext();

            return await context.InvestmentDividends
                .Include(d => d.Investment).ThenInclude(i => i.MarketAsset)
                .Where(d => d.InvestmentId == investmentId && d.UserId == userId)
                .OrderByDescending(d => d.PaymentDate)
                .Select(d => new InvestmentDividendDto
                {
                    Id            = d.Id,
                    InvestmentId  = d.InvestmentId,
                    Ticker        = d.Investment.MarketAsset.Ticker,
                    PaymentDate   = d.PaymentDate,
                    LastDatePrior = d.LastDatePrior,
                    Amount        = d.Amount,
                    Type          = d.Type,
                })
                .ToListAsync();
        }

        public async Task<List<InvestmentPriceHistoryDto>> GetPriceHistoryAsync(int investmentId, int userId)
        {
            await using var context = _contextFactory.CreateDbContext();

            var marketAssetId = await context.Investments
                .Where(i => i.Id == investmentId && i.UserId == userId)
                .Select(i => (int?)i.MarketAssetId)
                .FirstOrDefaultAsync();

            if (marketAssetId is null)
                throw new KeyNotFoundException($"Investment {investmentId} not found.");

            return await context.MarketPriceHistories
                .Where(h => h.MarketAssetId == marketAssetId.Value)
                .OrderBy(h => h.Date)
                .Select(h => new InvestmentPriceHistoryDto
                {
                    Date  = h.Date,
                    Price = h.Price,
                })
                .ToListAsync();
        }

        public async Task<InvestmentPortfolioDto> RegisterTransactionAsync(int userId, CreateInvestmentTransactionRequestDto dto)
        {
            await using var context = _contextFactory.CreateDbContext();

            var totalValue = (long)Math.Round(dto.Quantity * dto.UnitPrice) + dto.OtherCosts;
            var ticker = dto.Ticker.ToUpperInvariant();

            // Find or create the GLOBAL market asset (shared across all users)
            var asset = await context.MarketAssets
                .FirstOrDefaultAsync(a => a.Ticker == ticker);

            if (asset is null)
            {
                asset = new MarketAsset
                {
                    Ticker       = ticker,
                    Name         = dto.Name,
                    AssetType    = dto.AssetType,
                    CurrentPrice = dto.UnitPrice,
                };
                context.MarketAssets.Add(asset);
                await context.SaveChangesAsync();
            }
            else if (asset.LastPriceUpdate is null)
            {
                // No market price yet (job never ran for it) — use the latest trade price as a best guess.
                asset.CurrentPrice = dto.UnitPrice;
            }

            // Find the user's existing position for this asset or create a new one
            var investment = await context.Investments
                .Include(i => i.MarketAsset)
                .FirstOrDefaultAsync(i => i.UserId == userId && i.MarketAssetId == asset.Id);

            if (investment is null)
            {
                if (dto.Operation == EnumInvestmentOperation.Sell)
                    throw new InvalidOperationException("Cannot sell an asset that does not exist in the portfolio.");

                investment = new Investment
                {
                    UserId          = userId,
                    MarketAssetId   = asset.Id,
                    Broker          = dto.Broker,
                    CurrentQuantity = 0,
                    AveragePrice    = 0,
                    AccountId       = dto.AccountId,
                    MarketAsset     = asset,
                };
                context.Investments.Add(investment);
                await context.SaveChangesAsync();
            }

            // Create the linked financial transaction (money leaving/entering the account)
            var linkedTransaction = new Transaction
            {
                UserId        = userId,
                AccountId     = dto.AccountId,
                Value         = (int)Math.Min(totalValue, int.MaxValue),
                Type          = dto.Operation == EnumInvestmentOperation.Buy
                                    ? EnumTransactionType.Expense
                                    : EnumTransactionType.Income,
                Description   = dto.Operation == EnumInvestmentOperation.Buy
                                    ? $"Compra: {asset.Ticker}"
                                    : $"Venda: {asset.Ticker}",
                TransactionDate = dto.Date,
                PaymentType   = EnumPaymentType.OneTime,
                SubCategoryId = await GetInvestmentSubCategoryIdAsync(context, userId),
            };
            context.Transactions.Add(linkedTransaction);
            await context.SaveChangesAsync();

            // Create the investment transaction record
            var investmentTransaction = new InvestmentTransaction
            {
                UserId            = userId,
                InvestmentId      = investment.Id,
                Operation         = dto.Operation,
                Date              = dto.Date,
                Quantity          = dto.Quantity,
                UnitPrice         = dto.UnitPrice,
                OtherCosts        = dto.OtherCosts,
                TotalValue        = totalValue,
                LinkedTransactionId = linkedTransaction.Id,
            };
            context.InvestmentTransactions.Add(investmentTransaction);

            // Recalculate position
            if (dto.Operation == EnumInvestmentOperation.Buy)
            {
                // Weighted average price: (currentQty * avgPrice + newQty * unitPrice + otherCosts) / (currentQty + newQty)
                var newTotalCost = (decimal)(investment.CurrentQuantity * investment.AveragePrice)
                                   + (decimal)dto.Quantity * dto.UnitPrice
                                   + dto.OtherCosts;
                var newTotalQty = investment.CurrentQuantity + dto.Quantity;
                investment.AveragePrice    = newTotalQty > 0 ? (long)Math.Round(newTotalCost / newTotalQty) : 0;
                investment.CurrentQuantity = newTotalQty;
            }
            else
            {
                if (dto.Quantity > investment.CurrentQuantity)
                    throw new InvalidOperationException("Sell quantity exceeds current position.");

                // Selling does not change the average price — only reduces quantity
                investment.CurrentQuantity -= dto.Quantity;
            }

            await context.SaveChangesAsync();

            return await BuildPortfolioFromDbAsync(context, userId);
        }

        public async Task<InvestmentPortfolioDto> DeleteTransactionAsync(int transactionId, int userId)
        {
            await using var context = _contextFactory.CreateDbContext();

            var tx = await context.InvestmentTransactions
                .Include(t => t.Investment)
                .FirstOrDefaultAsync(t => t.Id == transactionId && t.UserId == userId)
                ?? throw new KeyNotFoundException($"Investment transaction {transactionId} not found.");

            var investment = tx.Investment;

            // Reverse the position effect
            if (tx.Operation == EnumInvestmentOperation.Buy)
            {
                investment.CurrentQuantity -= tx.Quantity;
                // Recalculate average price from remaining transactions
                var remainingBuys = await context.InvestmentTransactions
                    .Where(t => t.InvestmentId == investment.Id && t.Operation == EnumInvestmentOperation.Buy && t.Id != transactionId)
                    .ToListAsync();

                if (remainingBuys.Count > 0)
                {
                    var totalCost = remainingBuys.Sum(t => (decimal)t.Quantity * t.UnitPrice + t.OtherCosts);
                    var totalQty  = remainingBuys.Sum(t => t.Quantity);
                    investment.AveragePrice = totalQty > 0 ? (long)Math.Round(totalCost / totalQty) : 0;
                }
                else
                {
                    investment.AveragePrice = 0;
                }
            }
            else
            {
                // Reversing a sell: add the quantity back
                investment.CurrentQuantity += tx.Quantity;
            }

            // Remove the linked financial transaction if it exists
            if (tx.LinkedTransactionId.HasValue)
            {
                var linked = await context.Transactions.FindAsync(tx.LinkedTransactionId.Value);
                if (linked is not null)
                    context.Transactions.Remove(linked);
            }

            context.InvestmentTransactions.Remove(tx);
            await context.SaveChangesAsync();

            return await BuildPortfolioFromDbAsync(context, userId);
        }

        public async Task<InvestmentPortfolioDto> RegisterDividendAsync(int userId, CreateInvestmentDividendRequestDto dto)
        {
            await using var context = _contextFactory.CreateDbContext();

            var investment = await context.Investments
                .Include(i => i.MarketAsset)
                .FirstOrDefaultAsync(i => i.Id == dto.InvestmentId && i.UserId == userId)
                ?? throw new KeyNotFoundException($"Investment {dto.InvestmentId} not found.");

            var transactionDate = dto.PaymentDate ?? DateOnly.FromDateTime(DateTime.UtcNow);

            // Create the linked income transaction (dividend entering the account)
            var linkedTransaction = new Transaction
            {
                UserId          = userId,
                AccountId       = dto.AccountId,
                Value           = (int)Math.Min(dto.Amount, int.MaxValue),
                Type            = EnumTransactionType.Income,
                Description     = $"Dividendo: {investment.MarketAsset.Ticker}",
                TransactionDate = transactionDate,
                PaymentType     = EnumPaymentType.OneTime,
                SubCategoryId   = await GetDividendSubCategoryIdAsync(context, userId),
            };
            context.Transactions.Add(linkedTransaction);
            await context.SaveChangesAsync();

            var dividend = new InvestmentDividend
            {
                UserId              = userId,
                InvestmentId        = dto.InvestmentId,
                PaymentDate         = dto.PaymentDate,
                LastDatePrior       = dto.LastDatePrior,
                Amount              = dto.Amount,
                Type                = dto.Type,
                LinkedTransactionId = linkedTransaction.Id,
            };
            context.InvestmentDividends.Add(dividend);
            await context.SaveChangesAsync();

            return await BuildPortfolioFromDbAsync(context, userId);
        }

        public async Task<InvestmentDto> UpdatePriceAsync(int investmentId, int userId, UpdateInvestmentPriceRequestDto dto)
        {
            await using var context = _contextFactory.CreateDbContext();

            var investment = await context.Investments
                .Include(i => i.MarketAsset)
                .FirstOrDefaultAsync(i => i.Id == investmentId && i.UserId == userId)
                ?? throw new KeyNotFoundException($"Investment {investmentId} not found.");

            // Manual price update applies to the shared market asset.
            investment.MarketAsset.CurrentPrice    = dto.CurrentPrice;
            investment.MarketAsset.LastPriceUpdate = DateTime.UtcNow;

            await context.SaveChangesAsync();

            return MapToDto(investment);
        }

        // ── Helpers ───────────────────────────────────────────────────────────

        private static InvestmentDto MapToDto(Investment i)
        {
            var asset         = i.MarketAsset;
            var currentValue  = (long)Math.Round(i.CurrentQuantity * asset.CurrentPrice);
            var totalInvested = (long)Math.Round(i.CurrentQuantity * i.AveragePrice);
            var totalReturn   = currentValue - totalInvested;
            var returnPct     = totalInvested > 0
                ? Math.Round((decimal)totalReturn / totalInvested * 100, 2)
                : 0m;

            // Day change: currentPrice vs previousClose (per-unit), scaled to position size
            long dayChangeAbs = 0;
            decimal dayChangePct = 0m;
            if (asset.PreviousClose is { } prevClose && prevClose > 0)
            {
                var unitChange = asset.CurrentPrice - prevClose;
                dayChangeAbs = (long)Math.Round(i.CurrentQuantity * unitChange);
                dayChangePct = Math.Round((decimal)unitChange / prevClose * 100, 2);
            }

            return new InvestmentDto
            {
                Id                 = i.Id,
                Ticker             = asset.Ticker,
                Name               = asset.Name,
                AssetType          = asset.AssetType,
                AssetClass         = AssetTypeLabels.GetValueOrDefault(asset.AssetType, "Outro"),
                Broker             = i.Broker,
                CurrentQuantity    = i.CurrentQuantity,
                AveragePrice       = i.AveragePrice,
                CurrentPrice       = asset.CurrentPrice,
                CurrentValue       = currentValue,
                TotalInvested      = totalInvested,
                TotalReturn        = totalReturn,
                TotalReturnPercent = returnPct,
                PreviousClose      = asset.PreviousClose,
                DayChangeAbs       = dayChangeAbs,
                DayChangePct       = dayChangePct,
                LastPriceUpdate    = asset.LastPriceUpdate,
                MaturityDate       = i.MaturityDate,
                ExpectedYieldPct   = i.ExpectedYieldPct,
                AccountId          = i.AccountId,
                LogoUrl            = asset.LogoUrl,
                Currency           = asset.Currency,
            };
        }

        private static InvestmentPortfolioDto BuildPortfolio(List<Investment> investments)
        {
            var dtos = investments.Select(MapToDto).ToList();

            var totalCurrentValue  = dtos.Sum(d => d.CurrentValue);
            var totalInvested      = dtos.Sum(d => d.TotalInvested);
            var totalReturn        = totalCurrentValue - totalInvested;
            var totalReturnPercent = totalInvested > 0
                ? Math.Round((decimal)totalReturn / totalInvested * 100, 2)
                : 0m;

            var allocations = dtos
                .GroupBy(d => d.AssetType)
                .Select(g =>
                {
                    var value = g.Sum(d => d.CurrentValue);
                    return new AllocationDto
                    {
                        AssetType  = g.Key,
                        AssetClass = AssetTypeLabels.GetValueOrDefault(g.Key, "Outro"),
                        Value      = value,
                        Percent    = totalCurrentValue > 0
                            ? Math.Round((decimal)value / totalCurrentValue * 100, 1)
                            : 0m,
                        Color      = AssetTypeColors.GetValueOrDefault(g.Key, "#8A95A3"),
                    };
                })
                .OrderByDescending(a => a.Value)
                .ToList();

            return new InvestmentPortfolioDto
            {
                Investments        = dtos,
                CurrentValue       = totalCurrentValue,
                TotalInvested      = totalInvested,
                TotalReturn        = totalReturn,
                TotalReturnPercent = totalReturnPercent,
                Allocations        = allocations,
            };
        }

        private static async Task<InvestmentPortfolioDto> BuildPortfolioFromDbAsync(ApplicationDbContext context, int userId)
        {
            var investments = await context.Investments
                .Include(i => i.MarketAsset)
                .Where(i => i.UserId == userId && i.CurrentQuantity > 0)
                .OrderBy(i => i.MarketAsset.Ticker)
                .ToListAsync();

            return BuildPortfolio(investments);
        }

        // Resolves the SubCategoryId for investment-related subcategories.
        // Falls back to the first available subcategory if the seed names are not found.
        private static async Task<int> GetInvestmentSubCategoryIdAsync(ApplicationDbContext context, int userId)
        {
            var subCategoryId = await context.SubCategories
                .Where(s => s.Category.UserId == userId && s.Name == "investments")
                .Select(s => (int?)s.Id)
                .FirstOrDefaultAsync();

            if (subCategoryId.HasValue) return subCategoryId.Value;

            // Fallback: any subcategory belonging to this user
            return await context.SubCategories
                .Where(s => s.Category.UserId == userId)
                .Select(s => s.Id)
                .FirstAsync();
        }

        private static async Task<int> GetDividendSubCategoryIdAsync(ApplicationDbContext context, int userId)
        {
            var subCategoryId = await context.SubCategories
                .Where(s => s.Category.UserId == userId && s.Name == "dividends")
                .Select(s => (int?)s.Id)
                .FirstOrDefaultAsync();

            if (subCategoryId.HasValue) return subCategoryId.Value;

            return await context.SubCategories
                .Where(s => s.Category.UserId == userId)
                .Select(s => s.Id)
                .FirstAsync();
        }
    }
}

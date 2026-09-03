using FinanceControl.Data.Data;
using FinanceControl.Domain.Entities;
using FinanceControl.Domain.Interfaces.Services;
using FinanceControl.Shared.Dtos.Request;
using FinanceControl.Shared.Dtos.Response.Investment;
using FinanceControl.Services.Investments;
using FinanceControl.Shared.Enums;
using Microsoft.EntityFrameworkCore;

namespace FinanceControl.Services.Services
{
    public class InvestmentService : IInvestmentService
    {
        private readonly IDbContextFactory<ApplicationDbContext> _contextFactory;
        private readonly FixedIncomeAccrual _accrual;

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

        public InvestmentService(
            IDbContextFactory<ApplicationDbContext> contextFactory,
            FixedIncomeAccrual accrual)
        {
            _contextFactory = contextFactory;
            _accrual = accrual;
        }

        public async Task<InvestmentPortfolioDto> GetPortfolioAsync(int userId)
        {
            await using var context = _contextFactory.CreateDbContext();

            var investments = await context.Investments
                .Include(i => i.MarketAsset)
                .Where(i => i.UserId == userId && i.CurrentQuantity > 0)
                .OrderBy(i => i.MarketAsset.Ticker)
                .ToListAsync();

            var assetIds = investments.Select(i => i.MarketAssetId).ToList();
            var prevCloseMap = await LoadPrevCloseMapAsync(context, assetIds);

            return BuildPortfolio(investments, prevCloseMap);
        }

        public async Task<InvestmentDto> GetByIdAsync(int id, int userId)
        {
            await using var context = _contextFactory.CreateDbContext();

            var investment = await context.Investments
                .Include(i => i.MarketAsset)
                .FirstOrDefaultAsync(i => i.Id == id && i.UserId == userId)
                ?? throw new KeyNotFoundException($"Investment {id} not found.");

            var prevClose = await context.MarketPriceHistories
                .Where(h => h.MarketAssetId == investment.MarketAssetId)
                .OrderByDescending(h => h.Date)
                .Skip(1)
                .Select(h => (long?)h.Price)
                .FirstOrDefaultAsync();

            return MapToDto(investment, prevClose);
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
            // Atomic + retry-safe: a fresh context per attempt inside the execution strategy,
            // and one transaction wrapping every write so a concurrency conflict (xmin) — or any
            // failure — rolls the whole operation back instead of leaving an orphan linked
            // financial transaction behind.
            await using var strategyContext = _contextFactory.CreateDbContext();
            var strategy = strategyContext.Database.CreateExecutionStrategy();
            return await strategy.ExecuteAsync(async () =>
            {
                await using var context = _contextFactory.CreateDbContext();
                await using var dbTx = await context.Database.BeginTransactionAsync();
                var portfolio = await RegisterTransactionCoreAsync(context, userId, dto);
                await dbTx.CommitAsync();
                return portfolio;
            });
        }

        private async Task<InvestmentPortfolioDto> RegisterTransactionCoreAsync(ApplicationDbContext context, int userId, CreateInvestmentTransactionRequestDto dto)
        {
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
                    YieldIndex      = dto.YieldIndex,
                    ExpectedYieldPct = dto.YieldRatePct,
                    MaturityDate    = dto.MaturityDate,
                };
                context.Investments.Add(investment);
                await context.SaveChangesAsync();
            }
            else if (dto.YieldIndex.HasValue && investment.YieldIndex is null)
            {
                // The rate may arrive on a later contribution to a position registered
                // before this field existed; taking it then beats leaving it unvalued.
                investment.YieldIndex = dto.YieldIndex;
                investment.ExpectedYieldPct = dto.YieldRatePct;
                investment.MaturityDate ??= dto.MaturityDate;
            }

            // The financial side of the operation — money leaving or entering the account.
            // Skipped when the user is registering a position they already held: that
            // purchase's cash movement happened long ago, and inventing one now puts an
            // expense on a date the account balance never saw.
            Transaction? linkedTransaction = null;

            if (dto.CreateLinkedTransaction)
            {
                linkedTransaction = new Transaction
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
            }

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
                LinkedTransactionId = linkedTransaction?.Id,
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
            await using var strategyContext = _contextFactory.CreateDbContext();
            var strategy = strategyContext.Database.CreateExecutionStrategy();
            return await strategy.ExecuteAsync(async () =>
            {
                await using var context = _contextFactory.CreateDbContext();
                await using var dbTx = await context.Database.BeginTransactionAsync();
                var portfolio = await DeleteTransactionCoreAsync(context, transactionId, userId);
                await dbTx.CommitAsync();
                return portfolio;
            });
        }

        private async Task<InvestmentPortfolioDto> DeleteTransactionCoreAsync(ApplicationDbContext context, int transactionId, int userId)
        {
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

            // The money entering the account. Skipped when the payout was already
            // received: it is in the ledger already, and a second entry double-counts it.
            Transaction? linkedTransaction = null;

            if (dto.CreateLinkedTransaction)
            {
                linkedTransaction = new Transaction
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
            }

            var dividend = new InvestmentDividend
            {
                UserId              = userId,
                InvestmentId        = dto.InvestmentId,
                PaymentDate         = dto.PaymentDate,
                LastDatePrior       = dto.LastDatePrior,
                Amount              = dto.Amount,
                Type                = dto.Type,
                LinkedTransactionId = linkedTransaction?.Id,
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

            var prevClose = await context.MarketPriceHistories
                .Where(h => h.MarketAssetId == investment.MarketAssetId)
                .OrderByDescending(h => h.Date)
                .Skip(1)
                .Select(h => (long?)h.Price)
                .FirstOrDefaultAsync();

            return MapToDto(investment, prevClose);
        }

        // ── Helpers ───────────────────────────────────────────────────────────

        /// <param name="accruedUnitPrice">
        /// For fixed income, what one unit is worth today after the yield the position
        /// earned. Null for anything the market quotes, which uses the asset's own price.
        /// </param>
        private static InvestmentDto MapToDto(Investment i, long? previousClose, long? accruedUnitPrice = null)
        {
            var asset         = i.MarketAsset;
            var unitPrice     = accruedUnitPrice ?? asset.CurrentPrice;
            var currentValue  = (long)Math.Round(i.CurrentQuantity * unitPrice);
            var totalInvested = (long)Math.Round(i.CurrentQuantity * i.AveragePrice);
            var totalReturn   = currentValue - totalInvested;
            var returnPct     = totalInvested > 0
                ? Math.Round((decimal)totalReturn / totalInvested * 100, 2)
                : 0m;

            long dayChangeAbs = 0;
            decimal dayChangePct = 0m;
            // Fixed income has no previous close to compare against, and comparing an
            // accrued price to a stale market one would invent a daily swing.
            if (accruedUnitPrice is null && previousClose is { } prevClose && prevClose > 0)
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
                CurrentPrice       = unitPrice,
                CurrentValue       = currentValue,
                TotalInvested      = totalInvested,
                TotalReturn        = totalReturn,
                TotalReturnPercent = returnPct,
                PreviousClose      = previousClose,
                DayChangeAbs       = dayChangeAbs,
                DayChangePct       = dayChangePct,
                LastPriceUpdate    = asset.LastPriceUpdate,
                MaturityDate       = i.MaturityDate,
                ExpectedYieldPct   = i.ExpectedYieldPct,
                YieldIndex         = i.YieldIndex,
                AccountId          = i.AccountId,
                LogoUrl            = asset.LogoUrl,
                Currency           = asset.Currency,
            };
        }

        private static InvestmentPortfolioDto BuildPortfolio(
            List<Investment> investments,
            Dictionary<int, long?> prevCloseMap,
            Dictionary<int, long>? accruedMap = null)
        {
            var dtos = investments
                .Select(i => MapToDto(
                    i,
                    prevCloseMap.GetValueOrDefault(i.MarketAssetId),
                    accruedMap is not null && accruedMap.TryGetValue(i.Id, out var accrued) ? accrued : null))
                .ToList();

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

        private async Task<InvestmentPortfolioDto> BuildPortfolioFromDbAsync(ApplicationDbContext context, int userId)
        {
            var investments = await context.Investments
                .Include(i => i.MarketAsset)
                .Where(i => i.UserId == userId && i.CurrentQuantity > 0)
                .OrderBy(i => i.MarketAsset.Ticker)
                .ToListAsync();

            var assetIds = investments.Select(i => i.MarketAssetId).ToList();
            var prevCloseMap = await LoadPrevCloseMapAsync(context, assetIds);
            var accruedMap = await BuildAccruedPriceMapAsync(context, investments);

            return BuildPortfolio(investments, prevCloseMap, accruedMap);
        }

        /// <summary>
        /// Today's unit price for every position whose yield is configured, keyed by
        /// investment id. A CDB has no quote to fetch, so its worth is derived from the
        /// rate the user agreed to and the index it follows.
        /// </summary>
        private async Task<Dictionary<int, long>> BuildAccruedPriceMapAsync(
            ApplicationDbContext context, List<Investment> investments)
        {
            var configured = investments
                .Where(i => i.YieldIndex.HasValue && i.ExpectedYieldPct is > 0)
                .ToList();

            if (configured.Count == 0)
                return [];

            // The first purchase is when the money started earning.
            var firstBuys = await context.InvestmentTransactions
                .Where(t => configured.Select(c => c.Id).Contains(t.InvestmentId)
                            && t.Operation == EnumInvestmentOperation.Buy)
                .GroupBy(t => t.InvestmentId)
                .Select(g => new { InvestmentId = g.Key, Start = g.Min(t => t.Date) })
                .ToDictionaryAsync(x => x.InvestmentId, x => x.Start);

            var today = DateOnly.FromDateTime(DateTime.UtcNow);
            var result = new Dictionary<int, long>();

            foreach (var investment in configured)
            {
                if (!firstBuys.TryGetValue(investment.Id, out var start))
                    continue;

                var factor = await _accrual.GetFactorAsync(
                    investment.YieldIndex!.Value, investment.ExpectedYieldPct!.Value, start, today);

                result[investment.Id] = (long)Math.Round(investment.AveragePrice * factor);
            }

            return result;
        }

        private static async Task<Dictionary<int, long?>> LoadPrevCloseMapAsync(ApplicationDbContext context, List<int> assetIds)
        {
            var result = await context.MarketPriceHistories
                .Where(h => assetIds.Contains(h.MarketAssetId))
                .GroupBy(h => h.MarketAssetId)
                .Select(g => new
                {
                    MarketAssetId = g.Key,
                    PreviousClose = g.OrderByDescending(h => h.Date).Skip(1).Select(h => (long?)h.Price).FirstOrDefault(),
                })
                .ToListAsync();

            return result.ToDictionary(x => x.MarketAssetId, x => x.PreviousClose);
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

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
                .Where(i => i.UserId == userId && i.CurrentQuantity > 0)
                .OrderBy(i => i.Ticker)
                .ToListAsync();

            return BuildPortfolio(investments);
        }

        public async Task<InvestmentDto> GetByIdAsync(int id, int userId)
        {
            await using var context = _contextFactory.CreateDbContext();

            var investment = await context.Investments
                .FirstOrDefaultAsync(i => i.Id == id && i.UserId == userId)
                ?? throw new KeyNotFoundException($"Investment {id} not found.");

            return MapToDto(investment);
        }

        public async Task<List<InvestmentTransactionDto>> GetTransactionsAsync(int investmentId, int userId)
        {
            await using var context = _contextFactory.CreateDbContext();

            return await context.InvestmentTransactions
                .Where(t => t.InvestmentId == investmentId && t.UserId == userId)
                .Include(t => t.Investment)
                .OrderByDescending(t => t.Date)
                .Select(t => new InvestmentTransactionDto
                {
                    Id           = t.Id,
                    InvestmentId = t.InvestmentId,
                    Ticker       = t.Investment.Ticker,
                    Name         = t.Investment.Name,
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
                .Where(d => d.InvestmentId == investmentId && d.UserId == userId)
                .Include(d => d.Investment)
                .OrderByDescending(d => d.Date)
                .Select(d => new InvestmentDividendDto
                {
                    Id           = d.Id,
                    InvestmentId = d.InvestmentId,
                    Ticker       = d.Investment.Ticker,
                    Date         = d.Date,
                    Amount       = d.Amount,
                    Type         = d.Type,
                })
                .ToListAsync();
        }

        public async Task<InvestmentPortfolioDto> RegisterTransactionAsync(int userId, CreateInvestmentTransactionRequestDto dto)
        {
            await using var context = _contextFactory.CreateDbContext();

            var totalValue = (long)Math.Round(dto.Quantity * dto.UnitPrice) + dto.OtherCosts;

            // Find existing position for this ticker or create a new one
            var investment = await context.Investments
                .FirstOrDefaultAsync(i => i.UserId == userId && i.Ticker == dto.Ticker.ToUpperInvariant());

            if (investment is null)
            {
                if (dto.Operation == EnumInvestmentOperation.Sell)
                    throw new InvalidOperationException("Cannot sell an asset that does not exist in the portfolio.");

                investment = new Investment
                {
                    UserId          = userId,
                    Ticker          = dto.Ticker.ToUpperInvariant(),
                    Name            = dto.Name,
                    AssetType       = dto.AssetType,
                    Broker          = dto.Broker,
                    CurrentQuantity = 0,
                    AveragePrice    = 0,
                    CurrentPrice    = dto.UnitPrice,
                    AccountId       = dto.AccountId,
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
                                    ? $"Compra: {investment.Ticker}"
                                    : $"Venda: {investment.Ticker}",
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
                investment.CurrentPrice    = dto.UnitPrice;
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
                .FirstOrDefaultAsync(i => i.Id == dto.InvestmentId && i.UserId == userId)
                ?? throw new KeyNotFoundException($"Investment {dto.InvestmentId} not found.");

            // Create the linked income transaction (dividend entering the account)
            var linkedTransaction = new Transaction
            {
                UserId          = userId,
                AccountId       = dto.AccountId,
                Value           = (int)Math.Min(dto.Amount, int.MaxValue),
                Type            = EnumTransactionType.Income,
                Description     = $"Dividendo: {investment.Ticker}",
                TransactionDate = dto.Date,
                PaymentType     = EnumPaymentType.OneTime,
                SubCategoryId   = await GetDividendSubCategoryIdAsync(context, userId),
            };
            context.Transactions.Add(linkedTransaction);
            await context.SaveChangesAsync();

            var dividend = new InvestmentDividend
            {
                UserId              = userId,
                InvestmentId        = dto.InvestmentId,
                Date                = dto.Date,
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
                .FirstOrDefaultAsync(i => i.Id == investmentId && i.UserId == userId)
                ?? throw new KeyNotFoundException($"Investment {investmentId} not found.");

            investment.CurrentPrice    = dto.CurrentPrice;
            investment.LastPriceUpdate = DateTime.UtcNow;

            await context.SaveChangesAsync();

            return MapToDto(investment);
        }

        // ── Helpers ───────────────────────────────────────────────────────────

        private static InvestmentDto MapToDto(Investment i)
        {
            var currentValue  = (long)Math.Round(i.CurrentQuantity * i.CurrentPrice);
            var totalInvested = (long)Math.Round(i.CurrentQuantity * i.AveragePrice);
            var totalReturn   = currentValue - totalInvested;
            var returnPct     = totalInvested > 0
                ? Math.Round((decimal)totalReturn / totalInvested * 100, 2)
                : 0m;

            return new InvestmentDto
            {
                Id                = i.Id,
                Ticker            = i.Ticker,
                Name              = i.Name,
                AssetType         = i.AssetType,
                AssetClass        = AssetTypeLabels.GetValueOrDefault(i.AssetType, "Outro"),
                Broker            = i.Broker,
                CurrentQuantity   = i.CurrentQuantity,
                AveragePrice      = i.AveragePrice,
                CurrentPrice      = i.CurrentPrice,
                CurrentValue      = currentValue,
                TotalInvested     = totalInvested,
                TotalReturn       = totalReturn,
                TotalReturnPercent = returnPct,
                LastPriceUpdate   = i.LastPriceUpdate,
                MaturityDate      = i.MaturityDate,
                ExpectedYieldPct  = i.ExpectedYieldPct,
                AccountId         = i.AccountId,
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
                .Where(i => i.UserId == userId && i.CurrentQuantity > 0)
                .OrderBy(i => i.Ticker)
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

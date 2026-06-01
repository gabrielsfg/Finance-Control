using FinanceControl.Data.Data;
using FinanceControl.Domain.Entities;
using FinanceControl.Domain.Interfaces.Services;
using FinanceControl.Shared.Dtos.Request;
using FinanceControl.Shared.Dtos.Response;
using FinanceControl.Shared.Dtos.Response.Investment;
using FinanceControl.Shared.Enums;
using FinanceControl.Shared.Models;
using Microsoft.EntityFrameworkCore;

namespace FinanceControl.Services.Services
{
    public class GoalService : IGoalService
    {
        private readonly IDbContextFactory<ApplicationDbContext> _contextFactory;

        public GoalService(IDbContextFactory<ApplicationDbContext> contextFactory)
        {
            _contextFactory = contextFactory;
        }

        public async Task<GoalResponseDto> CreateAsync(int userId, CreateGoalRequestDto dto)
        {
            await using var context = _contextFactory.CreateDbContext();

            Account? virtualAccount = null;
            if (dto.Type == EnumGoalType.Item)
            {
                virtualAccount = new Account
                {
                    UserId           = userId,
                    Name             = dto.Name,
                    Type             = EnumAccountType.Checking,
                    IsSystem         = true,
                    IsDefaultAccount = false,
                };
                context.Accounts.Add(virtualAccount);
                await context.SaveChangesAsync();
            }

            var goal = new Goal
            {
                UserId          = userId,
                Name            = dto.Name,
                Description     = dto.Description,
                Type            = dto.Type,
                TargetAmount    = dto.TargetAmount,
                Priority        = dto.Priority,
                Status          = EnumGoalStatus.Active,
                Color           = dto.Color,
                Url             = dto.Url,
                ImageUrl        = dto.ImageUrl,
                TargetDate      = dto.TargetDate,
                TargetAssetType = dto.TargetAssetType,
                TargetTicker    = dto.TargetTicker,
                AccountId       = virtualAccount?.Id,
                IncludeInNetWorth = false,
            };

            context.Goals.Add(goal);
            await context.SaveChangesAsync();

            return MapToResponse(goal, currentAmount: 0);
        }

        public async Task<IReadOnlyList<GoalResponseDto>> GetAllAsync(int userId, EnumGoalType? type, EnumGoalStatus? status)
        {
            await using var context = _contextFactory.CreateDbContext();

            var query = context.Goals.Where(g => g.UserId == userId);
            if (type.HasValue)   query = query.Where(g => g.Type == type.Value);
            if (status.HasValue) query = query.Where(g => g.Status == status.Value);

            var goals = await query.OrderByDescending(g => g.CreatedAt).ToListAsync();

            var itemGoalAccountIds = goals
                .Where(g => g.Type == EnumGoalType.Item && g.AccountId.HasValue)
                .Select(g => g.AccountId!.Value)
                .ToList();

            var accountBalances = await ComputeAccountBalancesAsync(context, itemGoalAccountIds);

            var allInvestments = await context.Investments
                .Where(i => i.UserId == userId && i.CurrentQuantity > 0)
                .Select(i => new { i.MarketAsset.AssetType, i.MarketAsset.Ticker, i.CurrentQuantity, i.MarketAsset.CurrentPrice })
                .ToListAsync();

            var updatedGoals = new List<Goal>();

            var result = goals.Select(g =>
            {
                int currentAmount;
                if (g.Type == EnumGoalType.Investment)
                {
                    var subset = allInvestments.AsEnumerable();
                    if (g.TargetTicker is not null)
                        subset = subset.Where(i => i.Ticker == g.TargetTicker);
                    else if (g.TargetAssetType.HasValue)
                        subset = subset.Where(i => i.AssetType == g.TargetAssetType.Value);
                    currentAmount = (int)subset.Sum(i => Math.Round(i.CurrentQuantity * i.CurrentPrice));

                    if (currentAmount >= g.TargetAmount && g.AchievedAt is null)
                    {
                        g.AchievedAt = DateTime.UtcNow;
                        updatedGoals.Add(g);
                    }
                    else if (currentAmount < g.TargetAmount && g.AchievedAt is not null)
                    {
                        g.AchievedAt = null;
                        updatedGoals.Add(g);
                    }
                }
                else
                {
                    currentAmount = g.AccountId.HasValue
                        ? accountBalances.GetValueOrDefault(g.AccountId.Value)
                        : 0;

                    if (currentAmount >= g.TargetAmount && g.AchievedAt is null)
                    {
                        g.AchievedAt = DateTime.UtcNow;
                        updatedGoals.Add(g);
                    }
                    else if (currentAmount < g.TargetAmount && g.AchievedAt is not null && g.Status != EnumGoalStatus.Achieved)
                    {
                        g.AchievedAt = null;
                        updatedGoals.Add(g);
                    }
                }

                return MapToResponse(g, currentAmount);
            }).ToList();

            if (updatedGoals.Count > 0)
                await context.SaveChangesAsync();

            return result;
        }

        public async Task<GoalDetailResponseDto?> GetByIdAsync(int userId, int id)
        {
            await using var context = _contextFactory.CreateDbContext();

            var goal = await context.Goals.FirstOrDefaultAsync(g => g.Id == id && g.UserId == userId);
            if (goal is null) return null;

            int currentAmount = 0;
            List<GoalTransactionDto> transactions = [];

            if (goal.Type == EnumGoalType.Investment)
            {
                currentAmount = (int)await GetInvestmentPortfolioValueAsync(context, userId, goal.TargetAssetType, goal.TargetTicker);
            }
            else if (goal.AccountId.HasValue)
            {
                var txs = await context.Transactions
                    .Where(t => t.AccountId == goal.AccountId || t.DestinationAccountId == goal.AccountId)
                    .OrderByDescending(t => t.TransactionDate)
                    .ThenByDescending(t => t.CreatedAt)
                    .Select(t => new
                    {
                        t.Id,
                        t.Value,
                        t.Type,
                        t.Description,
                        t.TransactionDate,
                        t.AccountId,
                        t.DestinationAccountId,
                    })
                    .ToListAsync();

                currentAmount = txs.Sum(t =>
                {
                    if (t.AccountId == goal.AccountId && t.Type == EnumTransactionType.Expense) return -t.Value;
                    if (t.AccountId == goal.AccountId && t.Type == EnumTransactionType.Transfer) return -t.Value;
                    if (t.AccountId == goal.AccountId && t.Type == EnumTransactionType.Income)  return t.Value;
                    if (t.DestinationAccountId == goal.AccountId && t.Type == EnumTransactionType.Transfer) return t.Value;
                    return 0;
                });

                transactions = txs.Select(t => new GoalTransactionDto
                {
                    Id              = t.Id,
                    Amount          = t.Value,
                    Type            = t.Type,
                    Description     = t.Description,
                    TransactionDate = t.TransactionDate,
                }).ToList();
            }

            return new GoalDetailResponseDto
            {
                Id                = goal.Id,
                Name              = goal.Name,
                Description       = goal.Description,
                Type              = goal.Type,
                TargetAmount      = goal.TargetAmount,
                Priority          = goal.Priority,
                Status            = goal.Status,
                Color             = goal.Color,
                Url               = goal.Url,
                ImageUrl          = goal.ImageUrl,
                TargetDate        = goal.TargetDate,
                TargetAssetType   = goal.TargetAssetType,
                TargetTicker      = goal.TargetTicker,
                CurrentAmount     = currentAmount,
                IncludeInNetWorth = goal.IncludeInNetWorth,
                AchievedAt        = goal.AchievedAt,
                AccountId         = goal.AccountId,
                CreatedAt         = goal.CreatedAt,
                UpdatedAt         = goal.UpdatedAt,
                Transactions      = transactions,
            };
        }

        public async Task<Result<GoalResponseDto>> UpdateAsync(int userId, int id, UpdateGoalRequestDto dto)
        {
            await using var context = _contextFactory.CreateDbContext();

            var goal = await context.Goals.FirstOrDefaultAsync(g => g.Id == id && g.UserId == userId);
            if (goal is null) return Result<GoalResponseDto>.Failure("Goal not found.");

            if (dto.Name is not null)
            {
                goal.Name = dto.Name;
                if (goal.AccountId.HasValue)
                {
                    var account = await context.Accounts.FindAsync(goal.AccountId.Value);
                    if (account is not null) account.Name = dto.Name;
                }
            }
            if (dto.Description is not null)     goal.Description    = dto.Description;
            if (dto.TargetAmount.HasValue)       goal.TargetAmount   = dto.TargetAmount.Value;
            if (dto.Priority.HasValue)           goal.Priority       = dto.Priority.Value;
            if (dto.Status.HasValue)             goal.Status         = dto.Status.Value;
            if (dto.Color is not null)           goal.Color          = dto.Color;
            if (dto.Url is not null)             goal.Url            = dto.Url;
            if (dto.ImageUrl is not null)        goal.ImageUrl       = dto.ImageUrl;
            if (dto.TargetDate.HasValue)         goal.TargetDate     = dto.TargetDate.Value;
            if (dto.TargetAssetType.HasValue)    goal.TargetAssetType = dto.TargetAssetType;
            if (dto.TargetTicker is not null)    goal.TargetTicker   = dto.TargetTicker;
            if (dto.IncludeInNetWorth.HasValue)  goal.IncludeInNetWorth = dto.IncludeInNetWorth.Value;

            await context.SaveChangesAsync();

            int currentAmount = await GetCurrentAmountAsync(context, userId, goal);
            return Result<GoalResponseDto>.Success(MapToResponse(goal, currentAmount));
        }

        public async Task<Result<bool>> DeleteAsync(int userId, int id, int? returnToAccountId)
        {
            await using var context = _contextFactory.CreateDbContext();

            var goal = await context.Goals.FirstOrDefaultAsync(g => g.Id == id && g.UserId == userId);
            if (goal is null) return Result<bool>.Failure("Goal not found.");

            if (goal.AccountId.HasValue)
            {
                var balance = await ComputeSingleAccountBalanceAsync(context, goal.AccountId.Value);

                if (balance > 0)
                {
                    if (returnToAccountId is null)
                        return Result<bool>.Failure("Goal has remaining balance. Provide returnToAccountId.");

                    var systemSubCategoryId = await GetSystemTransferSubCategoryIdAsync(context, userId);

                    var returnTx = new Transaction
                    {
                        UserId              = userId,
                        AccountId           = goal.AccountId.Value,
                        DestinationAccountId = returnToAccountId,
                        SubCategoryId       = systemSubCategoryId,
                        Value               = balance,
                        Type                = EnumTransactionType.Transfer,
                        Description         = $"Devolução da meta: {goal.Name}",
                        TransactionDate     = DateOnly.FromDateTime(DateTime.UtcNow),
                        PaymentType         = EnumPaymentType.OneTime,
                    };
                    context.Transactions.Add(returnTx);
                }

                var virtualAccount = await context.Accounts.FindAsync(goal.AccountId.Value);
                if (virtualAccount is not null)
                    context.Accounts.Remove(virtualAccount);
            }

            context.Goals.Remove(goal);
            await context.SaveChangesAsync();

            return Result<bool>.Success(true);
        }

        public async Task<Result<GoalResponseDto>> RecordContributionAsync(int userId, int id, RecordGoalContributionRequestDto dto)
        {
            await using var context = _contextFactory.CreateDbContext();

            var goal = await context.Goals.FirstOrDefaultAsync(g => g.Id == id && g.UserId == userId);
            if (goal is null) return Result<GoalResponseDto>.Failure("Goal not found.");
            if (goal.Type != EnumGoalType.Item || !goal.AccountId.HasValue)
                return Result<GoalResponseDto>.Failure("Contributions are only supported for Item goals.");

            var balance = await ComputeSingleAccountBalanceAsync(context, goal.AccountId.Value);
            if (balance >= goal.TargetAmount)
                return Result<GoalResponseDto>.Failure("Goal target already reached.");

            var systemSubCategoryId = await GetSystemTransferSubCategoryIdAsync(context, userId);

            Transaction tx;
            if (dto.SourceAccountId.HasValue)
            {
                tx = new Transaction
                {
                    UserId               = userId,
                    AccountId            = dto.SourceAccountId.Value,
                    DestinationAccountId = goal.AccountId.Value,
                    SubCategoryId        = systemSubCategoryId,
                    Value                = dto.Amount,
                    Type                 = EnumTransactionType.Transfer,
                    Description          = dto.Description ?? $"Aporte: {goal.Name}",
                    TransactionDate      = DateOnly.FromDateTime(DateTime.UtcNow),
                    PaymentType          = EnumPaymentType.OneTime,
                };
            }
            else
            {
                tx = new Transaction
                {
                    UserId          = userId,
                    AccountId       = goal.AccountId.Value,
                    SubCategoryId   = systemSubCategoryId,
                    Value           = dto.Amount,
                    Type            = EnumTransactionType.Income,
                    Description     = dto.Description ?? $"Aporte externo: {goal.Name}",
                    TransactionDate = DateOnly.FromDateTime(DateTime.UtcNow),
                    PaymentType     = EnumPaymentType.OneTime,
                };
            }

            context.Transactions.Add(tx);

            var newBalance = balance + dto.Amount;
            if (newBalance >= goal.TargetAmount && goal.AchievedAt is null)
                goal.AchievedAt = DateTime.UtcNow;

            await context.SaveChangesAsync();

            return Result<GoalResponseDto>.Success(MapToResponse(goal, newBalance));
        }

        public async Task<Result<GoalResponseDto>> WithdrawAsync(int userId, int id, WithdrawGoalRequestDto dto)
        {
            await using var context = _contextFactory.CreateDbContext();

            var goal = await context.Goals.FirstOrDefaultAsync(g => g.Id == id && g.UserId == userId);
            if (goal is null) return Result<GoalResponseDto>.Failure("Goal not found.");
            if (goal.Type != EnumGoalType.Item || !goal.AccountId.HasValue)
                return Result<GoalResponseDto>.Failure("Withdrawals are only supported for Item goals.");

            var balance = await ComputeSingleAccountBalanceAsync(context, goal.AccountId.Value);
            if (dto.Amount > balance)
                return Result<GoalResponseDto>.Failure("Insufficient balance in goal.");

            var systemSubCategoryId = await GetSystemTransferSubCategoryIdAsync(context, userId);

            Transaction tx;
            if (dto.DestinationAccountId.HasValue)
            {
                tx = new Transaction
                {
                    UserId               = userId,
                    AccountId            = goal.AccountId.Value,
                    DestinationAccountId = dto.DestinationAccountId.Value,
                    SubCategoryId        = systemSubCategoryId,
                    Value                = dto.Amount,
                    Type                 = EnumTransactionType.Transfer,
                    Description          = dto.Description ?? $"Retirada: {goal.Name}",
                    TransactionDate      = DateOnly.FromDateTime(DateTime.UtcNow),
                    PaymentType          = EnumPaymentType.OneTime,
                };
            }
            else
            {
                tx = new Transaction
                {
                    UserId          = userId,
                    AccountId       = goal.AccountId.Value,
                    SubCategoryId   = systemSubCategoryId,
                    Value           = dto.Amount,
                    Type            = EnumTransactionType.Expense,
                    Description     = dto.Description ?? $"Retirada direta: {goal.Name}",
                    TransactionDate = DateOnly.FromDateTime(DateTime.UtcNow),
                    PaymentType     = EnumPaymentType.OneTime,
                };
            }

            context.Transactions.Add(tx);

            var newBalance = balance - dto.Amount;
            if (newBalance < goal.TargetAmount && goal.AchievedAt is not null && goal.Status != EnumGoalStatus.Achieved)
                goal.AchievedAt = null;

            await context.SaveChangesAsync();

            return Result<GoalResponseDto>.Success(MapToResponse(goal, newBalance));
        }

        public async Task<Result<GoalResponseDto>> RegisterPurchaseAsync(int userId, int id, RegisterGoalPurchaseRequestDto dto)
        {
            await using var context = _contextFactory.CreateDbContext();

            var goal = await context.Goals.FirstOrDefaultAsync(g => g.Id == id && g.UserId == userId);
            if (goal is null) return Result<GoalResponseDto>.Failure("Goal not found.");
            if (goal.Type != EnumGoalType.Item || !goal.AccountId.HasValue)
                return Result<GoalResponseDto>.Failure("Purchase registration is only supported for Item goals.");

            var balance = await ComputeSingleAccountBalanceAsync(context, goal.AccountId.Value);

            var tx = new Transaction
            {
                UserId          = userId,
                AccountId       = goal.AccountId.Value,
                SubCategoryId   = dto.SubCategoryId,
                Value           = balance,
                Type            = EnumTransactionType.Expense,
                Description     = dto.Description ?? $"Compra: {goal.Name}",
                TransactionDate = DateOnly.FromDateTime(DateTime.UtcNow),
                PaymentType     = EnumPaymentType.OneTime,
            };

            context.Transactions.Add(tx);

            goal.Status     = EnumGoalStatus.Achieved;
            goal.AchievedAt = goal.AchievedAt ?? DateTime.UtcNow;

            await context.SaveChangesAsync();

            return Result<GoalResponseDto>.Success(MapToResponse(goal, 0));
        }

        public async Task<Result<IReadOnlyList<InvestmentTransactionDto>>> GetInvestmentTransactionsAsync(int userId, int id)
        {
            await using var context = _contextFactory.CreateDbContext();

            var goal = await context.Goals.FirstOrDefaultAsync(g => g.Id == id && g.UserId == userId);
            if (goal is null) return Result<IReadOnlyList<InvestmentTransactionDto>>.Failure("Goal not found.");
            if (goal.Type != EnumGoalType.Investment)
                return Result<IReadOnlyList<InvestmentTransactionDto>>.Failure("Only investment goals have investment transactions.");

            var query = context.InvestmentTransactions
                .Where(t => t.UserId == userId);

            if (goal.TargetTicker is not null)
                query = query.Where(t => t.Investment.MarketAsset.Ticker == goal.TargetTicker);
            else if (goal.TargetAssetType.HasValue)
                query = query.Where(t => t.Investment.MarketAsset.AssetType == goal.TargetAssetType.Value);

            var txs = await query
                .Include(t => t.Investment).ThenInclude(i => i.MarketAsset)
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

            return Result<IReadOnlyList<InvestmentTransactionDto>>.Success(txs);
        }

        // ── Private helpers ───────────────────────────────────────────────────────

        private static async Task<Dictionary<int, int>> ComputeAccountBalancesAsync(
            ApplicationDbContext context, IEnumerable<int> accountIds)
        {
            var ids = accountIds.ToList();
            if (ids.Count == 0) return [];

            var txs = await context.Transactions
                .Where(t => ids.Contains(t.AccountId) || (t.DestinationAccountId.HasValue && ids.Contains(t.DestinationAccountId.Value)))
                .Select(t => new { t.AccountId, t.DestinationAccountId, t.Value, t.Type })
                .ToListAsync();

            var balances = ids.ToDictionary(id => id, _ => 0);
            foreach (var t in txs)
            {
                if (ids.Contains(t.AccountId))
                {
                    if (t.Type == EnumTransactionType.Income)   balances[t.AccountId] += t.Value;
                    if (t.Type == EnumTransactionType.Expense)  balances[t.AccountId] -= t.Value;
                    if (t.Type == EnumTransactionType.Transfer) balances[t.AccountId] -= t.Value;
                }
                if (t.DestinationAccountId.HasValue && ids.Contains(t.DestinationAccountId.Value))
                {
                    if (t.Type == EnumTransactionType.Transfer)
                        balances[t.DestinationAccountId.Value] += t.Value;
                }
            }
            return balances;
        }

        private static async Task<int> ComputeSingleAccountBalanceAsync(ApplicationDbContext context, int accountId)
        {
            var balances = await ComputeAccountBalancesAsync(context, [accountId]);
            return balances.GetValueOrDefault(accountId);
        }

        private static async Task<int> GetCurrentAmountAsync(ApplicationDbContext context, int userId, Goal goal)
        {
            if (goal.Type == EnumGoalType.Investment)
                return (int)await GetInvestmentPortfolioValueAsync(context, userId, goal.TargetAssetType, goal.TargetTicker);
            if (goal.AccountId.HasValue)
                return await ComputeSingleAccountBalanceAsync(context, goal.AccountId.Value);
            return 0;
        }

        private static async Task<long> GetInvestmentPortfolioValueAsync(
            ApplicationDbContext context, int userId, EnumAssetType? assetType, string? ticker)
        {
            var query = context.Investments.Where(i => i.UserId == userId && i.CurrentQuantity > 0);
            if (ticker is not null)          query = query.Where(i => i.MarketAsset.Ticker == ticker);
            else if (assetType.HasValue)     query = query.Where(i => i.MarketAsset.AssetType == assetType.Value);

            var investments = await query
                .Select(i => new { i.CurrentQuantity, i.MarketAsset.CurrentPrice })
                .ToListAsync();

            return (long)investments.Sum(i => Math.Round(i.CurrentQuantity * i.CurrentPrice));
        }

        private static async Task<int> GetSystemTransferSubCategoryIdAsync(ApplicationDbContext context, int userId)
        {
            var subCategory = await context.SubCategories
                .FirstOrDefaultAsync(s => s.UserId == userId && s.IsSystem && (s.Name == "Transferência" || s.Name == "Transfer"));

            if (subCategory is not null) return subCategory.Id;

            // Fallback: create on demand if seed didn't run (e.g. legacy accounts)
            var category = await context.Categories
                .FirstOrDefaultAsync(c => c.UserId == userId && c.IsSystem && (c.Name == "Outros" || c.Name == "Other"));

            if (category is null)
            {
                category = new Category { UserId = userId, Name = "Outros", IsSystem = true };
                context.Categories.Add(category);
                await context.SaveChangesAsync();
            }

            var sub = new SubCategory { UserId = userId, CategoryId = category.Id, Name = "Transferência", IsSystem = true };
            context.SubCategories.Add(sub);
            await context.SaveChangesAsync();
            return sub.Id;
        }

        private static GoalResponseDto MapToResponse(Goal goal, int currentAmount) =>
            new()
            {
                Id                = goal.Id,
                Name              = goal.Name,
                Description       = goal.Description,
                Type              = goal.Type,
                TargetAmount      = goal.TargetAmount,
                Priority          = goal.Priority,
                Status            = goal.Status,
                Color             = goal.Color,
                Url               = goal.Url,
                ImageUrl          = goal.ImageUrl,
                TargetDate        = goal.TargetDate,
                TargetAssetType   = goal.TargetAssetType,
                TargetTicker      = goal.TargetTicker,
                CurrentAmount     = currentAmount,
                IncludeInNetWorth = goal.IncludeInNetWorth,
                AchievedAt        = goal.AchievedAt,
                AccountId         = goal.AccountId,
                CreatedAt         = goal.CreatedAt,
                UpdatedAt         = goal.UpdatedAt,
            };
    }
}

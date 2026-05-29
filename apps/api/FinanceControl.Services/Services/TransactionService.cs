using FinanceControl.Data.Data;
using FinanceControl.Domain.Entities;
using FinanceControl.Domain.Interfaces.Services;
using FinanceControl.Shared.Dtos.Others;
using FinanceControl.Shared.Dtos.Request;
using FinanceControl.Shared.Dtos.Response;
using FinanceControl.Shared.Enums;
using FinanceControl.Shared.Helpers;
using FinanceControl.Shared.Models;
using Microsoft.EntityFrameworkCore;

namespace FinanceControl.Services.Services
{
    public class TransactionService : ITransactionService
    {
        private readonly ApplicationDbContext _context;
        private readonly IDbContextFactory<ApplicationDbContext> _contextFactory;

        public TransactionService(ApplicationDbContext context, IDbContextFactory<ApplicationDbContext> contextFactory)
        {
            _context = context;
            _contextFactory = contextFactory;
        }

        public async Task<Result<CreateTransactionResponseDto>> CreateTransactionAsync(CreateTransactionRequestDto requestDto, int userId)
        {
            var accountExists = await _context.Accounts
                .AnyAsync(a => a.Id == requestDto.AccountId && a.UserId == userId);
            if (!accountExists)
                return Result<CreateTransactionResponseDto>.Failure("Invalid parameters.");

            var subCategoryExists = await _context.SubCategories
                .AnyAsync(sc => sc.Id == requestDto.SubCategoryId && sc.UserId == userId);
            if (!subCategoryExists)
                return Result<CreateTransactionResponseDto>.Failure("Invalid parameters.");

            int? resolvedBudgetId = null;
            if (requestDto.IncludeInBudget)
            {
                var activeBudget = await _context.Budgets
                    .FirstOrDefaultAsync(b => b.IsActive && b.UserId == userId);
                if (activeBudget is null)
                    return Result<CreateTransactionResponseDto>.Failure("No active budget found.");
                resolvedBudgetId = activeBudget.Id;
            }

            await using var dbTransaction = await _context.Database.BeginTransactionAsync();
            try
            {
                var createdTransactions = requestDto.PaymentType switch
                {
                    EnumPaymentType.OneTime => await CreateOneTimeAsync(requestDto, userId, resolvedBudgetId),
                    EnumPaymentType.Installment => await CreateInstallmentsAsync(requestDto, userId, resolvedBudgetId),
                    EnumPaymentType.Recurring => await CreateRecurringAsync(requestDto, userId, resolvedBudgetId),
                    _ => null
                };

                if (createdTransactions is null || createdTransactions.Count == 0)
                    return Result<CreateTransactionResponseDto>.Failure("Invalid payment type.");

                await _context.SaveChangesAsync();

                await AssociateTagsAsync(createdTransactions, requestDto.Tags, userId);

                await dbTransaction.CommitAsync();

                var transactionIds = createdTransactions.Select(t => t.Id).ToList();
                var response = await BuildCreateResponseAsync(transactionIds);

                return Result<CreateTransactionResponseDto>.Success(response);
            }
            catch
            {
                await dbTransaction.RollbackAsync();
                throw;
            }
        }

        public async Task<IEnumerable<GetTransactionResponseDto>> GetAllTransactionsAsync(int userId)
        {
            return await GetTransactionQuery(userId)
                .ToListAsync();
        }

        public async Task<GetTransactionsFilteredResponseDto> GetAllTransactionsFilteredAsync(GetTransactionsFilterRequestDto requestDto, int userId)
        {
            var query = GetTransactionQuery(userId)
                .Where(t => t.TransactionDate >= requestDto.StartDate && t.TransactionDate <= requestDto.FinishDate);

            if (requestDto.BudgetIds is { Count: > 0 })
                query = query.Where(t => t.BudgetId != null && requestDto.BudgetIds.Contains(t.BudgetId.Value));

            if (requestDto.AccountIds is { Count: > 0 })
                query = query.Where(t => requestDto.AccountIds.Contains(t.AccountId));

            if (requestDto.SubCategoryIds is { Count: > 0 })
                query = query.Where(t => requestDto.SubCategoryIds.Contains(t.SubCategoryId));

            if (requestDto.CategoryIds is { Count: > 0 })
            {
                var subCategoryIds = await _context.SubCategories
                    .Where(sc => requestDto.CategoryIds.Contains(sc.CategoryId) && sc.UserId == userId)
                    .Select(sc => sc.Id)
                    .ToListAsync();
                query = query.Where(t => subCategoryIds.Contains(t.SubCategoryId));
            }

            var totals = await query
                .GroupBy(_ => 1)
                .Select(g => new
                {
                    TotalIncome = g.Where(t => t.Type == EnumTransactionType.Income).Sum(t => (int?)t.Value) ?? 0,
                    TotalExpense = g.Where(t => t.Type == EnumTransactionType.Expense).Sum(t => (int?)t.Value) ?? 0,
                })
                .FirstOrDefaultAsync();

            var totalIncome = totals?.TotalIncome ?? 0;
            var totalExpense = totals?.TotalExpense ?? 0;

            var page = Math.Max(1, requestDto.Page);
            var pageSize = Math.Clamp(requestDto.PageSize, 1, 100);
            var totalItems = await query.CountAsync();
            var totalPages = (int)Math.Ceiling((double)totalItems / pageSize);

            var sortAsc = requestDto.SortOrder?.ToLower() == "asc";
            var sorted = requestDto.SortField?.ToLower() == "value"
                ? (sortAsc ? query.OrderBy(t => t.Value) : query.OrderByDescending(t => t.Value))
                : (sortAsc ? query.OrderBy(t => t.TransactionDate) : query.OrderByDescending(t => t.TransactionDate));

            var items = await sorted
                .Skip((page - 1) * pageSize)
                .Take(pageSize)
                .ToListAsync();

            return new GetTransactionsFilteredResponseDto
            {
                TotalIncome = totalIncome,
                TotalExpense = totalExpense,
                Balance = totalIncome - totalExpense,
                Page = new PagedResponse<GetTransactionResponseDto>
                {
                    CurrentPage = page,
                    TotalPages = Math.Max(1, totalPages),
                    PageSize = pageSize,
                    TotalItems = totalItems,
                    RowCount = items.Count,
                    Items = items,
                }
            };
        }

        public async Task<GetTransactionByIdResponseDto?> GetTransactionByIdAsync(int id, int userId)
        {
            return await _context.Transactions
                .Where(t => t.Id == id && t.UserId == userId)
                .Select(t => new GetTransactionByIdResponseDto
                {
                    Id = t.Id,
                    BudgetId = t.BudgetId,
                    SubCategoryId = t.SubCategoryId,
                    SubCategoryName = t.SubCategory.Name,
                    SubCategoryEmoji = t.SubCategory.Emoji,
                    AccountId = t.AccountId,
                    AccountName = t.Account.Name,
                    RecurringTransactionId = t.RecurringTransactionId,
                    ParentTransactionId = t.ParentTransactionId,
                    Value = t.Value,
                    Type = t.Type,
                    Description = t.Description,
                    TransactionDate = t.TransactionDate,
                    PaymentType = t.PaymentType,
                    PaymentMethod = t.PaymentMethod,
                    InstallmentNumber = t.InstallmentNumber,
                    TotalInstallments = t.TotalInstallments,
                    Tags = t.Tags.Select(tag => new GetTagResponseDto { Id = tag.Id, Name = tag.Name }).ToList(),
                })
                .FirstOrDefaultAsync();
        }

        public async Task<Result<CreateTransactionResponseDto>> UpdateTransactionAsync(UpdateTransactionRequestDto requestDto, int id, int userId)
        {
            var transaction = await _context.Transactions
                .FirstOrDefaultAsync(t => t.Id == id && t.UserId == userId);

            if (transaction is null)
                return Result<CreateTransactionResponseDto>.Failure("Transaction not found.");

            var accountExists = await _context.Accounts
                .AnyAsync(a => a.Id == requestDto.AccountId && a.UserId == userId);
            if (!accountExists)
                return Result<CreateTransactionResponseDto>.Failure("Invalid parameters.");

            var subCategoryExists = await _context.SubCategories
                .AnyAsync(sc => sc.Id == requestDto.SubCategoryId && sc.UserId == userId);
            if (!subCategoryExists)
                return Result<CreateTransactionResponseDto>.Failure("Invalid parameters.");

            if (transaction.PaymentType != requestDto.PaymentType)
            {
                var deleteResult = await DeleteTransactionAsync(id, userId);
                if (deleteResult.IsFailure)
                    return Result<CreateTransactionResponseDto>.Failure(deleteResult.Error);

                var createDto = new CreateTransactionRequestDto
                {
                    SubCategoryId = requestDto.SubCategoryId,
                    AccountId = requestDto.AccountId,
                    Value = requestDto.Value,
                    Type = requestDto.Type,
                    Description = requestDto.Description,
                    TransactionDate = requestDto.TransactionDate,
                    PaymentType = requestDto.PaymentType,
                    PaymentMethod = requestDto.PaymentMethod,
                    TotalInstallments = requestDto.TotalInstallments,
                    Recurrence = requestDto.Recurrence,
                    IncludeInBudget = requestDto.IncludeInBudget,
                    Tags = requestDto.Tags,
                };

                return await CreateTransactionAsync(createDto, userId);
            }

            transaction.AccountId = requestDto.AccountId;
            transaction.SubCategoryId = requestDto.SubCategoryId;
            transaction.Value = requestDto.Value;
            transaction.Type = requestDto.Type;
            transaction.Description = requestDto.Description;
            transaction.TransactionDate = requestDto.TransactionDate;
            transaction.PaymentMethod = requestDto.PaymentMethod;

            if (requestDto.IncludeInBudget)
            {
                var activeBudget = await _context.Budgets
                    .FirstOrDefaultAsync(b => b.IsActive && b.UserId == userId);
                transaction.BudgetId = activeBudget?.Id;
            }
            else
            {
                transaction.BudgetId = null;
            }

            await _context.SaveChangesAsync();

            await AssociateTagsAsync([transaction], requestDto.Tags, userId);

            var transactionIds = new List<int> { transaction.Id };
            var response = await BuildCreateResponseAsync(transactionIds);
            return Result<CreateTransactionResponseDto>.Success(response);
        }

        public async Task<Result<IEnumerable<GetTransactionResponseDto>>> DeleteTransactionAsync(int id, int userId)
        {
            var transaction = await _context.Transactions
                .FirstOrDefaultAsync(t => t.Id == id && t.UserId == userId);

            if (transaction is null)
                return Result<IEnumerable<GetTransactionResponseDto>>.Failure("Transaction not found.");

            _context.Transactions.Remove(transaction);
            await _context.SaveChangesAsync();

            var transactions = await GetAllTransactionsAsync(userId);
            return Result<IEnumerable<GetTransactionResponseDto>>.Success(transactions);
        }

        /// <summary>
        /// Main Page Endpoints
        /// </summary>
        public async Task<BalanceSummaryDto> GetSummaryBalanceAsync(MainPageSummaryRequestDto requestDto)
        {
            await using var context = _contextFactory.CreateDbContext();

            var result = await context.Transactions
                    .Where(t => t.UserId == requestDto.UserId)
                    .WhereIf(requestDto.BudgetId.HasValue, t => t.BudgetId == requestDto.BudgetId)
                    .Where(t => t.TransactionDate >= requestDto.StartDate && t.TransactionDate <= requestDto.FinishDate)
                    .GroupBy(_ => 1)
                    .Select(g => new BalanceSummaryDto
                    {
                        TotalIncome = g
                            .Where(t => t.Type == EnumTransactionType.Income)
                            .Sum(t => (int?)t.Value) ?? 0,
                        TotalExpenses = g
                            .Where(t => t.Type == EnumTransactionType.Expense)
                            .Sum(t => (int?)t.Value) ?? 0
                    })
                    .FirstOrDefaultAsync();

            if (result is null)
                return new BalanceSummaryDto();

            result.Balance = result.TotalIncome - result.TotalExpenses;
            return result;
        }

        public async Task<List<RecentTransactionDto>> GetRecentTransactionsAsync(MainPageSummaryRequestDto requestDto)
        {
            await using var context = _contextFactory.CreateDbContext();

            return await context.Transactions
                .Where(t => t.UserId == requestDto.UserId)
                .WhereIf(requestDto.BudgetId.HasValue, t => t.BudgetId == requestDto.BudgetId)
                .Where(t => t.TransactionDate >= requestDto.StartDate && t.TransactionDate <= requestDto.FinishDate)
                .OrderByDescending(t => t.TransactionDate)
                .ThenByDescending(t => t.CreatedAt)
                .Take(5)
                .Select(t => new RecentTransactionDto
                {
                    Id = t.Id,
                    Description = t.Description,
                    Value = t.Value,
                    Type = t.Type,
                    SubCategoryName = t.SubCategory.Name,
                    SubCategoryEmoji = t.SubCategory.Emoji,
                    CategoryName = t.SubCategory.Category.Name
                })
                .ToListAsync();
        }

        public async Task<BudgetSummaryDto?> GetBudgetSummaryAsync(MainPageSummaryRequestDto requestDto)
        {
            await using var context = _contextFactory.CreateDbContext();

            var hasBudget = await context.Budgets
                .AnyAsync(b => b.UserId == requestDto.UserId
                    && (!requestDto.BudgetId.HasValue || b.Id == requestDto.BudgetId));

            if (!hasBudget)
                return null;

            var hasAllocations = await context.BudgetSubcategoryAllocations
                .AnyAsync(a => a.Budget.UserId == requestDto.UserId
                    && (!requestDto.BudgetId.HasValue || a.BudgetId == requestDto.BudgetId));

            var totalExpected = await context.BudgetSubcategoryAllocations
                .Where(a => a.Budget.UserId == requestDto.UserId)
                .WhereIf(requestDto.BudgetId.HasValue, a => a.BudgetId == requestDto.BudgetId)
                .Where(a => a.AllocationType == EnumAllocationType.Expense)
                .SumAsync(a => (int?)a.ExpectedValue) ?? 0;

            var totalSpent = await context.Transactions
                .Where(t => t.UserId == requestDto.UserId)
                .Where(t => t.Type == EnumTransactionType.Expense)
                .WhereIf(requestDto.BudgetId.HasValue, t => t.BudgetId == requestDto.BudgetId)
                .Where(t => t.TransactionDate >= requestDto.StartDate && t.TransactionDate <= requestDto.FinishDate)
                .SumAsync(t => (int?)t.Value) ?? 0;

            var spentPercentage = totalExpected > 0
                ? Math.Round((decimal)totalSpent / totalExpected * 100, 2)
                : 0m;

            var topSubCategories = await context.BudgetSubcategoryAllocations
                .Where(a => a.Budget.UserId == requestDto.UserId)
                .WhereIf(requestDto.BudgetId.HasValue, a => a.BudgetId == requestDto.BudgetId)
                .Where(a => a.AllocationType == EnumAllocationType.Expense)
                .Select(a => new
                {
                    SubCategoryName = a.SubCategory.Name,
                    SubCategoryEmoji = a.SubCategory.Emoji,
                    CategoryName = a.SubCategory.Category.Name,
                    CategoryColor = a.SubCategory.Category.Color,
                    Allocated = a.ExpectedValue,
                    Spent = context.Transactions
                        .Where(t => t.UserId == requestDto.UserId
                            && t.SubCategoryId == a.SubCategoryId
                            && t.Type == EnumTransactionType.Expense
                            && t.TransactionDate >= requestDto.StartDate
                            && t.TransactionDate <= requestDto.FinishDate)
                        .Sum(t => (int?)t.Value) ?? 0
                })
                .OrderByDescending(x => x.Spent)
                .Take(4)
                .ToListAsync();

            return new BudgetSummaryDto
            {
                TotalExpected = totalExpected,
                TotalSpent = totalSpent,
                SpentPercentage = spentPercentage,
                HasAllocations = hasAllocations,
                TopSubCategories = topSubCategories.Select(x => new BudgetSubCategorySummaryDto
                {
                    SubCategoryName = x.SubCategoryName,
                    SubCategoryEmoji = x.SubCategoryEmoji,
                    CategoryName = x.CategoryName,
                    CategoryColor = x.CategoryColor,
                    Spent = x.Spent,
                    Allocated = x.Allocated,
                    SpentPercentage = x.Allocated > 0
                        ? Math.Round((decimal)x.Spent / x.Allocated * 100, 2)
                        : 0m
                }).ToList()
            };
        }

        public async Task<List<TopCategoryItemDto>> GetTopCategoriesAsync(MainPageSummaryRequestDto requestDto)
        {
            await using var context = _contextFactory.CreateDbContext();

            return await context.Transactions
                .Where(t => t.UserId == requestDto.UserId)
                .Where(t => t.Type == EnumTransactionType.Expense)
                .WhereIf(requestDto.BudgetId.HasValue, t => t.BudgetId == requestDto.BudgetId)
                .Where(t => t.TransactionDate >= requestDto.StartDate && t.TransactionDate <= requestDto.FinishDate)
                .GroupBy(t => new { t.SubCategory.Category.Name, t.SubCategory.Category.Color })
                .Select(g => new TopCategoryItemDto
                {
                    CategoryName = g.Key.Name,
                    Color = g.Key.Color,
                    TotalSpent = g.Sum(t => t.Value)
                })
                .OrderByDescending(x => x.TotalSpent)
                .Take(5)
                .ToListAsync();
        }

        public async Task<List<SpendingPredictionItemDto>> GetSpendingPredictionAsync(MainPageSummaryRequestDto requestDto)
        {
            await using var context = _contextFactory.CreateDbContext();

            var today = DateOnly.FromDateTime(DateTime.UtcNow);
            var currentMonth = new DateOnly(today.Year, today.Month, 1);
            var daysInMonth = DateTime.DaysInMonth(today.Year, today.Month);
            var historyStart = currentMonth.AddMonths(-6);
            var historyEnd = currentMonth.AddDays(-1);

            // Current month expenses grouped by day
            var currentByDay = await context.Transactions
                .Where(t => t.UserId == requestDto.UserId
                    && t.Type == EnumTransactionType.Expense
                    && t.TransactionDate >= currentMonth
                    && t.TransactionDate <= today)
                .GroupBy(t => t.TransactionDate.Day)
                .Select(g => new { Day = g.Key, Total = g.Sum(t => t.Value) })
                .ToDictionaryAsync(x => x.Day, x => x.Total);

            // Historical expenses: (year, month, day, value)
            var historicalExpenses = await context.Transactions
                .Where(t => t.UserId == requestDto.UserId
                    && t.Type == EnumTransactionType.Expense
                    && t.TransactionDate >= historyStart
                    && t.TransactionDate <= historyEnd)
                .Select(t => new { t.TransactionDate.Year, t.TransactionDate.Month, t.TransactionDate.Day, t.Value })
                .ToListAsync();

            var pastMonths = Enumerable.Range(1, 6)
                .Select(i => currentMonth.AddMonths(-i))
                .Where(m => historicalExpenses.Any(e => e.Year == m.Year && e.Month == m.Month))
                .ToList();

            // ── Detect fixed-date expenses ────────────────────────────────────────
            // A day-of-month is "fixed" if a similar amount (within ±10% of the median)
            // appears on that same day in at least 3 of the last 6 months.
            var fixedDayAvg = new Dictionary<int, int>(); // day-of-month -> avg amount

            for (int d = 1; d <= 31; d++)
            {
                var amounts = pastMonths
                    .Select(m =>
                    {
                        int lastDay = DateTime.DaysInMonth(m.Year, m.Month);
                        if (d > lastDay) return (long?)null;
                        return (long?)historicalExpenses
                            .Where(e => e.Year == m.Year && e.Month == m.Month && e.Day == d)
                            .Sum(e => (long)e.Value);
                    })
                    .Where(v => v.HasValue && v.Value > 0)
                    .Select(v => v!.Value)
                    .OrderBy(v => v)
                    .ToList();

                if (amounts.Count < 3) continue;

                long median = amounts[amounts.Count / 2];
                int consistent = amounts.Count(v => Math.Abs(v - median) <= median * 0.10);
                if (consistent >= 3)
                    fixedDayAvg[d] = (int)amounts.Average();
            }

            // ── Weekday average for non-fixed days ────────────────────────────────
            var weekdayAvg = new Dictionary<DayOfWeek, int>();
            foreach (DayOfWeek dow in Enum.GetValues<DayOfWeek>())
            {
                long totalSpend = 0;
                int occurrences = 0;

                foreach (var m in pastMonths)
                {
                    int daysInHistMonth = DateTime.DaysInMonth(m.Year, m.Month);
                    for (int d = 1; d <= daysInHistMonth; d++)
                    {
                        var date = new DateOnly(m.Year, m.Month, d);
                        if (date.DayOfWeek != dow) continue;
                        if (fixedDayAvg.ContainsKey(d)) continue; // exclude fixed days

                        long daySpend = historicalExpenses
                            .Where(e => e.Year == m.Year && e.Month == m.Month && e.Day == d)
                            .Sum(e => (long)e.Value);

                        totalSpend += daySpend;
                        occurrences++;
                    }
                }

                weekdayAvg[dow] = occurrences > 0 ? (int)(totalSpend / occurrences) : 0;
            }

            // ── Build result ──────────────────────────────────────────────────────
            var result = new List<SpendingPredictionItemDto>(daysInMonth);
            int runningCurrent = 0;
            long runningHistorical = 0;

            for (int day = 1; day <= daysInMonth; day++)
            {
                if (day <= today.Day)
                    runningCurrent += currentByDay.GetValueOrDefault(day, 0);

                var date = new DateOnly(today.Year, today.Month, day);
                int dailyDelta = fixedDayAvg.TryGetValue(day, out int fixedAmt)
                    ? fixedAmt
                    : weekdayAvg[date.DayOfWeek];

                runningHistorical += dailyDelta;

                result.Add(new SpendingPredictionItemDto
                {
                    Day = day,
                    CurrentExpense = day <= today.Day ? runningCurrent : null,
                    HistoricalAverage = (int)runningHistorical
                });
            }

            return result;
        }

        /// <summary>
        /// Private methods
        /// </summary>
        private async Task<List<Transaction>> CreateOneTimeAsync(CreateTransactionRequestDto dto, int userId, int? budgetId)
        {
            var transaction = new Transaction
            {
                UserId = userId,
                BudgetId = budgetId,
                SubCategoryId = dto.SubCategoryId,
                AccountId = dto.AccountId,
                Value = dto.Value,
                Type = dto.Type,
                Description = dto.Description,
                TransactionDate = dto.TransactionDate,
                PaymentType = EnumPaymentType.OneTime,
                PaymentMethod = dto.PaymentMethod,
            };

            _context.Transactions.Add(transaction);
            return [transaction];
        }

        private async Task<List<Transaction>> CreateInstallmentsAsync(CreateTransactionRequestDto dto, int userId, int? budgetId)
        {
            if (!dto.TotalInstallments.HasValue || dto.TotalInstallments <= 0)
                return [];

            var (firstValue, otherValue) = CalculateInstallmentValues(dto.Value, dto.TotalInstallments.Value);
            var transactions = new List<Transaction>();

            var parent = new Transaction
            {
                UserId = userId,
                BudgetId = budgetId,
                SubCategoryId = dto.SubCategoryId,
                AccountId = dto.AccountId,
                Value = firstValue,
                Type = dto.Type,
                Description = dto.Description,
                TransactionDate = dto.TransactionDate,
                PaymentType = EnumPaymentType.Installment,
                PaymentMethod = dto.PaymentMethod,
                InstallmentNumber = 1,
                TotalInstallments = dto.TotalInstallments,
            };

            _context.Transactions.Add(parent);
            await _context.SaveChangesAsync();

            transactions.Add(parent);

            for (int i = 2; i <= dto.TotalInstallments; i++)
            {
                var installment = new Transaction
                {
                    UserId = userId,
                    BudgetId = budgetId,
                    SubCategoryId = dto.SubCategoryId,
                    AccountId = dto.AccountId,
                    ParentTransactionId = parent.Id,
                    Value = otherValue,
                    Type = dto.Type,
                    Description = dto.Description,
                    TransactionDate = dto.TransactionDate.AddMonths(i - 1),
                    PaymentType = EnumPaymentType.Installment,
                    PaymentMethod = dto.PaymentMethod,
                    InstallmentNumber = i,
                    TotalInstallments = dto.TotalInstallments,
                };

                _context.Transactions.Add(installment);
                transactions.Add(installment);
            }

            return transactions;
        }

        private async Task<List<Transaction>> CreateRecurringAsync(CreateTransactionRequestDto dto, int userId, int? budgetId)
        {
            var recurrence = dto.Recurrence ?? EnumRecurrenceType.None;

            if (recurrence == EnumRecurrenceType.None)
                return [];

            var recurringTemplate = new RecurringTransaction
            {
                UserId = userId,
                BudgetId = budgetId,
                SubCategoryId = dto.SubCategoryId,
                AccountId = dto.AccountId,
                Value = dto.Value,
                Type = dto.Type,
                Description = dto.Description,
                Recurrence = recurrence,
                StartDate = dto.TransactionDate,
                IsActive = true
            };

            _context.RecurringTransactions.Add(recurringTemplate);
            await _context.SaveChangesAsync();

            var transaction = new Transaction
            {
                UserId = userId,
                BudgetId = budgetId,
                SubCategoryId = dto.SubCategoryId,
                AccountId = dto.AccountId,
                RecurringTransactionId = recurringTemplate.Id,
                Value = dto.Value,
                Type = dto.Type,
                Description = dto.Description,
                TransactionDate = dto.TransactionDate,
                PaymentType = EnumPaymentType.Recurring,
                PaymentMethod = dto.PaymentMethod,
            };

            _context.Transactions.Add(transaction);
            return [transaction];
        }

        private IQueryable<GetTransactionResponseDto> GetTransactionQuery(int userId)
        {
            return _context.Transactions
                .Where(t => t.UserId == userId && !t.Account.IsSystem)
                .Select(t => new GetTransactionResponseDto
                {
                    Id = t.Id,
                    BudgetId = t.BudgetId,
                    SubCategoryId = t.SubCategoryId,
                    SubCategoryName = t.SubCategory.Name,
                    SubCategoryEmoji = t.SubCategory.Emoji,
                    AccountId = t.AccountId,
                    AccountName = t.Account.Name,
                    RecurringTransactionId = t.RecurringTransactionId,
                    ParentTransactionId = t.ParentTransactionId,
                    Value = t.Value,
                    Type = t.Type,
                    Description = t.Description,
                    TransactionDate = t.TransactionDate,
                    PaymentType = t.PaymentType,
                    PaymentMethod = t.PaymentMethod,
                    InstallmentNumber = t.InstallmentNumber,
                    TotalInstallments = t.TotalInstallments,

                    AreaId = _context.BudgetSubcategoryAllocations
                        .Where(a => a.SubCategoryId == t.SubCategoryId && a.BudgetId == t.BudgetId)
                        .Select(a => (int?)a.AreaId)
                        .FirstOrDefault(),
                    AreaName = _context.BudgetSubcategoryAllocations
                        .Where(a => a.SubCategoryId == t.SubCategoryId && a.BudgetId == t.BudgetId)
                        .Select(a => a.Area.Name)
                        .FirstOrDefault(),
                    Tags = t.Tags.Select(tag => new GetTagResponseDto { Id = tag.Id, Name = tag.Name }).ToList(),
                });
        }

        private async Task<CreateTransactionResponseDto> BuildCreateResponseAsync(List<int> transactionIds)
        {
            var transactions = await _context.Transactions
                .Include(t => t.Tags)
                .Where(t => transactionIds.Contains(t.Id))
                .Select(t => new GetTransactionResponseDto
                {
                    Id = t.Id,
                    BudgetId = t.BudgetId,
                    SubCategoryId = t.SubCategoryId,
                    SubCategoryName = t.SubCategory.Name,
                    SubCategoryEmoji = t.SubCategory.Emoji,
                    AccountId = t.AccountId,
                    AccountName = t.Account.Name,
                    RecurringTransactionId = t.RecurringTransactionId,
                    ParentTransactionId = t.ParentTransactionId,
                    Value = t.Value,
                    Type = t.Type,
                    Description = t.Description,
                    TransactionDate = t.TransactionDate,
                    PaymentType = t.PaymentType,
                    PaymentMethod = t.PaymentMethod,
                    InstallmentNumber = t.InstallmentNumber,
                    TotalInstallments = t.TotalInstallments,

                    AreaId = _context.BudgetSubcategoryAllocations
                        .Where(a => a.SubCategoryId == t.SubCategoryId && a.BudgetId == t.BudgetId)
                        .Select(a => (int?)a.AreaId)
                        .FirstOrDefault(),
                    AreaName = _context.BudgetSubcategoryAllocations
                        .Where(a => a.SubCategoryId == t.SubCategoryId && a.BudgetId == t.BudgetId)
                        .Select(a => a.Area.Name)
                        .FirstOrDefault(),
                    Tags = t.Tags.Select(tag => new GetTagResponseDto { Id = tag.Id, Name = tag.Name }).ToList(),
                })
                .ToListAsync();

            return new CreateTransactionResponseDto { Transactions = transactions };
        }

        private async Task AssociateTagsAsync(List<Transaction> transactions, List<string>? tagNames, int userId)
        {
            if (tagNames is null || tagNames.Count == 0)
                return;

            var normalizedNames = tagNames.Select(n => n.Trim()).Where(n => n.Length > 0).Distinct(StringComparer.OrdinalIgnoreCase).ToList();
            if (normalizedNames.Count == 0)
                return;

            var existingTags = await _context.Tags
                .Where(t => t.UserId == userId && normalizedNames.Contains(t.Name))
                .ToListAsync();

            var existingNames = existingTags.Select(t => t.Name).ToHashSet(StringComparer.OrdinalIgnoreCase);
            foreach (var name in normalizedNames.Where(n => !existingNames.Contains(n)))
            {
                var tag = new Tag { UserId = userId, Name = name };
                _context.Tags.Add(tag);
                existingTags.Add(tag);
            }

            await _context.SaveChangesAsync();

            foreach (var transaction in transactions)
            {
                var fullTransaction = await _context.Transactions
                    .Include(t => t.Tags)
                    .FirstAsync(t => t.Id == transaction.Id);

                fullTransaction.Tags.Clear();
                foreach (var tag in existingTags)
                    fullTransaction.Tags.Add(tag);
            }

            await _context.SaveChangesAsync();
        }

        private static (int firstValue, int otherValue) CalculateInstallmentValues(int total, int installments)
        {
            var baseValue = total / installments;
            var remainder = total % installments;
            return (baseValue + remainder, baseValue);
        }
    }
}

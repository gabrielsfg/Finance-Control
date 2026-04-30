using System.Globalization;
using FinanceControl.Data.Data;
using FinanceControl.Domain.Interfaces.Services;
using FinanceControl.Shared.Dtos.Request;
using FinanceControl.Shared.Dtos.Response.Analytics;
using FinanceControl.Shared.Enums;
using FinanceControl.Shared.Helpers;
using Microsoft.EntityFrameworkCore;

namespace FinanceControl.Services.Services
{
    public class AnalyticsService : IAnalyticsService
    {
        private readonly IDbContextFactory<ApplicationDbContext> _contextFactory;

        public AnalyticsService(IDbContextFactory<ApplicationDbContext> contextFactory)
        {
            _contextFactory = contextFactory;
        }

        public async Task<AnalyticsSummaryDto> GetSummaryAsync(int userId, int lookbackMonths = 7)
        {
            await using var context = _contextFactory.CreateDbContext();

            var today = DateOnly.FromDateTime(DateTime.UtcNow);
            var startDate = new DateOnly(today.Year, today.Month, 1).AddMonths(-lookbackMonths + 1);

            // Monthly income/expense for the lookback window
            var monthly = await context.Transactions
                .Where(t => t.UserId == userId)
                .Where(t => t.TransactionDate >= startDate && t.TransactionDate <= today)
                .GroupBy(t => new { t.TransactionDate.Year, t.TransactionDate.Month })
                .Select(g => new
                {
                    g.Key.Year,
                    g.Key.Month,
                    TotalIncome  = g.Where(t => t.Type == EnumTransactionType.Income).Sum(t => (int?)t.Value) ?? 0,
                    TotalExpense = g.Where(t => t.Type == EnumTransactionType.Expense).Sum(t => (int?)t.Value) ?? 0
                })
                .OrderBy(x => x.Year).ThenBy(x => x.Month)
                .ToListAsync();

            if (monthly.Count == 0)
                return new AnalyticsSummaryDto();

            var avgIncome  = (int)Math.Round(monthly.Average(m => m.TotalIncome));
            var avgExpense = (int)Math.Round(monthly.Average(m => m.TotalExpense));

            var withBalance = monthly
                .Select(m => new { m.Year, m.Month, m.TotalIncome, m.TotalExpense, Balance = m.TotalIncome - m.TotalExpense })
                .ToList();

            var best  = withBalance.MaxBy(m => m.Balance)!;
            var worst = withBalance.MinBy(m => m.Balance)!;

            static string MonthLabel(int year, int month) =>
                new DateOnly(year, month, 1).ToString("MMMM yyyy", new CultureInfo("pt-BR"));

            // Category breakdown for the current (most recent) month and previous month
            var currentMonthStart  = new DateOnly(today.Year, today.Month, 1);
            var previousMonthStart = currentMonthStart.AddMonths(-1);
            var previousMonthEnd   = currentMonthStart.AddDays(-1);

            var currentExpenses = await context.Transactions
                .Where(t => t.UserId == userId)
                .Where(t => t.Type == EnumTransactionType.Expense)
                .Where(t => t.TransactionDate >= currentMonthStart && t.TransactionDate <= today)
                .Select(t => new
                {
                    CategoryId   = t.SubCategory.Category.Id,
                    CategoryName = t.SubCategory.Category.Name,
                    Color        = t.SubCategory.Category.Color,
                    t.Value
                })
                .ToListAsync();

            var previousExpenses = await context.Transactions
                .Where(t => t.UserId == userId)
                .Where(t => t.Type == EnumTransactionType.Expense)
                .Where(t => t.TransactionDate >= previousMonthStart && t.TransactionDate <= previousMonthEnd)
                .Select(t => new
                {
                    CategoryId = t.SubCategory.Category.Id,
                    t.Value
                })
                .ToListAsync();

            var currentTotal = currentExpenses.Sum(e => e.Value);
            var prevByCategory = previousExpenses
                .GroupBy(e => e.CategoryId)
                .ToDictionary(g => g.Key, g => g.Sum(e => e.Value));

            var categoryBreakdown = currentExpenses
                .GroupBy(e => new { e.CategoryId, e.CategoryName, e.Color })
                .Select(g =>
                {
                    var spent = g.Sum(e => e.Value);
                    var percent = currentTotal > 0 ? Math.Round((decimal)spent / currentTotal * 100, 1) : 0m;
                    decimal? change = null;
                    if (prevByCategory.TryGetValue(g.Key.CategoryId, out var prevSpent) && prevSpent > 0)
                        change = Math.Round((decimal)(spent - prevSpent) / prevSpent * 100, 1);
                    return new CategorySummaryItemDto
                    {
                        CategoryId   = g.Key.CategoryId,
                        CategoryName = g.Key.CategoryName,
                        Color        = g.Key.Color,
                        TotalSpent   = spent,
                        Percent      = percent,
                        Change       = change
                    };
                })
                .OrderByDescending(c => c.TotalSpent)
                .ToList();

            return new AnalyticsSummaryDto
            {
                AvgMonthlyIncome   = avgIncome,
                AvgMonthlyExpense  = avgExpense,
                AvgMonthlyBalance  = avgIncome - avgExpense,
                BestMonth  = new MonthSummaryDto { Year = best.Year,  Month = best.Month,  Label = MonthLabel(best.Year,  best.Month),  TotalIncome = best.TotalIncome,  TotalExpense = best.TotalExpense,  Balance = best.Balance  },
                WorstMonth = new MonthSummaryDto { Year = worst.Year, Month = worst.Month, Label = MonthLabel(worst.Year, worst.Month), TotalIncome = worst.TotalIncome, TotalExpense = worst.TotalExpense, Balance = worst.Balance },
                CategoryBreakdown  = categoryBreakdown
            };
        }

        public async Task<List<IncomeExpenseItemDto>> GetIncomeExpenseAsync(AnalyticsRequestDto requestDto)
        {
            await using var context = _contextFactory.CreateDbContext();

            return await context.Transactions
                .Where(t => t.UserId == requestDto.UserId)
                .Where(t => t.TransactionDate >= requestDto.StartDate && t.TransactionDate <= requestDto.FinishDate)
                .WhereIf(requestDto.AccountId.HasValue, t => t.AccountId == requestDto.AccountId)
                .GroupBy(t => new { t.TransactionDate.Year, t.TransactionDate.Month })
                .Select(g => new IncomeExpenseItemDto
                {
                    Year = g.Key.Year,
                    Month = g.Key.Month,
                    TotalIncome = g.Where(t => t.Type == EnumTransactionType.Income).Sum(t => (int?)t.Value) ?? 0,
                    TotalExpense = g.Where(t => t.Type == EnumTransactionType.Expense).Sum(t => (int?)t.Value) ?? 0
                })
                .OrderBy(x => x.Year).ThenBy(x => x.Month)
                .ToListAsync();
        }

        public async Task<List<BalanceEvolutionItemDto>> GetBalanceEvolutionAsync(AnalyticsRequestDto requestDto)
        {
            await using var context = _contextFactory.CreateDbContext();

            // Sum all transactions before the period to get the opening balance
            var openingBalance = await context.Transactions
                .Where(t => t.UserId == requestDto.UserId)
                .Where(t => t.TransactionDate < requestDto.StartDate)
                .WhereIf(requestDto.AccountId.HasValue, t => t.AccountId == requestDto.AccountId)
                .GroupBy(_ => 1)
                .Select(g => new
                {
                    Income = g.Where(t => t.Type == EnumTransactionType.Income).Sum(t => (int?)t.Value) ?? 0,
                    Expense = g.Where(t => t.Type == EnumTransactionType.Expense).Sum(t => (int?)t.Value) ?? 0
                })
                .FirstOrDefaultAsync();

            var runningBalance = openingBalance is null ? 0 : openingBalance.Income - openingBalance.Expense;

            // Daily net movements within the period
            var dailyMovements = await context.Transactions
                .Where(t => t.UserId == requestDto.UserId)
                .Where(t => t.TransactionDate >= requestDto.StartDate && t.TransactionDate <= requestDto.FinishDate)
                .WhereIf(requestDto.AccountId.HasValue, t => t.AccountId == requestDto.AccountId)
                .GroupBy(t => t.TransactionDate)
                .Select(g => new
                {
                    Date = g.Key,
                    Net = g.Where(t => t.Type == EnumTransactionType.Income).Sum(t => (int?)t.Value) ?? 0
                          - (g.Where(t => t.Type == EnumTransactionType.Expense).Sum(t => (int?)t.Value) ?? 0)
                })
                .OrderBy(x => x.Date)
                .ToListAsync();

            var result = new List<BalanceEvolutionItemDto>();
            foreach (var day in dailyMovements)
            {
                runningBalance += day.Net;
                result.Add(new BalanceEvolutionItemDto { Date = day.Date, Balance = runningBalance });
            }

            return result;
        }

        public async Task<List<ExpensesByCategoryDto>> GetExpensesByCategoryAsync(AnalyticsRequestDto requestDto)
        {
            await using var context = _contextFactory.CreateDbContext();

            var rows = await context.Transactions
                .Where(t => t.UserId == requestDto.UserId)
                .Where(t => t.Type == EnumTransactionType.Expense)
                .Where(t => t.TransactionDate >= requestDto.StartDate && t.TransactionDate <= requestDto.FinishDate)
                .WhereIf(requestDto.AccountId.HasValue, t => t.AccountId == requestDto.AccountId)
                .Select(t => new
                {
                    CategoryId = t.SubCategory.Category.Id,
                    CategoryName = t.SubCategory.Category.Name,
                    SubCategoryId = t.SubCategory.Id,
                    SubCategoryName = t.SubCategory.Name,
                    t.Value
                })
                .ToListAsync();

            return rows
                .GroupBy(r => new { r.CategoryId, r.CategoryName })
                .Select(cg => new ExpensesByCategoryDto
                {
                    CategoryId = cg.Key.CategoryId,
                    CategoryName = cg.Key.CategoryName,
                    Total = cg.Sum(r => r.Value),
                    Subcategories = cg
                        .GroupBy(r => new { r.SubCategoryId, r.SubCategoryName })
                        .Select(sg => new SubCategoryExpenseItemDto
                        {
                            Id = sg.Key.SubCategoryId,
                            Name = sg.Key.SubCategoryName,
                            Total = sg.Sum(r => r.Value)
                        })
                        .OrderByDescending(s => s.Total)
                        .ToList()
                })
                .OrderByDescending(c => c.Total)
                .ToList();
        }

        public async Task<List<CategoryEvolutionItemDto>> GetCategoryEvolutionAsync(AnalyticsRequestDto requestDto, int categoryId)
        {
            await using var context = _contextFactory.CreateDbContext();

            return await context.Transactions
                .Where(t => t.UserId == requestDto.UserId)
                .Where(t => t.Type == EnumTransactionType.Expense)
                .Where(t => t.SubCategory.CategoryId == categoryId)
                .Where(t => t.TransactionDate >= requestDto.StartDate && t.TransactionDate <= requestDto.FinishDate)
                .WhereIf(requestDto.AccountId.HasValue, t => t.AccountId == requestDto.AccountId)
                .GroupBy(t => new { t.TransactionDate.Year, t.TransactionDate.Month })
                .Select(g => new CategoryEvolutionItemDto
                {
                    Year = g.Key.Year,
                    Month = g.Key.Month,
                    Total = g.Sum(t => t.Value)
                })
                .OrderBy(x => x.Year).ThenBy(x => x.Month)
                .ToListAsync();
        }

        public async Task<List<NetWorthEvolutionItemDto>> GetNetWorthEvolutionAsync(AnalyticsRequestDto requestDto)
        {
            await using var context = _contextFactory.CreateDbContext();

            // Fetch all transactions up to the end of the period, grouped by account and month
            var allTransactions = await context.Transactions
                .Where(t => t.UserId == requestDto.UserId)
                .Where(t => t.TransactionDate <= requestDto.FinishDate)
                .Select(t => new
                {
                    t.AccountId,
                    AccountName = t.Account.Name,
                    t.TransactionDate.Year,
                    t.TransactionDate.Month,
                    Net = t.Type == EnumTransactionType.Income ? t.Value : -t.Value
                })
                .ToListAsync();

            // Build cumulative account balances month by month within the requested range
            var months = new List<(int Year, int Month)>();
            var cursor = new DateOnly(requestDto.StartDate.Year, requestDto.StartDate.Month, 1);
            var end = new DateOnly(requestDto.FinishDate.Year, requestDto.FinishDate.Month, 1);
            while (cursor <= end)
            {
                months.Add((cursor.Year, cursor.Month));
                cursor = cursor.AddMonths(1);
            }

            // Cumulative net per account up to each month
            var result = new List<NetWorthEvolutionItemDto>();
            foreach (var (year, month) in months)
            {
                var snapshot = allTransactions
                    .Where(t => t.Year < year || (t.Year == year && t.Month <= month))
                    .GroupBy(t => new { t.AccountId, t.AccountName })
                    .Select(g => new AccountBalanceItemDto
                    {
                        AccountId = g.Key.AccountId,
                        AccountName = g.Key.AccountName,
                        Balance = g.Sum(t => t.Net)
                    })
                    .OrderBy(a => a.AccountName)
                    .ToList();

                result.Add(new NetWorthEvolutionItemDto
                {
                    Year = year,
                    Month = month,
                    NetWorth = snapshot.Sum(a => a.Balance),
                    Breakdown = snapshot
                });
            }

            return result;
        }

        public async Task<List<FutureCommitmentsItemDto>> GetFutureCommitmentsAsync(int userId, int months)
        {
            await using var context = _contextFactory.CreateDbContext();

            var today = DateOnly.FromDateTime(DateTime.UtcNow);
            var periodEnd = today.AddMonths(months);

            // Pending installments: transactions with future dates that are part of a multi-installment series
            var installments = await context.Transactions
                .Where(t => t.UserId == userId)
                .Where(t => t.Type == EnumTransactionType.Expense)
                .Where(t => t.TransactionDate > today && t.TransactionDate <= periodEnd)
                .Where(t => t.PaymentType == EnumPaymentType.Installment || t.PaymentType == EnumPaymentType.Recurring)
                .Select(t => new
                {
                    t.TransactionDate.Year,
                    t.TransactionDate.Month,
                    t.Description,
                    t.Value
                })
                .ToListAsync();

            return installments
                .GroupBy(t => new { t.Year, t.Month })
                .Select(g => new FutureCommitmentsItemDto
                {
                    Year = g.Key.Year,
                    Month = g.Key.Month,
                    TotalCommitted = g.Sum(t => t.Value),
                    Installments = g.Select(t => new CommitmentDetailDto
                    {
                        Description = t.Description,
                        Value = t.Value
                    }).ToList()
                })
                .OrderBy(x => x.Year).ThenBy(x => x.Month)
                .ToList();
        }

        public async Task<BalanceProjectionDto> GetBalanceProjectionAsync(int userId, int? accountId, int lookbackDays = 30)
        {
            await using var context = _contextFactory.CreateDbContext();

            var today = DateOnly.FromDateTime(DateTime.UtcNow);
            var lookbackStart = today.AddDays(-lookbackDays);
            var monthEnd = new DateOnly(today.Year, today.Month, DateTime.DaysInMonth(today.Year, today.Month));

            // Opening balance: everything before the lookback window
            var opening = await context.Transactions
                .Where(t => t.UserId == userId && t.TransactionDate < lookbackStart)
                .WhereIf(accountId.HasValue, t => t.AccountId == accountId)
                .GroupBy(_ => 1)
                .Select(g => new
                {
                    Income = g.Where(t => t.Type == EnumTransactionType.Income).Sum(t => (int?)t.Value) ?? 0,
                    Expense = g.Where(t => t.Type == EnumTransactionType.Expense).Sum(t => (int?)t.Value) ?? 0
                })
                .FirstOrDefaultAsync();

            var openingBalance = opening is null ? 0 : opening.Income - opening.Expense;

            // Daily movements in the lookback window
            var dailyMovements = await context.Transactions
                .Where(t => t.UserId == userId)
                .Where(t => t.TransactionDate >= lookbackStart && t.TransactionDate <= today)
                .WhereIf(accountId.HasValue, t => t.AccountId == accountId)
                .GroupBy(t => t.TransactionDate)
                .Select(g => new
                {
                    Date = g.Key,
                    Income = g.Where(t => t.Type == EnumTransactionType.Income).Sum(t => (int?)t.Value) ?? 0,
                    Expense = g.Where(t => t.Type == EnumTransactionType.Expense).Sum(t => (int?)t.Value) ?? 0
                })
                .OrderBy(x => x.Date)
                .ToListAsync();

            var totalIncome = dailyMovements.Sum(d => d.Income);
            var totalExpense = dailyMovements.Sum(d => d.Expense);
            var dailyAvgIncome = lookbackDays > 0 ? Math.Round((decimal)totalIncome / lookbackDays, 2) : 0m;
            var dailyAvgExpense = lookbackDays > 0 ? Math.Round((decimal)totalExpense / lookbackDays, 2) : 0m;
            var dailyAvgNet = dailyAvgIncome - dailyAvgExpense;

            // Build actual points
            var actual = new List<BalanceProjectionPointDto>();
            var balance = openingBalance;
            foreach (var day in dailyMovements)
            {
                balance += day.Income - day.Expense;
                actual.Add(new BalanceProjectionPointDto { Date = day.Date, Balance = balance });
            }

            var currentBalance = balance;

            // Project from tomorrow to end of month
            var projected = new List<BalanceProjectionPointDto>();
            var projectedBalance = currentBalance;
            var projCursor = today.AddDays(1);
            while (projCursor <= monthEnd)
            {
                projectedBalance += (int)Math.Round(dailyAvgNet);
                projected.Add(new BalanceProjectionPointDto { Date = projCursor, Balance = projectedBalance });
                projCursor = projCursor.AddDays(1);
            }

            return new BalanceProjectionDto
            {
                CurrentBalance = currentBalance,
                ProjectedBalance = projected.LastOrDefault()?.Balance ?? currentBalance,
                DailyAvgIncome = dailyAvgIncome,
                DailyAvgExpense = dailyAvgExpense,
                Actual = actual,
                Projected = projected
            };
        }

        public async Task<List<CategoryProjectionDto>> GetCategoryProjectionAsync(int userId, int? accountId, int lookbackMonths = 3)
        {
            await using var context = _contextFactory.CreateDbContext();

            var today = DateOnly.FromDateTime(DateTime.UtcNow);
            var historicalStart = today.AddMonths(-lookbackMonths);
            var monthStart = new DateOnly(today.Year, today.Month, 1);

            // Historical spending per category over lookback window (excluding current month)
            var historical = await context.Transactions
                .Where(t => t.UserId == userId)
                .Where(t => t.Type == EnumTransactionType.Expense)
                .Where(t => t.TransactionDate >= historicalStart && t.TransactionDate < monthStart)
                .WhereIf(accountId.HasValue, t => t.AccountId == accountId)
                .GroupBy(t => new { t.SubCategory.Category.Id, t.SubCategory.Category.Name })
                .Select(g => new
                {
                    CategoryId = g.Key.Id,
                    CategoryName = g.Key.Name,
                    Total = g.Sum(t => t.Value)
                })
                .ToListAsync();

            // Current month spending per category
            var currentMonth = await context.Transactions
                .Where(t => t.UserId == userId)
                .Where(t => t.Type == EnumTransactionType.Expense)
                .Where(t => t.TransactionDate >= monthStart && t.TransactionDate <= today)
                .WhereIf(accountId.HasValue, t => t.AccountId == accountId)
                .GroupBy(t => new { t.SubCategory.Category.Id, t.SubCategory.Category.Name })
                .Select(g => new
                {
                    CategoryId = g.Key.Id,
                    CategoryName = g.Key.Name,
                    Spent = g.Sum(t => t.Value)
                })
                .ToListAsync();

            var daysInMonth = DateTime.DaysInMonth(today.Year, today.Month);
            var monthElapsedPercent = Math.Round((decimal)today.Day / daysInMonth * 100, 1);

            var result = new List<CategoryProjectionDto>();
            var allCategoryIds = historical.Select(h => h.CategoryId)
                .Union(currentMonth.Select(c => c.CategoryId))
                .Distinct();

            foreach (var categoryId in allCategoryIds)
            {
                var hist = historical.FirstOrDefault(h => h.CategoryId == categoryId);
                var curr = currentMonth.FirstOrDefault(c => c.CategoryId == categoryId);

                var monthlyAvg = hist is not null
                    ? Math.Round((decimal)hist.Total / lookbackMonths, 2)
                    : 0m;

                var spentSoFar = curr?.Spent ?? 0;

                // Project total for current month: use daily rate from historical avg
                var dailyRate = daysInMonth > 0 ? monthlyAvg / daysInMonth : 0m;
                var projected = (int)Math.Round(spentSoFar + dailyRate * (daysInMonth - today.Day));

                var spentPercent = monthlyAvg > 0
                    ? Math.Round((decimal)spentSoFar / monthlyAvg * 100, 1)
                    : 0m;

                result.Add(new CategoryProjectionDto
                {
                    CategoryId = categoryId,
                    CategoryName = hist?.CategoryName ?? curr?.CategoryName ?? string.Empty,
                    SpentSoFar = spentSoFar,
                    ProjectedTotal = projected,
                    HistoricalMonthlyAvg = monthlyAvg,
                    MonthElapsedPercent = monthElapsedPercent,
                    SpentPercent = spentPercent
                });
            }

            return result.OrderByDescending(r => r.ProjectedTotal).ToList();
        }

        public async Task<NetWorthProjectionDto> GetNetWorthProjectionAsync(int userId, int projectionMonths = 12, int? targetAmount = null)
        {
            await using var context = _contextFactory.CreateDbContext();

            var today = DateOnly.FromDateTime(DateTime.UtcNow);

            // Get all transactions to build monthly net worth history (last 12 months)
            var historyStart = new DateOnly(today.Year, today.Month, 1).AddMonths(-11);

            var allTransactions = await context.Transactions
                .Where(t => t.UserId == userId)
                .Where(t => t.TransactionDate <= today)
                .Select(t => new
                {
                    t.TransactionDate.Year,
                    t.TransactionDate.Month,
                    Net = t.Type == EnumTransactionType.Income ? t.Value : -t.Value
                })
                .ToListAsync();

            // Build cumulative net worth per month
            var historical = new List<NetWorthProjectionPointDto>();
            var months = new List<(int Year, int Month)>();
            var cursor = historyStart;
            var end = new DateOnly(today.Year, today.Month, 1);
            while (cursor <= end)
            {
                months.Add((cursor.Year, cursor.Month));
                cursor = cursor.AddMonths(1);
            }

            foreach (var (year, month) in months)
            {
                var nw = allTransactions
                    .Where(t => t.Year < year || (t.Year == year && t.Month <= month))
                    .Sum(t => t.Net);
                historical.Add(new NetWorthProjectionPointDto { Year = year, Month = month, NetWorth = nw });
            }

            var currentNetWorth = historical.LastOrDefault()?.NetWorth ?? 0;

            // Calculate average monthly growth from history
            decimal monthlyAvgGrowth = 0m;
            if (historical.Count >= 2)
            {
                var growthSamples = historical
                    .Skip(1)
                    .Select((h, i) => h.NetWorth - historical[i].NetWorth)
                    .ToList();
                monthlyAvgGrowth = Math.Round((decimal)growthSamples.Sum() / growthSamples.Count, 2);
            }

            // Build projection
            var projected = new List<NetWorthProjectionPointDto>();
            var projNw = currentNetWorth;
            var projCursor = new DateOnly(today.Year, today.Month, 1).AddMonths(1);
            int? monthsUntilZero = null;
            int? monthsUntilTarget = null;

            for (var i = 1; i <= projectionMonths; i++)
            {
                projNw += (int)Math.Round(monthlyAvgGrowth);
                projected.Add(new NetWorthProjectionPointDto { Year = projCursor.Year, Month = projCursor.Month, NetWorth = projNw });

                if (monthlyAvgGrowth < 0 && monthsUntilZero is null && projNw <= 0)
                    monthsUntilZero = i;

                if (targetAmount.HasValue && monthsUntilTarget is null && projNw >= targetAmount.Value)
                    monthsUntilTarget = i;

                projCursor = projCursor.AddMonths(1);
            }

            return new NetWorthProjectionDto
            {
                CurrentNetWorth = currentNetWorth,
                MonthlyAvgGrowth = monthlyAvgGrowth,
                MonthsUntilZero = monthsUntilZero,
                MonthsUntilTarget = monthsUntilTarget,
                TargetAmount = targetAmount,
                Historical = historical,
                Projected = projected
            };
        }

        public async Task<CommitmentsImpactDto> GetCommitmentsImpactAsync(int userId, int months = 6)
        {
            await using var context = _contextFactory.CreateDbContext();

            var today = DateOnly.FromDateTime(DateTime.UtcNow);
            var periodEnd = today.AddMonths(months);

            // Current balance: all transactions up to today
            var balanceSummary = await context.Transactions
                .Where(t => t.UserId == userId && t.TransactionDate <= today)
                .GroupBy(_ => 1)
                .Select(g => new
                {
                    Income = g.Where(t => t.Type == EnumTransactionType.Income).Sum(t => (int?)t.Value) ?? 0,
                    Expense = g.Where(t => t.Type == EnumTransactionType.Expense).Sum(t => (int?)t.Value) ?? 0
                })
                .FirstOrDefaultAsync();

            var currentBalance = balanceSummary is null ? 0 : balanceSummary.Income - balanceSummary.Expense;

            // Future installments and recurring transactions
            var futureCommitments = await context.Transactions
                .Where(t => t.UserId == userId)
                .Where(t => t.Type == EnumTransactionType.Expense)
                .Where(t => t.TransactionDate > today && t.TransactionDate <= periodEnd)
                .Where(t => t.PaymentType == EnumPaymentType.Installment || t.PaymentType == EnumPaymentType.Recurring)
                .Select(t => new
                {
                    t.TransactionDate.Year,
                    t.TransactionDate.Month,
                    t.Description,
                    t.Value
                })
                .ToListAsync();

            // Average monthly income from last 3 months as projected income
            var threeMonthsAgo = today.AddMonths(-3);
            var avgMonthlyIncome = await context.Transactions
                .Where(t => t.UserId == userId)
                .Where(t => t.Type == EnumTransactionType.Income)
                .Where(t => t.TransactionDate >= threeMonthsAgo && t.TransactionDate <= today)
                .GroupBy(_ => 1)
                .Select(g => g.Sum(t => (int?)t.Value) ?? 0)
                .FirstOrDefaultAsync();

            var projectedMonthlyIncome = (int)Math.Round((decimal)avgMonthlyIncome / 3);

            var result = new List<CommitmentsImpactMonthDto>();
            var runningBalance = currentBalance;

            var monthCursor = new DateOnly(today.Year, today.Month, 1).AddMonths(1);
            for (var i = 0; i < months; i++)
            {
                var year = monthCursor.Year;
                var month = monthCursor.Month;

                var monthCommitments = futureCommitments
                    .Where(t => t.Year == year && t.Month == month)
                    .ToList();

                var totalCommitments = monthCommitments.Sum(t => t.Value);
                runningBalance += projectedMonthlyIncome - totalCommitments;

                result.Add(new CommitmentsImpactMonthDto
                {
                    Year = year,
                    Month = month,
                    ProjectedIncome = projectedMonthlyIncome,
                    TotalCommitments = totalCommitments,
                    ProjectedBalance = runningBalance,
                    IsNegative = runningBalance < 0,
                    Commitments = monthCommitments.Select(t => new CommitmentDetailDto
                    {
                        Description = t.Description,
                        Value = t.Value
                    }).ToList()
                });

                monthCursor = monthCursor.AddMonths(1);
            }

            return new CommitmentsImpactDto
            {
                CurrentBalance = currentBalance,
                Months = result
            };
        }

        public async Task<BudgetPaceDto?> GetBudgetPaceAsync(int budgetId, int userId)
        {
            await using var context = _contextFactory.CreateDbContext();

            var budget = await context.Budgets
                .FirstOrDefaultAsync(b => b.Id == budgetId && b.UserId == userId);

            if (budget is null) return null;

            var periodStart = new DateOnly(DateTime.UtcNow.Year, DateTime.UtcNow.Month, budget.StartDate);
            var periodEnd = budget.Recurrence switch
            {
                EnumBudgetRecurrence.Weekly       => periodStart.AddDays(7),
                EnumBudgetRecurrence.Biweekly     => periodStart.AddDays(14),
                EnumBudgetRecurrence.Monthly      => periodStart.AddMonths(1),
                EnumBudgetRecurrence.Semiannually => periodStart.AddMonths(6),
                EnumBudgetRecurrence.Annually     => periodStart.AddYears(1),
                _                                 => periodStart.AddMonths(1)
            };

            var totalExpected = await context.BudgetSubcategoryAllocations
                .Where(a => a.BudgetId == budgetId)
                .SumAsync(a => (int?)a.ExpectedValue) ?? 0;

            var totalDays = (periodEnd.ToDateTime(TimeOnly.MinValue) - periodStart.ToDateTime(TimeOnly.MinValue)).TotalDays;
            var dailyIdeal = totalDays > 0 ? Math.Round((decimal)totalExpected / (decimal)totalDays, 2) : 0m;

            // Accumulated daily expenses within the current period (up to today)
            var today = DateOnly.FromDateTime(DateTime.UtcNow);
            var effectiveEnd = today < periodEnd ? today : periodEnd;

            var dailyExpenses = await context.Transactions
                .Where(t => t.UserId == userId)
                .Where(t => t.BudgetId == budgetId)
                .Where(t => t.Type == EnumTransactionType.Expense)
                .Where(t => t.TransactionDate >= periodStart && t.TransactionDate <= effectiveEnd)
                .GroupBy(t => t.TransactionDate)
                .Select(g => new { Date = g.Key, Total = g.Sum(t => t.Value) })
                .OrderBy(x => x.Date)
                .ToListAsync();

            var actual = new List<BudgetPacePointDto>();
            var accumulated = 0;
            foreach (var day in dailyExpenses)
            {
                accumulated += day.Total;
                actual.Add(new BudgetPacePointDto { Date = day.Date, Accumulated = accumulated });
            }

            return new BudgetPaceDto
            {
                DailyIdeal = dailyIdeal,
                PeriodStart = periodStart,
                PeriodEnd = periodEnd,
                TotalExpected = totalExpected,
                Actual = actual
            };
        }

        public async Task<List<SpendingHeatmapItemDto>> GetSpendingHeatmapAsync(AnalyticsRequestDto requestDto)
        {
            await using var context = _contextFactory.CreateDbContext();

            return await context.Transactions
                .Where(t => t.UserId == requestDto.UserId)
                .Where(t => t.Type == EnumTransactionType.Expense)
                .Where(t => t.TransactionDate >= requestDto.StartDate && t.TransactionDate <= requestDto.FinishDate)
                .WhereIf(requestDto.AccountId.HasValue, t => t.AccountId == requestDto.AccountId)
                .GroupBy(t => t.TransactionDate)
                .Select(g => new SpendingHeatmapItemDto
                {
                    Date = g.Key,
                    Total = g.Sum(t => t.Value)
                })
                .OrderBy(x => x.Date)
                .ToListAsync();
        }
    }
}

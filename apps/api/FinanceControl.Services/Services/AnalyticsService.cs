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
        private readonly IHttpClientFactory _httpClientFactory;

        public AnalyticsService(IDbContextFactory<ApplicationDbContext> contextFactory, IHttpClientFactory httpClientFactory)
        {
            _contextFactory = contextFactory;
            _httpClientFactory = httpClientFactory;
        }

        public async Task<AnalyticsSummaryDto> GetSummaryAsync(AnalyticsRequestDto requestDto)
        {
            await using var context = _contextFactory.CreateDbContext();

            // Monthly income/expense for the requested period
            var monthly = await context.Transactions
                .Where(t => t.UserId == requestDto.UserId)
                .Where(t => t.TransactionDate >= requestDto.StartDate && t.TransactionDate <= requestDto.FinishDate)
                .WhereIf(requestDto.AccountIds.Count > 0,    t => requestDto.AccountIds.Contains(t.AccountId))
                .WhereIf(requestDto.CategoryIds.Count > 0,   t => requestDto.CategoryIds.Contains(t.SubCategory.CategoryId))
                .WhereIf(requestDto.TagIds.Count > 0,        t => t.Tags.Any(tag => requestDto.TagIds.Contains(tag.Id)))
                .WhereIf(requestDto.PaymentType.HasValue,    t => t.PaymentType == requestDto.PaymentType)
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

            // When a TransactionType filter is active, only count the relevant side
            var filteredMonthly = requestDto.TransactionType switch
            {
                EnumTransactionType.Income  => monthly.Select(m => new { m.Year, m.Month, TotalIncome = m.TotalIncome, TotalExpense = 0 }).ToList(),
                EnumTransactionType.Expense => monthly.Select(m => new { m.Year, m.Month, TotalIncome = 0, TotalExpense = m.TotalExpense }).ToList(),
                _                           => monthly.Select(m => new { m.Year, m.Month, m.TotalIncome, m.TotalExpense }).ToList()
            };

            var avgIncome  = (int)Math.Round(filteredMonthly.Average(m => m.TotalIncome));
            var avgExpense = (int)Math.Round(filteredMonthly.Average(m => m.TotalExpense));

            var withBalance = filteredMonthly
                .Select(m => new { m.Year, m.Month, m.TotalIncome, m.TotalExpense, Balance = m.TotalIncome - m.TotalExpense })
                .ToList();

            var best  = withBalance.MaxBy(m => m.Balance)!;
            var worst = withBalance.MinBy(m => m.Balance)!;

            static string MonthLabel(int year, int month) =>
                new DateOnly(year, month, 1).ToString("MMMM yyyy", new CultureInfo("pt-BR"));

            // Category breakdown: last month of the selected range vs. the month before it
            var lastMonthEnd   = requestDto.FinishDate;
            var lastMonthStart = new DateOnly(lastMonthEnd.Year, lastMonthEnd.Month, 1);
            var prevMonthStart = lastMonthStart.AddMonths(-1);
            var prevMonthEnd   = lastMonthStart.AddDays(-1);

            var currentExpenses = await context.Transactions
                .Where(t => t.UserId == requestDto.UserId)
                .Where(t => t.Type == EnumTransactionType.Expense)
                .Where(t => t.TransactionDate >= lastMonthStart && t.TransactionDate <= lastMonthEnd)
                .WhereIf(requestDto.AccountIds.Count > 0, t => requestDto.AccountIds.Contains(t.AccountId))
                .WhereIf(requestDto.CategoryIds.Count > 0, t => requestDto.CategoryIds.Contains(t.SubCategory.CategoryId))
                .WhereIf(requestDto.TagIds.Count > 0, t => t.Tags.Any(tag => requestDto.TagIds.Contains(tag.Id)))
                .WhereIf(requestDto.PaymentType.HasValue, t => t.PaymentType == requestDto.PaymentType)
                .Select(t => new
                {
                    CategoryId   = t.SubCategory.Category.Id,
                    CategoryName = t.SubCategory.Category.Name,
                    Color        = t.SubCategory.Category.Color,
                    t.Value
                })
                .ToListAsync();

            var previousExpenses = await context.Transactions
                .Where(t => t.UserId == requestDto.UserId)
                .Where(t => t.Type == EnumTransactionType.Expense)
                .Where(t => t.TransactionDate >= prevMonthStart && t.TransactionDate <= prevMonthEnd)
                .WhereIf(requestDto.AccountIds.Count > 0, t => requestDto.AccountIds.Contains(t.AccountId))
                .WhereIf(requestDto.CategoryIds.Count > 0, t => requestDto.CategoryIds.Contains(t.SubCategory.CategoryId))
                .WhereIf(requestDto.TagIds.Count > 0, t => t.Tags.Any(tag => requestDto.TagIds.Contains(tag.Id)))
                .WhereIf(requestDto.PaymentType.HasValue, t => t.PaymentType == requestDto.PaymentType)
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

            var categoryItems = currentExpenses
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

            var categoryBreakdown = new CategoryBreakdownDto
            {
                MaxSpent = categoryItems.Count > 0 ? categoryItems.Max(c => c.TotalSpent) : 0,
                Items    = categoryItems
            };

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
                .WhereIf(requestDto.AccountIds.Count > 0,    t => requestDto.AccountIds.Contains(t.AccountId))
                .WhereIf(requestDto.CategoryIds.Count > 0,   t => requestDto.CategoryIds.Contains(t.SubCategory.CategoryId))
                .WhereIf(requestDto.TagIds.Count > 0,        t => t.Tags.Any(tag => requestDto.TagIds.Contains(tag.Id)))
                .WhereIf(requestDto.TransactionType.HasValue, t => t.Type == requestDto.TransactionType)
                .WhereIf(requestDto.PaymentType.HasValue,    t => t.PaymentType == requestDto.PaymentType)
                .GroupBy(t => new { t.TransactionDate.Year, t.TransactionDate.Month })
                .Select(g => new IncomeExpenseItemDto
                {
                    Year = g.Key.Year,
                    Month = g.Key.Month,
                    TotalIncome  = g.Where(t => t.Type == EnumTransactionType.Income).Sum(t => (int?)t.Value) ?? 0,
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
                .WhereIf(requestDto.AccountIds.Count > 0,    t => requestDto.AccountIds.Contains(t.AccountId))
                .WhereIf(requestDto.CategoryIds.Count > 0,   t => requestDto.CategoryIds.Contains(t.SubCategory.CategoryId))
                .WhereIf(requestDto.TagIds.Count > 0,        t => t.Tags.Any(tag => requestDto.TagIds.Contains(tag.Id)))
                .WhereIf(requestDto.TransactionType.HasValue, t => t.Type == requestDto.TransactionType)
                .WhereIf(requestDto.PaymentType.HasValue,    t => t.PaymentType == requestDto.PaymentType)
                .GroupBy(_ => 1)
                .Select(g => new
                {
                    Income  = g.Where(t => t.Type == EnumTransactionType.Income).Sum(t => (int?)t.Value) ?? 0,
                    Expense = g.Where(t => t.Type == EnumTransactionType.Expense).Sum(t => (int?)t.Value) ?? 0
                })
                .FirstOrDefaultAsync();

            var runningBalance = openingBalance is null ? 0 : openingBalance.Income - openingBalance.Expense;

            // Daily net movements within the period
            var dailyMovements = await context.Transactions
                .Where(t => t.UserId == requestDto.UserId)
                .Where(t => t.TransactionDate >= requestDto.StartDate && t.TransactionDate <= requestDto.FinishDate)
                .WhereIf(requestDto.AccountIds.Count > 0,    t => requestDto.AccountIds.Contains(t.AccountId))
                .WhereIf(requestDto.CategoryIds.Count > 0,   t => requestDto.CategoryIds.Contains(t.SubCategory.CategoryId))
                .WhereIf(requestDto.TagIds.Count > 0,        t => t.Tags.Any(tag => requestDto.TagIds.Contains(tag.Id)))
                .WhereIf(requestDto.TransactionType.HasValue, t => t.Type == requestDto.TransactionType)
                .WhereIf(requestDto.PaymentType.HasValue,    t => t.PaymentType == requestDto.PaymentType)
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

        public async Task<List<CategoryEvolutionItemDto>> GetCategoryEvolutionAsync(AnalyticsRequestDto requestDto, int categoryId)
        {
            await using var context = _contextFactory.CreateDbContext();

            return await context.Transactions
                .Where(t => t.UserId == requestDto.UserId)
                .Where(t => t.Type == (requestDto.TransactionType ?? EnumTransactionType.Expense))
                .Where(t => t.SubCategory.CategoryId == categoryId)
                .Where(t => t.TransactionDate >= requestDto.StartDate && t.TransactionDate <= requestDto.FinishDate)
                .WhereIf(requestDto.AccountIds.Count > 0,  t => requestDto.AccountIds.Contains(t.AccountId))
                .WhereIf(requestDto.TagIds.Count > 0,      t => t.Tags.Any(tag => requestDto.TagIds.Contains(tag.Id)))
                .WhereIf(requestDto.PaymentType.HasValue, t => t.PaymentType == requestDto.PaymentType)
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

        public async Task<List<SpendingHeatmapItemDto>> GetSpendingHeatmapAsync(AnalyticsRequestDto requestDto)
        {
            await using var context = _contextFactory.CreateDbContext();

            // Fetch both expense and income per day regardless of TransactionType filter.
            var raw = await context.Transactions
                .Where(t => t.UserId == requestDto.UserId)
                .Where(t => t.TransactionDate >= requestDto.StartDate && t.TransactionDate <= requestDto.FinishDate)
                .WhereIf(requestDto.AccountIds.Count > 0,  t => requestDto.AccountIds.Contains(t.AccountId))
                .WhereIf(requestDto.CategoryIds.Count > 0, t => requestDto.CategoryIds.Contains(t.SubCategory.CategoryId))
                .WhereIf(requestDto.TagIds.Count > 0,      t => t.Tags.Any(tag => requestDto.TagIds.Contains(tag.Id)))
                .WhereIf(requestDto.PaymentType.HasValue, t => t.PaymentType == requestDto.PaymentType)
                .GroupBy(t => t.TransactionDate)
                .Select(g => new
                {
                    Date    = g.Key,
                    Expense = g.Where(t => t.Type == EnumTransactionType.Expense).Sum(t => (int?)t.Value) ?? 0,
                    Income  = g.Where(t => t.Type == EnumTransactionType.Income).Sum(t => (int?)t.Value) ?? 0,
                })
                .OrderBy(x => x.Date)
                .ToListAsync();

            if (raw.Count == 0)
                return [];

            // Fetch same days from the previous month for comparison
            var prevStart  = requestDto.StartDate.AddMonths(-1);
            var prevFinish = requestDto.FinishDate.AddMonths(-1);
            var prevRaw = await context.Transactions
                .Where(t => t.UserId == requestDto.UserId)
                .Where(t => t.TransactionDate >= prevStart && t.TransactionDate <= prevFinish)
                .Where(t => t.Type == EnumTransactionType.Expense)
                .WhereIf(requestDto.AccountIds.Count > 0, t => requestDto.AccountIds.Contains(t.AccountId))
                .GroupBy(t => t.TransactionDate)
                .Select(g => new { Date = g.Key, Expense = g.Sum(t => (int?)t.Value) ?? 0 })
                .ToListAsync();

            // Build a lookup: day-of-month → prev expense
            var prevByDay = prevRaw.ToDictionary(d => d.Date.Day, d => d.Expense);

            var maxExpense = raw.Max(d => d.Expense);
            var maxNet     = raw.Max(d => Math.Max(d.Income - d.Expense, 0));

            return raw.Select(d =>
            {
                var net       = d.Income - d.Expense;
                var state     = ComputeDayState(d.Expense, net, maxExpense, maxNet);
                int? vsLast   = prevByDay.TryGetValue(d.Date.Day, out var prev) ? (d.Expense - prev) : null;
                return new SpendingHeatmapItemDto
                {
                    Date        = d.Date,
                    Total       = d.Expense,
                    Income      = d.Income,
                    Net         = net,
                    State       = state,
                    VsLastMonth = vsLast,
                };
            }).ToList();
        }

        public async Task<PassiveIncomeProjectionDto> GetPassiveIncomeProjectionAsync(int userId, int projectionMonths = 24)
        {
            await using var context = _contextFactory.CreateDbContext();

            var today = DateOnly.FromDateTime(DateTime.UtcNow);
            var historyStart = new DateOnly(today.Year, today.Month, 1).AddMonths(-11);

            // Monthly dividends for the last 12 months (via Investment.UserId)
            var rawDividends = await context.InvestmentDividends
                .Where(d => d.Investment.UserId == userId)
                .Where(d => d.PaymentDate >= historyStart && d.PaymentDate <= today)
                .Select(d => new { d.PaymentDate!.Value.Year, d.PaymentDate.Value.Month, Amount = (int)d.Amount })
                .ToListAsync();

            // Monthly expenses for the last 12 months
            var rawExpenses = await context.Transactions
                .Where(t => t.UserId == userId)
                .Where(t => t.Type == EnumTransactionType.Expense)
                .Where(t => t.TransactionDate >= historyStart && t.TransactionDate <= today)
                .Select(t => new { t.TransactionDate.Year, t.TransactionDate.Month, t.Value })
                .ToListAsync();

            // Build monthly buckets for the 12-month history
            var months12 = new List<(int Year, int Month)>();
            var cursor12 = historyStart;
            while (cursor12 <= new DateOnly(today.Year, today.Month, 1))
            {
                months12.Add((cursor12.Year, cursor12.Month));
                cursor12 = cursor12.AddMonths(1);
            }

            var history = months12.Select(m => new PassiveIncomeMonthDto
            {
                Year         = m.Year,
                Month        = m.Month,
                PassiveIncome = rawDividends.Where(d => d.Year == m.Year && d.Month == m.Month).Sum(d => d.Amount),
                LivingCost   = rawExpenses.Where(e => e.Year == m.Year && e.Month == m.Month).Sum(e => e.Value)
            }).ToList();

            // Averages over the last 3 completed months (excluding current month if incomplete)
            var completedMonths = history
                .Where(h => !(h.Year == today.Year && h.Month == today.Month))
                .TakeLast(3)
                .ToList();

            var currentMonthlyPassiveIncome = completedMonths.Count > 0
                ? (int)Math.Round((double)completedMonths.Sum(m => m.PassiveIncome) / completedMonths.Count)
                : 0;

            var monthlyLivingCost = completedMonths.Count > 0
                ? (int)Math.Round((double)completedMonths.Sum(m => m.LivingCost) / completedMonths.Count)
                : 0;

            // Linear regression on dividends to estimate monthly growth rate
            decimal monthlyGrowthRate = 0.02m; // fallback: 2% p.m.
            if (history.Count >= 4)
            {
                var incomePoints = history.Select((h, i) => (X: (double)i, Y: (double)h.PassiveIncome)).ToList();
                var n = incomePoints.Count;
                var sumX  = incomePoints.Sum(p => p.X);
                var sumY  = incomePoints.Sum(p => p.Y);
                var sumXY = incomePoints.Sum(p => p.X * p.Y);
                var sumX2 = incomePoints.Sum(p => p.X * p.X);
                var denom = n * sumX2 - sumX * sumX;
                if (denom != 0 && sumY > 0)
                {
                    var slope = (n * sumXY - sumX * sumY) / denom;
                    // slope is absolute growth per month; convert to rate relative to avg
                    var avgIncome = sumY / n;
                    if (avgIncome > 0)
                        monthlyGrowthRate = (decimal)(slope / avgIncome);
                }
            }

            // Clamp growth rate to a reasonable range
            monthlyGrowthRate = Math.Max(-0.10m, Math.Min(0.20m, monthlyGrowthRate));

            // Build projection
            var projected = new List<PassiveIncomeMonthDto>();
            var projPassive  = (double)currentMonthlyPassiveIncome;
            var projLiving   = (double)monthlyLivingCost;
            var projCursor   = new DateOnly(today.Year, today.Month, 1).AddMonths(1);
            int? monthsUntilFF = null;

            for (var i = 1; i <= projectionMonths; i++)
            {
                projPassive *= (1 + (double)monthlyGrowthRate);
                projected.Add(new PassiveIncomeMonthDto
                {
                    Year         = projCursor.Year,
                    Month        = projCursor.Month,
                    PassiveIncome = (int)Math.Round(projPassive),
                    LivingCost   = (int)Math.Round(projLiving)
                });

                if (monthsUntilFF is null && projPassive >= projLiving && projLiving > 0)
                    monthsUntilFF = i;

                projCursor = projCursor.AddMonths(1);
            }

            var coveragePercent = monthlyLivingCost > 0
                ? Math.Round((decimal)currentMonthlyPassiveIncome / monthlyLivingCost * 100, 1)
                : 0m;

            return new PassiveIncomeProjectionDto
            {
                CurrentMonthlyPassiveIncome  = currentMonthlyPassiveIncome,
                ProjectedAnnualPassiveIncome = currentMonthlyPassiveIncome * 12,
                MonthlyLivingCost            = monthlyLivingCost,
                CoveragePercent              = coveragePercent,
                MonthsUntilFinancialFreedom  = monthsUntilFF,
                History                      = history,
                Projected                    = projected
            };
        }

        public async Task<FinancialMilestonesDto> GetFinancialMilestonesAsync(int userId)
        {
            await using var context = _contextFactory.CreateDbContext();

            var today = DateOnly.FromDateTime(DateTime.UtcNow);

            // All transactions up to today to build timeline
            var allTransactions = await context.Transactions
                .Where(t => t.UserId == userId && t.TransactionDate <= today)
                .Select(t => new
                {
                    t.TransactionDate,
                    Net = t.Type == EnumTransactionType.Income ? t.Value : -t.Value
                })
                .OrderBy(t => t.TransactionDate)
                .ToListAsync();

            if (allTransactions.Count == 0)
                return new FinancialMilestonesDto();

            var firstDate   = allTransactions.First().TransactionDate;
            var historyStart = new DateOnly(firstDate.Year, firstDate.Month, 1);

            // Build monthly net-worth timeline from the very first transaction
            var timelineMos = new List<(int Year, int Month)>();
            var tc = historyStart;
            while (tc <= new DateOnly(today.Year, today.Month, 1))
            {
                timelineMos.Add((tc.Year, tc.Month));
                tc = tc.AddMonths(1);
            }

            var timeline = new List<NetWorthTimelinePointDto>();
            foreach (var (year, month) in timelineMos)
            {
                var nw = allTransactions
                    .Where(t => t.TransactionDate.Year < year || (t.TransactionDate.Year == year && t.TransactionDate.Month <= month))
                    .Sum(t => t.Net);
                timeline.Add(new NetWorthTimelinePointDto { Year = year, Month = month, NetWorth = nw });
            }

            var milestones = new List<FinancialMilestoneDto>();

            // Milestone: first income transaction
            var firstIncome = allTransactions.FirstOrDefault(t => t.Net > 0);
            if (firstIncome is not null)
            {
                milestones.Add(new FinancialMilestoneDto
                {
                    Label          = "Início da jornada",
                    Date           = firstIncome.TransactionDate,
                    NetWorthAtDate = timeline.FirstOrDefault(t => t.Year == firstIncome.TransactionDate.Year && t.Month == firstIncome.TransactionDate.Month)?.NetWorth ?? 0,
                    Type           = "journey_start"
                });
            }

            // Milestone: first investment transaction
            var firstInvestment = await context.InvestmentTransactions
                .Where(it => it.Investment.UserId == userId)
                .OrderBy(it => it.Date)
                .Select(it => new { it.Date })
                .FirstOrDefaultAsync();

            if (firstInvestment is not null)
            {
                milestones.Add(new FinancialMilestoneDto
                {
                    Label          = "Primeiro investimento",
                    Date           = firstInvestment.Date,
                    NetWorthAtDate = timeline.FirstOrDefault(t => t.Year == firstInvestment.Date.Year && t.Month == firstInvestment.Date.Month)?.NetWorth ?? 0,
                    Type           = "investment_start"
                });
            }

            // Net-worth crossing milestones (values in cents)
            var thresholds = new[] { 100000, 500000, 1000000, 2500000, 5000000, 10000000, 25000000, 50000000, 100000000 };
            foreach (var threshold in thresholds)
            {
                for (var i = 1; i < timeline.Count; i++)
                {
                    if (timeline[i - 1].NetWorth < threshold && timeline[i].NetWorth >= threshold)
                    {
                        var crossed = timeline[i];
                        var label = threshold >= 100000000 ? $"Patrimônio R$ {threshold / 100000000}M"
                                  : threshold >= 1000000   ? $"Patrimônio R$ {threshold / 100000}k"
                                  : $"Patrimônio R$ {threshold / 100}";
                        milestones.Add(new FinancialMilestoneDto
                        {
                            Label          = label,
                            Date           = new DateOnly(crossed.Year, crossed.Month, 1),
                            NetWorthAtDate = crossed.NetWorth,
                            Type           = "net_worth_milestone"
                        });
                        break;
                    }
                }
            }

            // Milestone: peak net worth
            if (timeline.Count > 0)
            {
                var peak = timeline.MaxBy(t => t.NetWorth)!;
                var peakDate = new DateOnly(peak.Year, peak.Month, 1);
                // Only add if it's not the current month (trivial)
                if (!(peak.Year == today.Year && peak.Month == today.Month) || timeline.Count == 1)
                {
                    milestones.Add(new FinancialMilestoneDto
                    {
                        Label          = "Pico de patrimônio",
                        Date           = peakDate,
                        NetWorthAtDate = peak.NetWorth,
                        Type           = "peak"
                    });
                }
            }

            // Milestone: longest savings streak (consecutive positive-balance months)
            var maxStreak = 0;
            var currentStreak = 0;
            var streakEndIdx = -1;
            for (var i = 0; i < timeline.Count; i++)
            {
                var monthNet = i == 0 ? timeline[i].NetWorth : timeline[i].NetWorth - timeline[i - 1].NetWorth;
                if (monthNet > 0)
                {
                    currentStreak++;
                    if (currentStreak > maxStreak)
                    {
                        maxStreak    = currentStreak;
                        streakEndIdx = i;
                    }
                }
                else
                {
                    currentStreak = 0;
                }
            }

            if (maxStreak >= 3 && streakEndIdx >= 0)
            {
                var streakPoint = timeline[streakEndIdx];
                milestones.Add(new FinancialMilestoneDto
                {
                    Label          = $"{maxStreak} meses consecutivos poupando",
                    Date           = new DateOnly(streakPoint.Year, streakPoint.Month, 1),
                    NetWorthAtDate = streakPoint.NetWorth,
                    Type           = "savings_streak"
                });
            }

            return new FinancialMilestonesDto
            {
                Milestones = milestones.OrderBy(m => m.Date).ToList(),
                Timeline   = timeline
            };
        }

        public async Task<PortfolioCompositionProjectionDto> GetPortfolioCompositionProjectionAsync(int userId, int projectionMonths = 12)
        {
            await using var context = _contextFactory.CreateDbContext();

            var today = DateOnly.FromDateTime(DateTime.UtcNow);
            var historyStart = new DateOnly(today.Year, today.Month, 1).AddMonths(-11);

            // Fetch all investment transactions for this user, including Asset type for classification
            var rawTx = await context.InvestmentTransactions
                .Where(it => it.Investment.UserId == userId)
                .Select(it => new
                {
                    it.Date,
                    AssetType = it.Investment.MarketAsset.AssetType,
                    SignedValue = it.Operation == EnumInvestmentOperation.Buy ? it.TotalValue : -it.TotalValue
                })
                .ToListAsync();

            static string ClassifyAsset(EnumAssetType t) => t switch
            {
                EnumAssetType.TesouroDireto or EnumAssetType.RendaFixa => "Renda Fixa",
                EnumAssetType.Acao or EnumAssetType.ETF               => "Renda Variável",
                EnumAssetType.FII                                       => "FII",
                EnumAssetType.Stock or EnumAssetType.Reit
                    or EnumAssetType.BDR or EnumAssetType.ETFInternacional
                    or EnumAssetType.FundoInvestimento                 => "Internacional",
                EnumAssetType.Cripto                                    => "Cripto",
                _                                                       => "Outros"
            };

            // Build months list covering the history window
            var months = new List<(int Year, int Month)>();
            var cursor = historyStart;
            while (cursor <= new DateOnly(today.Year, today.Month, 1))
            {
                months.Add((cursor.Year, cursor.Month));
                cursor = cursor.AddMonths(1);
            }

            // For each month, compute cumulative value per asset class
            var historical = new List<PortfolioCompositionMonthDto>();
            var allClasses = new HashSet<string>();

            foreach (var (year, month) in months)
            {
                var byClass = rawTx
                    .Where(t => t.Date.Year < year || (t.Date.Year == year && t.Date.Month <= month))
                    .GroupBy(t => ClassifyAsset(t.AssetType))
                    .Select(g => new AssetClassValueDto
                    {
                        AssetClass = g.Key,
                        Value      = (int)Math.Max(0, g.Sum(t => t.SignedValue))
                    })
                    .ToList();

                foreach (var b in byClass) allClasses.Add(b.AssetClass);

                historical.Add(new PortfolioCompositionMonthDto
                {
                    Year        = year,
                    Month       = month,
                    IsProjected = false,
                    Breakdown   = byClass
                });
            }

            // Compute average monthly growth rate per class from the last 6 available months
            var lastMonths = historical.TakeLast(Math.Min(6, historical.Count)).ToList();
            var growthRates = new Dictionary<string, double>();
            foreach (var cls in allClasses)
            {
                var values = lastMonths.Select(m => (double)(m.Breakdown.FirstOrDefault(b => b.AssetClass == cls)?.Value ?? 0)).ToList();
                if (values.Count >= 2 && values[0] > 0)
                {
                    var rates = new List<double>();
                    for (var i = 1; i < values.Count; i++)
                        if (values[i - 1] > 0)
                            rates.Add((values[i] - values[i - 1]) / values[i - 1]);
                    growthRates[cls] = rates.Count > 0 ? rates.Average() : 0.01;
                }
                else
                {
                    growthRates[cls] = 0.01;
                }
                // Clamp to [0%, 10%] per month
                growthRates[cls] = Math.Max(0.0, Math.Min(0.10, growthRates[cls]));
            }

            // Build projection
            var lastHistorical = historical.Last();
            var projectedPoints = new List<PortfolioCompositionMonthDto>();
            var currentValues   = allClasses.ToDictionary(c => c, c => (double)(lastHistorical.Breakdown.FirstOrDefault(b => b.AssetClass == c)?.Value ?? 0));
            var projCursor      = new DateOnly(today.Year, today.Month, 1).AddMonths(1);

            for (var i = 0; i < projectionMonths; i++)
            {
                var breakdown = new List<AssetClassValueDto>();
                foreach (var cls in allClasses)
                {
                    currentValues[cls] *= 1 + growthRates[cls];
                    breakdown.Add(new AssetClassValueDto { AssetClass = cls, Value = (int)Math.Round(currentValues[cls]) });
                }
                projectedPoints.Add(new PortfolioCompositionMonthDto
                {
                    Year        = projCursor.Year,
                    Month       = projCursor.Month,
                    IsProjected = true,
                    Breakdown   = breakdown
                });
                projCursor = projCursor.AddMonths(1);
            }

            // Ordered asset class list — fixed priority for known classes, unknown at end
            var classOrder = new[] { "Renda Fixa", "Renda Variável", "FII", "Internacional", "Cripto", "Outros" };
            var orderedClasses = classOrder.Where(c => allClasses.Contains(c))
                .Concat(allClasses.Except(classOrder))
                .ToList();

            return new PortfolioCompositionProjectionDto
            {
                Data         = [..historical, ..projectedPoints],
                AssetClasses = orderedClasses
            };
        }

        public async Task<RealNetWorthDto> GetRealNetWorthAsync(int userId)
        {
            await using var context = _contextFactory.CreateDbContext();

            var today         = DateOnly.FromDateTime(DateTime.UtcNow);
            var historyStart  = new DateOnly(today.Year, today.Month, 1).AddMonths(-11);

            var allTransactions = await context.Transactions
                .Where(t => t.UserId == userId && t.TransactionDate <= today)
                .Select(t => new
                {
                    t.TransactionDate.Year,
                    t.TransactionDate.Month,
                    Net = t.Type == EnumTransactionType.Income ? t.Value : -t.Value
                })
                .ToListAsync();

            // Build monthly nominal net worth for the 12-month window
            var months = new List<(int Year, int Month)>();
            var cursor = historyStart;
            while (cursor <= new DateOnly(today.Year, today.Month, 1))
            {
                months.Add((cursor.Year, cursor.Month));
                cursor = cursor.AddMonths(1);
            }

            var nominalByMonth = new List<(int Year, int Month, int NominalNetWorth)>();
            foreach (var (year, month) in months)
            {
                var nw = allTransactions
                    .Where(t => t.Year < year || (t.Year == year && t.Month <= month))
                    .Sum(t => t.Net);
                nominalByMonth.Add((year, month, nw));
            }

            // Fetch IPCA from BACEN SGS (series 433) for the history window
            var ipcaMonthly = await FetchIpcaAsync(historyStart, new DateOnly(today.Year, today.Month, 1));

            // Build deflated series: each point is relative to the first month
            var points    = new List<RealNetWorthPointDto>();
            var accInflation = 0.0; // accumulated as (1 + r1)(1 + r2)... - 1

            for (var i = 0; i < nominalByMonth.Count; i++)
            {
                var (year, month, nominal) = nominalByMonth[i];

                if (i > 0)
                {
                    var key = $"{year:D4}-{month:D2}";
                    var monthlyRate = ipcaMonthly.TryGetValue(key, out var r) ? r / 100.0 : 0.005;
                    accInflation = (1 + accInflation) * (1 + monthlyRate) - 1;
                }

                var deflator  = 1.0 + accInflation;
                var realValue = deflator > 0 ? (int)Math.Round(nominal / deflator) : nominal;

                points.Add(new RealNetWorthPointDto
                {
                    Year                   = year,
                    Month                  = month,
                    NominalNetWorth        = nominal,
                    RealNetWorth           = realValue,
                    AccumulatedInflationPct = Math.Round((decimal)(accInflation * 100), 2)
                });
            }

            var firstNominal = points.FirstOrDefault()?.NominalNetWorth ?? 0;
            var lastNominal  = points.LastOrDefault()?.NominalNetWorth  ?? 0;
            var firstReal    = points.FirstOrDefault()?.RealNetWorth    ?? 0;
            var lastReal     = points.LastOrDefault()?.RealNetWorth     ?? 0;
            var totalInflation = points.LastOrDefault()?.AccumulatedInflationPct ?? 0m;

            var totalNominalGrowth = firstNominal != 0
                ? Math.Round((decimal)(lastNominal - firstNominal) / Math.Abs(firstNominal) * 100, 2)
                : 0m;
            var totalRealGrowth = firstReal != 0
                ? Math.Round((decimal)(lastReal - firstReal) / Math.Abs(firstReal) * 100, 2)
                : 0m;

            return new RealNetWorthDto
            {
                Points                = points,
                TotalNominalGrowthPct = totalNominalGrowth,
                TotalRealGrowthPct    = totalRealGrowth,
                TotalInflationPct     = totalInflation
            };
        }

        private async Task<Dictionary<string, double>> FetchIpcaAsync(DateOnly from, DateOnly to)
        {
            var result    = new Dictionary<string, double>();
            var startStr  = from.ToString("dd/MM/yyyy");
            var endStr    = to.ToString("dd/MM/yyyy");
            var url       = $"https://api.bcb.gov.br/dados/serie/bcdata.sgs.433/dados?formato=json&dataInicial={startStr}&dataFinal={endStr}";

            try
            {
                using var client   = _httpClientFactory.CreateClient();
                client.Timeout     = TimeSpan.FromSeconds(5);
                var json           = await client.GetStringAsync(url);
                var entries        = System.Text.Json.JsonDocument.Parse(json).RootElement;

                foreach (var entry in entries.EnumerateArray())
                {
                    var dateStr = entry.GetProperty("data").GetString() ?? "";
                    var valStr  = entry.GetProperty("valor").GetString() ?? "0";

                    // BACEN date format: DD/MM/YYYY → normalise to YYYY-MM
                    if (dateStr.Length == 10 && double.TryParse(valStr, System.Globalization.NumberStyles.Any, System.Globalization.CultureInfo.InvariantCulture, out var val))
                    {
                        var parts = dateStr.Split('/');
                        var key   = $"{parts[2]}-{parts[1]}";
                        result[key] = val;
                    }
                }
            }
            catch
            {
                // Fallback: leave dictionary empty; callers use 0.5% per month
            }

            return result;
        }

        // ── Investment analytics ──────────────────────────────────────────────────

        public async Task<InvestmentEvolutionResponseDto> GetInvestmentEvolutionAsync(int userId, DateOnly startDate, DateOnly finishDate)
        {
            await using var context = _contextFactory.CreateDbContext();

            // All buy transactions in range grouped by month
            var buysByMonth = await context.InvestmentTransactions
                .Where(t => t.UserId == userId && t.Date >= startDate && t.Date <= finishDate && t.Operation == EnumInvestmentOperation.Buy)
                .GroupBy(t => new { t.Date.Year, t.Date.Month })
                .Select(g => new { g.Key.Year, g.Key.Month, TotalBought = g.Sum(t => (long?)t.TotalValue) ?? 0L })
                .ToListAsync();

            var dividendsByMonth = await context.InvestmentDividends
                .Where(d => d.UserId == userId && d.PaymentDate >= startDate && d.PaymentDate <= finishDate)
                .GroupBy(d => new { d.PaymentDate!.Value.Year, d.PaymentDate.Value.Month })
                .Select(g => new { g.Key.Year, g.Key.Month, Total = g.Sum(d => (long?)d.Amount) ?? 0L })
                .ToListAsync();

            // All buys up to finishDate to compute cumulative invested capital per month
            var allBuys = await context.InvestmentTransactions
                .Where(t => t.UserId == userId && t.Date <= finishDate && t.Operation == EnumInvestmentOperation.Buy)
                .Select(t => new { t.Date.Year, t.Date.Month, t.TotalValue })
                .ToListAsync();

            var allSells = await context.InvestmentTransactions
                .Where(t => t.UserId == userId && t.Date <= finishDate && t.Operation == EnumInvestmentOperation.Sell)
                .Select(t => new { t.Date.Year, t.Date.Month, t.TotalValue })
                .ToListAsync();

            var allDividends = await context.InvestmentDividends
                .Where(d => d.UserId == userId && d.PaymentDate <= finishDate)
                .Select(d => new { d.PaymentDate!.Value.Year, d.PaymentDate.Value.Month, d.Amount })
                .ToListAsync();

            // Current portfolio value per investment (to distribute across months proportionally — simplified: use current prices)
            var investmentValues = await context.Investments
                .Where(i => i.UserId == userId)
                .Select(i => new { i.CurrentQuantity, i.MarketAsset.CurrentPrice })
                .ToListAsync();

            var totalCurrentValue = investmentValues.Sum(i => (long)Math.Round(i.CurrentQuantity * i.CurrentPrice));

            // Build month-by-month series
            var months = new List<(int Year, int Month)>();
            var cursor = new DateOnly(startDate.Year, startDate.Month, 1);
            while (cursor <= new DateOnly(finishDate.Year, finishDate.Month, 1))
            {
                months.Add((cursor.Year, cursor.Month));
                cursor = cursor.AddMonths(1);
            }

            var data = new List<InvestmentEvolutionPointDto>();
            foreach (var (year, month) in months)
            {
                var invested = allBuys
                    .Where(t => t.Year < year || (t.Year == year && t.Month <= month))
                    .Sum(t => (long)t.TotalValue);
                var sold = allSells
                    .Where(t => t.Year < year || (t.Year == year && t.Month <= month))
                    .Sum(t => (long)t.TotalValue);
                var netInvested = Math.Max(0, invested - sold);

                var cumDividends = allDividends
                    .Where(d => d.Year < year || (d.Year == year && d.Month <= month))
                    .Sum(d => (long)d.Amount);

                // Approximate current value: we don't have historical prices, so use current value scaled by capital
                // For a simple model: totalValue = netInvested (historical invested capital)
                // The last month uses the actual current portfolio value
                var isLastMonth = year == finishDate.Year && month == finishDate.Month;
                var totalValue = isLastMonth ? totalCurrentValue : netInvested;
                var returns = totalValue - netInvested;

                data.Add(new InvestmentEvolutionPointDto
                {
                    Label         = new DateOnly(year, month, 1).ToString("MMM/yy", new System.Globalization.CultureInfo("pt-BR")),
                    TotalValue    = totalValue,
                    TotalInvested = netInvested,
                    Returns       = returns,
                    Dividends     = cumDividends,
                });
            }

            var lastPoint = data.LastOrDefault();
            var returnPct = lastPoint is not null && lastPoint.TotalInvested > 0
                ? Math.Round((decimal)lastPoint.Returns / lastPoint.TotalInvested * 100, 2)
                : (decimal?)null;

            var cumulativeDividends = allDividends.Sum(d => (long)d.Amount);

            return new InvestmentEvolutionResponseDto
            {
                Data                 = data,
                ReturnPct            = returnPct,
                CumulativeDividends  = cumulativeDividends,
            };
        }

        public async Task<InvestmentLaunchesResponseDto> GetInvestmentLaunchesAsync(int userId, DateOnly startDate, DateOnly finishDate)
        {
            await using var context = _contextFactory.CreateDbContext();

            var transactions = await context.InvestmentTransactions
                .Where(t => t.UserId == userId && t.Date >= startDate && t.Date <= finishDate)
                .Include(t => t.Investment).ThenInclude(i => i.MarketAsset)
                .OrderByDescending(t => t.Date)
                .ToListAsync();

            var assetTypeLabels = new Dictionary<EnumAssetType, string>
            {
                { EnumAssetType.Acao, "Ação" }, { EnumAssetType.FundoInvestimento, "Fundo de Investimento" },
                { EnumAssetType.FII, "FII" }, { EnumAssetType.Cripto, "Cripto" }, { EnumAssetType.Stock, "Stock" },
                { EnumAssetType.Reit, "REIT" }, { EnumAssetType.BDR, "BDR" }, { EnumAssetType.ETF, "ETF" },
                { EnumAssetType.ETFInternacional, "ETF Internacional" }, { EnumAssetType.TesouroDireto, "Tesouro Direto" },
                { EnumAssetType.RendaFixa, "Renda Fixa" }, { EnumAssetType.Outro, "Outro" },
            };

            var launches = transactions.Select(t => new InvestmentLaunchItemDto
            {
                Id         = t.Id,
                Date       = t.Date.ToString("yyyy-MM-dd"),
                Ticker     = t.Investment.MarketAsset.Ticker,
                Name       = t.Investment.MarketAsset.Name,
                AssetClass = assetTypeLabels.GetValueOrDefault(t.Investment.MarketAsset.AssetType, "Outro"),
                Operation  = t.Operation == EnumInvestmentOperation.Buy ? "buy" : "sell",
                Quantity   = t.Quantity,
                UnitPrice  = t.UnitPrice,
                TotalValue = t.TotalValue,
                Broker     = t.Investment.Broker,
            }).ToList();

            // Monthly volume chart
            var months = new List<(int Year, int Month)>();
            var cursor = new DateOnly(startDate.Year, startDate.Month, 1);
            while (cursor <= new DateOnly(finishDate.Year, finishDate.Month, 1))
            {
                months.Add((cursor.Year, cursor.Month));
                cursor = cursor.AddMonths(1);
            }

            var monthlyPoints = months.Select(m =>
            {
                var inMonth = transactions.Where(t => t.Date.Year == m.Year && t.Date.Month == m.Month);
                return new InvestmentLaunchMonthPointDto
                {
                    Label  = new DateOnly(m.Year, m.Month, 1).ToString("MMM/yy", new System.Globalization.CultureInfo("pt-BR")),
                    Bought = inMonth.Where(t => t.Operation == EnumInvestmentOperation.Buy).Sum(t => t.TotalValue),
                    Sold   = inMonth.Where(t => t.Operation == EnumInvestmentOperation.Sell).Sum(t => t.TotalValue),
                };
            }).ToList();

            var summary = new InvestmentLaunchesSummaryDto
            {
                TotalBought = transactions.Where(t => t.Operation == EnumInvestmentOperation.Buy).Sum(t => t.TotalValue),
                TotalSold   = transactions.Where(t => t.Operation == EnumInvestmentOperation.Sell).Sum(t => t.TotalValue),
                BuyCount    = transactions.Count(t => t.Operation == EnumInvestmentOperation.Buy),
                SellCount   = transactions.Count(t => t.Operation == EnumInvestmentOperation.Sell),
            };

            return new InvestmentLaunchesResponseDto { Launches = launches, MonthlyPoints = monthlyPoints, Summary = summary };
        }

        public async Task<ProfitabilityTotalsDto> GetInvestmentProfitabilityTotalsAsync(int userId, DateOnly startDate, DateOnly finishDate)
        {
            await using var context = _contextFactory.CreateDbContext();

            var today      = DateOnly.FromDateTime(DateTime.UtcNow);
            var lastMonth  = today.AddMonths(-1);
            var last12     = today.AddMonths(-12);

            async Task<ProfitabilityPeriodDto> CalcPeriod(DateOnly from, DateOnly to)
            {
                var invested = await context.InvestmentTransactions
                    .Where(t => t.UserId == userId && t.Date >= from && t.Date <= to && t.Operation == EnumInvestmentOperation.Buy)
                    .SumAsync(t => (long?)t.TotalValue) ?? 0L;
                var sold = await context.InvestmentTransactions
                    .Where(t => t.UserId == userId && t.Date >= from && t.Date <= to && t.Operation == EnumInvestmentOperation.Sell)
                    .SumAsync(t => (long?)t.TotalValue) ?? 0L;
                var dividends = await context.InvestmentDividends
                    .Where(d => d.UserId == userId && d.PaymentDate >= from && d.PaymentDate <= to)
                    .SumAsync(d => (long?)d.Amount) ?? 0L;

                var netFlow = invested - sold;
                var cdiForPeriod = await FetchCdiAsync(from, to);
                // Return estimate: dividends + (current value proportional to net flow)
                var investments = await context.Investments
                    .Where(i => i.UserId == userId)
                    .Select(i => new { i.CurrentQuantity, i.MarketAsset.CurrentPrice, i.AveragePrice })
                    .ToListAsync();
                var currentValue = investments.Sum(i => (long)Math.Round(i.CurrentQuantity * i.CurrentPrice));
                var totalInvested = investments.Sum(i => (long)Math.Round(i.CurrentQuantity * i.AveragePrice));
                var totalReturn = currentValue - totalInvested;

                var returnPct = totalInvested > 0
                    ? Math.Round((decimal)totalReturn / totalInvested * 100, 2)
                    : 0m;

                return new ProfitabilityPeriodDto
                {
                    ReturnPct = returnPct,
                    VsCdiPct  = Math.Round(returnPct - (decimal)cdiForPeriod, 2),
                };
            }

            return new ProfitabilityTotalsDto
            {
                AllTime      = await CalcPeriod(new DateOnly(2000, 1, 1), today),
                Last12Months = await CalcPeriod(last12, today),
                LastMonth    = await CalcPeriod(new DateOnly(lastMonth.Year, lastMonth.Month, 1), new DateOnly(lastMonth.Year, lastMonth.Month, DateTime.DaysInMonth(lastMonth.Year, lastMonth.Month))),
            };
        }

        public async Task<AnnualReturnsResponseDto> GetInvestmentAnnualReturnsAsync(int userId, DateOnly startDate, DateOnly finishDate)
        {
            await using var context = _contextFactory.CreateDbContext();

            var allBuys = await context.InvestmentTransactions
                .Where(t => t.UserId == userId && t.Date >= startDate && t.Date <= finishDate && t.Operation == EnumInvestmentOperation.Buy)
                .Select(t => new { t.Date.Year, t.Date.Month, t.TotalValue })
                .ToListAsync();

            var allDividends = await context.InvestmentDividends
                .Where(d => d.UserId == userId && d.PaymentDate >= startDate && d.PaymentDate <= finishDate)
                .Select(d => new { d.PaymentDate!.Value.Year, d.PaymentDate.Value.Month, d.Amount })
                .ToListAsync();

            var years = Enumerable.Range(startDate.Year, finishDate.Year - startDate.Year + 1).ToList();
            var rows  = new List<AnnualReturnRowDto>();

            foreach (var year in years)
            {
                var monthRows = new List<MonthlyReturnItemDto>();
                int? annualBps = null;
                long annualInvested = 0;
                long annualReturns  = 0;

                for (var m = 1; m <= 12; m++)
                {
                    var monthStart = new DateOnly(year, m, 1);
                    var monthEnd   = monthStart.AddMonths(1).AddDays(-1);
                    if (monthStart > finishDate || monthEnd < startDate) { monthRows.Add(new MonthlyReturnItemDto { Month = m }); continue; }

                    var invested = allBuys.Where(t => t.Year == year && t.Month == m).Sum(t => (long)t.TotalValue);
                    var dividends = allDividends.Where(d => d.Year == year && d.Month == m).Sum(d => (long)d.Amount);
                    annualInvested += invested;
                    annualReturns  += dividends;

                    int? bps = invested > 0 ? (int?)Math.Round((decimal)dividends / invested * 10000) : null;
                    monthRows.Add(new MonthlyReturnItemDto { Month = m, ReturnBps = bps });
                }

                if (annualInvested > 0)
                    annualBps = (int)Math.Round((decimal)annualReturns / annualInvested * 10000);

                rows.Add(new AnnualReturnRowDto { Year = year, Months = monthRows, AnnualReturnBps = annualBps });
            }

            var monthlyCumulatives = Enumerable.Range(1, 12).Select(m =>
            {
                var withData = rows.Where(r => r.Months[m - 1].ReturnBps.HasValue).ToList();
                return withData.Count > 0 ? (int?)withData.Sum(r => r.Months[m - 1].ReturnBps!.Value) : null;
            }).ToList();

            var grandTotal = rows.Where(r => r.AnnualReturnBps.HasValue).Sum(r => r.AnnualReturnBps!.Value);

            return new AnnualReturnsResponseDto { Rows = rows, MonthlyCumulatives = monthlyCumulatives, GrandTotal = grandTotal };
        }

        public async Task<List<ProfitabilityVsCdiPointDto>> GetInvestmentProfitabilityVsCdiAsync(int userId, DateOnly startDate, DateOnly finishDate)
        {
            await using var context = _contextFactory.CreateDbContext();

            var allBuys = await context.InvestmentTransactions
                .Where(t => t.UserId == userId && t.Date >= startDate && t.Date <= finishDate && t.Operation == EnumInvestmentOperation.Buy)
                .Select(t => new { t.Date.Year, t.Date.Month, t.TotalValue })
                .ToListAsync();

            var allDividends = await context.InvestmentDividends
                .Where(d => d.UserId == userId && d.PaymentDate >= startDate && d.PaymentDate <= finishDate)
                .Select(d => new { d.PaymentDate!.Value.Year, d.PaymentDate.Value.Month, d.Amount })
                .ToListAsync();

            var cdiRates = await FetchCdiMonthlyAsync(startDate, finishDate);

            var months = new List<(int Year, int Month)>();
            var cursor = new DateOnly(startDate.Year, startDate.Month, 1);
            while (cursor <= new DateOnly(finishDate.Year, finishDate.Month, 1))
            {
                months.Add((cursor.Year, cursor.Month));
                cursor = cursor.AddMonths(1);
            }

            var points = new List<ProfitabilityVsCdiPointDto>();
            foreach (var (year, month) in months)
            {
                var invested  = allBuys.Where(t => t.Year == year && t.Month == month).Sum(t => (decimal)t.TotalValue);
                var dividends = allDividends.Where(d => d.Year == year && d.Month == month).Sum(d => (decimal)d.Amount);
                var portPct   = invested > 0 ? Math.Round(dividends / invested * 100, 2) : 0m;
                var cdiKey    = $"{year:D4}-{month:D2}";
                var cdiPct    = cdiRates.TryGetValue(cdiKey, out var r) ? Math.Round((decimal)r, 2) : 0m;

                points.Add(new ProfitabilityVsCdiPointDto
                {
                    Label        = new DateOnly(year, month, 1).ToString("MMM/yy", new System.Globalization.CultureInfo("pt-BR")),
                    PortfolioPct = portPct,
                    CdiPct       = cdiPct,
                });
            }

            return points;
        }

        public async Task<ProfitabilityVsBenchmarksResponseDto> GetInvestmentProfitabilityVsBenchmarksAsync(int userId, DateOnly startDate, DateOnly finishDate)
        {
            await using var context = _contextFactory.CreateDbContext();

            var allBuys = await context.InvestmentTransactions
                .Where(t => t.UserId == userId && t.Date >= startDate && t.Date <= finishDate && t.Operation == EnumInvestmentOperation.Buy)
                .Select(t => new { t.Date.Year, t.Date.Month, t.TotalValue })
                .ToListAsync();

            var allDividends = await context.InvestmentDividends
                .Where(d => d.UserId == userId && d.PaymentDate >= startDate && d.PaymentDate <= finishDate)
                .Select(d => new { d.PaymentDate!.Value.Year, d.PaymentDate.Value.Month, d.Amount })
                .ToListAsync();

            var cdiRates  = await FetchCdiMonthlyAsync(startDate, finishDate);
            var ipcaRates = await FetchIpcaAsync(startDate, finishDate);

            // IBOV: historical long-run monthly average (~13% annual → ~1.024%/mo)
            const double ibovMonthlyAvg = 1.024;

            // IPCA+5% annual = IPCA monthly + (5%/12) per month
            const double extraMonthly = 5.0 / 12.0;

            var months = new List<(int Year, int Month)>();
            var cursor = new DateOnly(startDate.Year, startDate.Month, 1);
            while (cursor <= new DateOnly(finishDate.Year, finishDate.Month, 1))
            {
                months.Add((cursor.Year, cursor.Month));
                cursor = cursor.AddMonths(1);
            }

            var points = new List<ProfitabilityVsCdiPointDto>();
            double cumulPortfolio  = 1.0, cumulCdi  = 1.0, cumulIbov  = 1.0, cumulIpca5 = 1.0;

            foreach (var (year, month) in months)
            {
                var invested  = allBuys.Where(t => t.Year == year && t.Month == month).Sum(t => (decimal)t.TotalValue);
                var dividends = allDividends.Where(d => d.Year == year && d.Month == month).Sum(d => (decimal)d.Amount);
                var portPct   = invested > 0 ? Math.Round(dividends / invested * 100, 2) : 0m;

                var key      = $"{year:D4}-{month:D2}";
                var cdiPct   = cdiRates.TryGetValue(key, out var cdiR) ? Math.Round((decimal)cdiR, 2) : 0m;
                var ipcaMo   = ipcaRates.TryGetValue(key, out var ipcaR) ? ipcaR : 0.4;
                var ipca5Pct = Math.Round((decimal)(ipcaMo + extraMonthly), 2);
                var ibovPct  = Math.Round((decimal)ibovMonthlyAvg, 2);

                cumulPortfolio *= 1.0 + (double)portPct / 100.0;
                cumulCdi       *= 1.0 + (double)cdiPct  / 100.0;
                cumulIbov      *= 1.0 + ibovMonthlyAvg  / 100.0;
                cumulIpca5     *= 1.0 + (double)ipca5Pct / 100.0;

                points.Add(new ProfitabilityVsCdiPointDto
                {
                    Label         = new DateOnly(year, month, 1).ToString("MMM/yy", new System.Globalization.CultureInfo("pt-BR")),
                    PortfolioPct  = portPct,
                    CdiPct        = cdiPct,
                    IbovPct       = ibovPct,
                    IpcaPlus5Pct  = ipca5Pct,
                });
            }

            var cdiAllTime   = Math.Round((decimal)(cumulCdi   - 1.0) * 100, 2);
            var ibovAllTime  = Math.Round((decimal)(cumulIbov  - 1.0) * 100, 2);
            var ipca5AllTime = Math.Round((decimal)(cumulIpca5 - 1.0) * 100, 2);
            var portAllTime  = Math.Round((decimal)(cumulPortfolio - 1.0) * 100, 2);

            var totals = new ProfitabilityBenchmarkTotalsDto
            {
                PortfolioAllTimePct  = portAllTime,
                CdiAllTimePct        = cdiAllTime,
                IbovAllTimePct       = ibovAllTime,
                IpcaPlus5AllTimePct  = ipca5AllTime,
                VsCdiPct             = portAllTime - cdiAllTime,
                VsIbovPct            = portAllTime - ibovAllTime,
                VsIpcaPlus5Pct       = portAllTime - ipca5AllTime,
            };

            return new ProfitabilityVsBenchmarksResponseDto { Points = points, Totals = totals };
        }

        private async Task<double> FetchCdiAsync(DateOnly from, DateOnly to)
        {
            var rates = await FetchCdiMonthlyAsync(from, to);
            return rates.Values.Sum();
        }

        private async Task<Dictionary<string, double>> FetchCdiMonthlyAsync(DateOnly from, DateOnly to)
        {
            var result   = new Dictionary<string, double>();
            var startStr = from.ToString("dd/MM/yyyy");
            var endStr   = to.ToString("dd/MM/yyyy");
            // BACEN SGS series 4391 = CDI monthly rate
            var url = $"https://api.bcb.gov.br/dados/serie/bcdata.sgs.4391/dados?formato=json&dataInicial={startStr}&dataFinal={endStr}";

            try
            {
                using var client = _httpClientFactory.CreateClient();
                client.Timeout   = TimeSpan.FromSeconds(5);
                var json         = await client.GetStringAsync(url);
                var entries      = System.Text.Json.JsonDocument.Parse(json).RootElement;

                foreach (var entry in entries.EnumerateArray())
                {
                    var dateStr = entry.GetProperty("data").GetString() ?? "";
                    var valStr  = entry.GetProperty("valor").GetString() ?? "0";
                    if (dateStr.Length == 10 && double.TryParse(valStr, System.Globalization.NumberStyles.Any, System.Globalization.CultureInfo.InvariantCulture, out var val))
                    {
                        var parts = dateStr.Split('/');
                        var key   = $"{parts[2]}-{parts[1]}";
                        result[key] = val;
                    }
                }
            }
            catch { }

            return result;
        }

        private static DayHeatmapState ComputeDayState(int expense, int net, int maxExpense, int maxNet)
        {
            if (net > 0)
            {
                var pct = maxNet > 0 ? (double)net / maxNet : 0;
                return pct switch { < 0.2 => DayHeatmapState.Income1, < 0.45 => DayHeatmapState.Income2, < 0.7 => DayHeatmapState.Income3, _ => DayHeatmapState.Income4 };
            }
            if (expense > 0)
            {
                var pct = maxExpense > 0 ? (double)expense / maxExpense : 0;
                return pct switch { < 0.2 => DayHeatmapState.Expense1, < 0.45 => DayHeatmapState.Expense2, < 0.7 => DayHeatmapState.Expense3, _ => DayHeatmapState.Expense4 };
            }
            return DayHeatmapState.Empty;
        }
    }
}

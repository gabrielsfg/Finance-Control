using FinanceControl.Data.Data;
using FinanceControl.Shared.Dtos.Others.Insight;
using FinanceControl.Shared.Enums;
using Microsoft.EntityFrameworkCore;

namespace FinanceControl.Services.Ai
{
    /// <summary>
    /// Builds the payload sent to the model. This class is the privacy contract of the
    /// feature: only what it writes leaves the server.
    /// </summary>
    /// <remarks>
    /// Every figure is computed here and formatted as a pt-BR string, so the model copies
    /// rather than calculates. Adding a raw number to the snapshot would invite the model
    /// to do arithmetic on it, and arithmetic is where a language model invents.
    /// <para>
    /// Never add identification (name, email, document, account number) or an individual
    /// transaction. Category totals are the finest granularity allowed.
    /// </para>
    /// </remarks>
    public class InsightSnapshotBuilder
    {
        private readonly ApplicationDbContext _context;

        /// <summary>Everything whose price moves with the market, for the profile contrast.</summary>
        private static readonly EnumAssetType[] VariableIncomeTypes =
        [
            EnumAssetType.Acao, EnumAssetType.FII, EnumAssetType.Stock, EnumAssetType.Reit,
            EnumAssetType.BDR, EnumAssetType.ETF, EnumAssetType.ETFInternacional, EnumAssetType.Cripto
        ];

        public InsightSnapshotBuilder(ApplicationDbContext context)
        {
            _context = context;
        }

        /// <summary>
        /// The spending snapshot: this week against the user's own history, plus reserve
        /// coverage and goal progress.
        /// </summary>
        public async Task<InsightSnapshotDto?> BuildSpendingSnapshotAsync(int userId, DateOnly weekStart)
        {
            var weekEnd = weekStart.AddDays(6);
            var historyStart = weekStart.AddDays(-7 * 12);

            var transactions = await _context.Transactions
                .AsNoTracking()
                .Where(t => t.UserId == userId)
                .Where(t => t.Type == EnumTransactionType.Expense)
                .Where(t => t.TransactionDate >= historyStart && t.TransactionDate <= weekEnd)
                .Select(t => new
                {
                    t.TransactionDate,
                    t.Value,
                    Category = t.SubCategory.Category.Name
                })
                .ToListAsync();

            // Below this there is nothing to compare against, and a confident sentence
            // built on four data points is worse than no card at all.
            if (transactions.Count < 5)
                return null;

            var currentWeek = transactions.Where(t => t.TransactionDate >= weekStart).ToList();
            var previousWeekStart = weekStart.AddDays(-7);
            var previousWeek = transactions
                .Where(t => t.TransactionDate >= previousWeekStart && t.TransactionDate < weekStart)
                .ToList();

            var historical = transactions.Where(t => t.TransactionDate < weekStart).ToList();
            var weeksWithHistory = Math.Max(1, (weekStart.DayNumber - historyStart.DayNumber) / 7);

            var currentWeekTotal = currentWeek.Sum(t => t.Value);
            var weeklyAverage = historical.Sum(t => t.Value) / weeksWithHistory;

            var weekendHistorical = historical.Where(t => IsWeekend(t.TransactionDate)).Sum(t => t.Value);
            var weekdayHistorical = historical.Sum(t => t.Value) - weekendHistorical;
            var weekendDays = Math.Max(1, CountDays(historyStart, weekStart, weekend: true));
            var weekdayDays = Math.Max(1, CountDays(historyStart, weekStart, weekend: false));

            var currentWeekendTotal = currentWeek.Where(t => IsWeekend(t.TransactionDate)).Sum(t => t.Value);
            var weekendAveragePerWeek = weekendHistorical * 2 / weekendDays;

            var categories = currentWeek
                .GroupBy(t => t.Category)
                .Select(g => new
                {
                    Category = g.Key,
                    Current = g.Sum(t => t.Value),
                    Average = historical.Where(t => t.Category == g.Key).Sum(t => t.Value) / weeksWithHistory
                })
                .OrderByDescending(c => c.Current)
                .Take(6)
                .Select(c => new InsightCategoryTotalDto
                {
                    Category = c.Category,
                    CurrentWeek = InsightFormat.Money(c.Current),
                    TwelveWeekAverage = InsightFormat.Money(c.Average),
                    ChangeVsAverage = InsightFormat.Change(c.Current, c.Average)
                })
                .ToList();

            var months = await BuildMonthsAsync(userId, weekEnd);

            var snapshot = new InsightSnapshotDto
            {
                PeriodStart = weekStart,
                PeriodEnd = weekEnd,
                Spending = new InsightSpendingDto
                {
                    CurrentWeekTotal = InsightFormat.Money(currentWeekTotal),
                    PreviousWeekTotal = InsightFormat.Money(previousWeek.Sum(t => t.Value)),
                    TwelveWeekAverage = InsightFormat.Money(weeklyAverage),
                    ChangeVsAverage = InsightFormat.Change(currentWeekTotal, weeklyAverage),
                    WeekdayAverage = InsightFormat.Money(weekdayHistorical * 5 / weekdayDays),
                    WeekendAverage = InsightFormat.Money(weekendAveragePerWeek),
                    CurrentWeekendTotal = InsightFormat.Money(currentWeekendTotal),
                    WeekendChangeVsAverage = InsightFormat.Change(currentWeekendTotal, weekendAveragePerWeek),
                    Categories = categories,
                    Months = months
                },
                Reserve = await BuildReserveAsync(userId, weekEnd),
                Goals = await BuildGoalsAsync(userId)
            };

            await AttachProfileAndContextAsync(snapshot, userId, weekEnd);

            return snapshot;
        }

        /// <summary>
        /// The portfolio snapshot: weights, concentration, observed oscillation and where
        /// the recent contributions went. Nothing here evaluates an asset.
        /// </summary>
        public async Task<InsightSnapshotDto?> BuildPortfolioSnapshotAsync(
            int userId,
            DateOnly weekStart,
            int maxPriceAgeDays)
        {
            var positions = await _context.Investments
                .AsNoTracking()
                .Where(i => i.UserId == userId && i.CurrentQuantity > 0)
                .Select(i => new
                {
                    i.MarketAssetId,
                    i.CurrentQuantity,
                    i.AveragePrice,
                    Ticker = i.MarketAsset.Ticker,
                    AssetType = i.MarketAsset.AssetType,
                    CurrentPrice = i.MarketAsset.CurrentPrice,
                    LastPriceUpdate = i.MarketAsset.LastPriceUpdate
                })
                .ToListAsync();

            if (positions.Count == 0)
                return null;

            var priceAgeDays = positions
                .Select(p => p.LastPriceUpdate.HasValue
                    ? (int)(DateTime.UtcNow - p.LastPriceUpdate.Value).TotalDays
                    : int.MaxValue)
                .DefaultIfEmpty(int.MaxValue)
                .Max();

            // A portfolio analysis over stale prices narrates a market that no longer
            // exists. Refusing is the honest outcome.
            if (priceAgeDays > maxPriceAgeDays)
                return null;

            var valued = positions
                .Select(p => new
                {
                    p.Ticker,
                    p.AssetType,
                    p.MarketAssetId,
                    p.CurrentQuantity,
                    Value = (long)(p.CurrentQuantity * p.CurrentPrice),
                    Cost = (long)(p.CurrentQuantity * p.AveragePrice)
                })
                .Where(p => p.Value > 0)
                .ToList();

            var totalValue = valued.Sum(p => p.Value);
            if (totalValue <= 0)
                return null;

            var byClass = valued
                .GroupBy(p => p.AssetType)
                .Select(g => new
                {
                    AssetType = g.Key,
                    Value = g.Sum(p => p.Value)
                })
                .OrderByDescending(g => g.Value)
                .ToList();

            var largestPosition = valued.MaxBy(p => p.Value)!;
            var largestClass = byClass[0];
            var variableIncomeValue = valued
                .Where(p => VariableIncomeTypes.Contains(p.AssetType))
                .Sum(p => p.Value);

            var (worstChange, worstLabel) = await ComputeWorstQuarterAsync(
                valued.ToDictionary(p => p.MarketAssetId, p => p.CurrentQuantity));

            var portfolio = new InsightPortfolioDto
            {
                TotalValue = InsightFormat.Money(totalValue),
                PositionCount = valued.Count,
                ByClass = byClass
                    .Select(g => new InsightAssetClassWeightDto
                    {
                        AssetClass = InsightFormat.AssetClass(g.AssetType),
                        Value = InsightFormat.Money(g.Value),
                        Weight = InsightFormat.Percent(g.Value, totalValue)
                    })
                    .ToList(),
                Positions = valued
                    .OrderByDescending(p => p.Value)
                    .Take(15)
                    .Select(p => new InsightPositionDto
                    {
                        Ticker = p.Ticker,
                        AssetClass = InsightFormat.AssetClass(p.AssetType),
                        Value = InsightFormat.Money(p.Value),
                        Weight = InsightFormat.Percent(p.Value, totalValue),
                        Result = InsightFormat.Change(p.Value, p.Cost)
                    })
                    .ToList(),
                LargestPositionTicker = largestPosition.Ticker,
                LargestPositionWeight = InsightFormat.Percent(largestPosition.Value, totalValue),
                LargestClass = InsightFormat.AssetClass(largestClass.AssetType),
                LargestClassWeight = InsightFormat.Percent(largestClass.Value, totalValue),
                VariableIncomeWeight = InsightFormat.Percent(variableIncomeValue, totalValue),
                WorstQuarterChange = worstChange,
                WorstQuarterLabel = worstLabel,
                RecentContributions = await BuildContributionsAsync(userId),
                PriceAgeDays = priceAgeDays
            };

            var snapshot = new InsightSnapshotDto
            {
                PeriodStart = weekStart,
                PeriodEnd = weekStart.AddDays(6),
                Portfolio = portfolio,
                Reserve = await BuildReserveAsync(userId, weekStart.AddDays(6))
            };

            await AttachProfileAndContextAsync(snapshot, userId, weekStart.AddDays(6));

            return snapshot;
        }

        /// <summary>Tickers the user actually holds — what the guard checks the text against.</summary>
        public async Task<List<string>> GetOwnedTickersAsync(int userId) =>
            await _context.Investments
                .AsNoTracking()
                .Where(i => i.UserId == userId && i.CurrentQuantity > 0)
                .Select(i => i.MarketAsset.Ticker)
                .ToListAsync();

        private async Task<List<InsightMonthTotalDto>> BuildMonthsAsync(int userId, DateOnly reference)
        {
            var start = new DateOnly(reference.Year, reference.Month, 1).AddMonths(-5);

            var rows = await _context.Transactions
                .AsNoTracking()
                .Where(t => t.UserId == userId)
                .Where(t => t.TransactionDate >= start && t.TransactionDate <= reference)
                .Where(t => t.Type == EnumTransactionType.Income || t.Type == EnumTransactionType.Expense)
                .GroupBy(t => new { t.TransactionDate.Year, t.TransactionDate.Month })
                .Select(g => new
                {
                    g.Key.Year,
                    g.Key.Month,
                    Income = g.Where(t => t.Type == EnumTransactionType.Income).Sum(t => (int?)t.Value) ?? 0,
                    Expense = g.Where(t => t.Type == EnumTransactionType.Expense).Sum(t => (int?)t.Value) ?? 0
                })
                .ToListAsync();

            return rows
                .OrderBy(r => r.Year).ThenBy(r => r.Month)
                .Select(r => new InsightMonthTotalDto
                {
                    Month = InsightFormat.MonthLabel(r.Year, r.Month),
                    Income = InsightFormat.Money(r.Income),
                    Expense = InsightFormat.Money(r.Expense),
                    Balance = InsightFormat.Money(r.Income - r.Expense)
                })
                .ToList();
        }

        /// <summary>
        /// Question 4. Liquid balance excludes credit accounts — a card limit is not money
        /// the person has.
        /// </summary>
        private async Task<InsightReserveDto?> BuildReserveAsync(int userId, DateOnly reference)
        {
            var sixMonthsAgo = new DateOnly(reference.Year, reference.Month, 1).AddMonths(-5);

            var monthlyExpenses = await _context.Transactions
                .AsNoTracking()
                .Where(t => t.UserId == userId && t.Type == EnumTransactionType.Expense)
                .Where(t => t.TransactionDate >= sixMonthsAgo && t.TransactionDate <= reference)
                .GroupBy(t => new { t.TransactionDate.Year, t.TransactionDate.Month })
                .Select(g => g.Sum(t => t.Value))
                .ToListAsync();

            if (monthlyExpenses.Count == 0)
                return null;

            var averageMonthlyExpense = (int)monthlyExpenses.Average();
            if (averageMonthlyExpense <= 0)
                return null;

            var liquidAccountIds = await _context.Accounts
                .AsNoTracking()
                .Where(a => a.UserId == userId && a.Type != EnumAccountType.Credit && !a.IsSystem)
                .Select(a => a.Id)
                .ToListAsync();

            var incoming = await _context.Transactions
                .AsNoTracking()
                .Where(t => t.UserId == userId)
                .Where(t => t.Type == EnumTransactionType.Income && liquidAccountIds.Contains(t.AccountId))
                .SumAsync(t => (long?)t.Value) ?? 0;

            var outgoing = await _context.Transactions
                .AsNoTracking()
                .Where(t => t.UserId == userId)
                .Where(t => (t.Type == EnumTransactionType.Expense || t.Type == EnumTransactionType.Transfer)
                            && liquidAccountIds.Contains(t.AccountId))
                .SumAsync(t => (long?)t.Value) ?? 0;

            var transfersIn = await _context.Transactions
                .AsNoTracking()
                .Where(t => t.UserId == userId)
                .Where(t => t.Type == EnumTransactionType.Transfer
                            && t.DestinationAccountId != null
                            && liquidAccountIds.Contains(t.DestinationAccountId.Value))
                .SumAsync(t => (long?)t.Value) ?? 0;

            var liquidBalance = incoming - outgoing + transfersIn;
            var target = await _context.UserRiskProfiles
                .AsNoTracking()
                .Where(p => p.UserId == userId)
                .Select(p => (int?)p.ReserveMonthsTarget)
                .FirstOrDefaultAsync();

            return new InsightReserveDto
            {
                AverageMonthlyExpense = InsightFormat.Money(averageMonthlyExpense),
                LiquidBalance = InsightFormat.Money(liquidBalance),
                MonthsCovered = InsightFormat.Decimal((decimal)liquidBalance / averageMonthlyExpense),
                TargetMonths = target
            };
        }

        /// <summary>
        /// Question 6. The goal name is user-written free text and may carry personal
        /// detail; it is sent because the analysis is meaningless without it, and that
        /// choice is declared in the privacy policy.
        /// </summary>
        private async Task<List<InsightGoalDto>> BuildGoalsAsync(int userId)
        {
            var goals = await _context.Goals
                .AsNoTracking()
                .Where(g => g.UserId == userId && g.Status == EnumGoalStatus.Active)
                .Select(g => new
                {
                    g.Name,
                    g.TargetAmount,
                    g.TargetDate,
                    g.AccountId
                })
                .Take(5)
                .ToListAsync();

            var result = new List<InsightGoalDto>();
            var today = DateOnly.FromDateTime(DateTime.UtcNow);

            foreach (var goal in goals)
            {
                if (goal.TargetAmount <= 0)
                    continue;

                var current = goal.AccountId is null
                    ? 0
                    : await _context.Transactions
                        .AsNoTracking()
                        .Where(t => t.UserId == userId && t.DestinationAccountId == goal.AccountId)
                        .SumAsync(t => (int?)t.Value) ?? 0;

                var monthsLeft = Math.Max(1, ((goal.TargetDate.Year - today.Year) * 12)
                                             + goal.TargetDate.Month - today.Month);
                var missing = Math.Max(0, goal.TargetAmount - current);

                result.Add(new InsightGoalDto
                {
                    Name = goal.Name,
                    TargetAmount = InsightFormat.Money(goal.TargetAmount),
                    CurrentAmount = InsightFormat.Money(current),
                    Progress = InsightFormat.Percent(current, goal.TargetAmount),
                    TargetDate = goal.TargetDate,
                    MonthlyNeeded = InsightFormat.Money(missing / monthsLeft)
                });
            }

            return result;
        }

        /// <summary>Question 5 — where the last three months of buying actually went.</summary>
        private async Task<List<InsightContributionDto>> BuildContributionsAsync(int userId)
        {
            var since = DateOnly.FromDateTime(DateTime.UtcNow).AddMonths(-3);

            var rows = await _context.InvestmentTransactions
                .AsNoTracking()
                .Where(t => t.UserId == userId)
                .Where(t => t.Operation == EnumInvestmentOperation.Buy && t.Date >= since)
                .Select(t => new
                {
                    AssetType = t.Investment.MarketAsset.AssetType,
                    t.TotalValue
                })
                .ToListAsync();

            return rows
                .GroupBy(r => r.AssetType)
                .Select(g => new InsightContributionDto
                {
                    AssetClass = InsightFormat.AssetClass(g.Key),
                    Count = g.Count(),
                    Value = InsightFormat.Money(g.Sum(r => r.TotalValue))
                })
                .OrderByDescending(c => c.Count)
                .ToList();
        }

        /// <summary>
        /// Question 2. Holds today's quantities fixed and revalues them at historical
        /// prices, quarter by quarter, then reports the worst quarter observed. It answers
        /// "how much would this portfolio have swung", not "how much did I lose" — which
        /// is the honest question, since the composition changed over time.
        /// </summary>
        private async Task<(string? Change, string? Label)> ComputeWorstQuarterAsync(
            Dictionary<int, decimal> quantitiesByAsset)
        {
            var assetIds = quantitiesByAsset.Keys.ToList();
            var since = DateOnly.FromDateTime(DateTime.UtcNow).AddYears(-5);

            var history = await _context.MarketPriceHistories
                .AsNoTracking()
                .Where(h => assetIds.Contains(h.MarketAssetId) && h.Date >= since)
                .Select(h => new { h.MarketAssetId, h.Date, h.Price })
                .ToListAsync();

            if (history.Count == 0)
                return (null, null);

            // One value per quarter, using the last observed price of each asset in it.
            var byQuarter = history
                .GroupBy(h => new { h.Date.Year, Quarter = (h.Date.Month - 1) / 3 + 1 })
                .OrderBy(g => g.Key.Year).ThenBy(g => g.Key.Quarter)
                .Select(g => new
                {
                    g.Key.Year,
                    g.Key.Quarter,
                    Value = g.GroupBy(h => h.MarketAssetId)
                        .Sum(assetGroup => (long)(quantitiesByAsset[assetGroup.Key]
                            * assetGroup.OrderByDescending(h => h.Date).First().Price))
                })
                .Where(q => q.Value > 0)
                .ToList();

            if (byQuarter.Count < 2)
                return (null, null);

            var worstChange = 0m;
            string? worstLabel = null;

            for (var index = 1; index < byQuarter.Count; index++)
            {
                var previous = byQuarter[index - 1];
                var current = byQuarter[index];

                var change = (decimal)(current.Value - previous.Value) / previous.Value * 100m;
                if (change >= worstChange)
                    continue;

                worstChange = change;
                worstLabel = $"{current.Quarter}º trimestre de {current.Year}";
            }

            return worstLabel is null
                ? (null, null)
                : (InsightFormat.SignedPercent(worstChange), worstLabel);
        }

        private async Task AttachProfileAndContextAsync(InsightSnapshotDto snapshot, int userId, DateOnly reference)
        {
            var classification = await _context.UserRiskProfiles
                .AsNoTracking()
                .Where(p => p.UserId == userId)
                .Select(p => (EnumRiskClassification?)p.Classification)
                .FirstOrDefaultAsync();

            snapshot.DeclaredRiskProfile = classification.HasValue
                ? InsightFormat.RiskProfile(classification.Value)
                : null;

            var monthStart = new DateOnly(reference.Year, reference.Month, 1);
            snapshot.UserContext = await _context.UserAiContexts
                .AsNoTracking()
                .Where(c => c.UserId == userId && c.PeriodStart == monthStart)
                .Select(c => c.Text)
                .FirstOrDefaultAsync();
        }

        private static bool IsWeekend(DateOnly date) =>
            date.DayOfWeek is DayOfWeek.Saturday or DayOfWeek.Sunday;

        private static int CountDays(DateOnly start, DateOnly end, bool weekend)
        {
            var count = 0;
            for (var date = start; date < end; date = date.AddDays(1))
            {
                if (IsWeekend(date) == weekend)
                    count++;
            }

            return count;
        }
    }
}

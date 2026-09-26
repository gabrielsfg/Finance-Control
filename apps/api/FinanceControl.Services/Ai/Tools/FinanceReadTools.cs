using FinanceControl.Data.Data;
using FinanceControl.Domain.Interfaces.Service;
using FinanceControl.Domain.Interfaces.Services;
using FinanceControl.Shared.Dtos.Request;
using FinanceControl.Shared.Enums;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;

namespace FinanceControl.Services.Ai.Tools
{
    /// <summary>Accounts, categories, tags, budgets, goals and recurrences — the reference data every answer leans on.</summary>
    internal static class FinanceReadTools
    {
        public const string Scope = "finance:read";

        private const string NoArguments = """{ "type": "object", "properties": {}, "additionalProperties": false }""";

        public static IEnumerable<AiTool> Create()
        {
            yield return new AiTool(
                "get_overview",
                "Snapshot of the user's finances today: total balance across accounts, credit card balances, " +
                "this month's income and expenses so far, portfolio value and net worth. Start here for broad questions. " +
                AiToolRegistry.MoneyConvention,
                NoArguments,
                Scope,
                IsProposal: false,
                GetOverviewAsync);

            yield return new AiTool(
                "list_accounts",
                "The user's accounts with id, name, type (Checking, Savings, Credit, Cash) and current balance. " +
                "Use the ids to filter other tools or to propose a transaction. " + AiToolRegistry.MoneyConvention,
                NoArguments,
                Scope,
                IsProposal: false,
                async (context, _) =>
                {
                    var accounts = await context.Services.GetRequiredService<IAccountService>().GetAllAccountAsync(context.UserId);
                    return accounts.Select(a => new
                    {
                        a.Id,
                        a.Name,
                        a.Type,
                        Balance = a.CurrentAmount,
                        BalanceFormatted = InsightFormat.Money(a.CurrentAmount),
                        a.IsDefaultAccount,
                        a.CreditLimit
                    });
                });

            yield return new AiTool(
                "list_categories",
                "The user's categories and their subcategories, with ids. Transactions always belong to a subcategory. " +
                "Use the ids to filter search_transactions / summarize_transactions or to propose a transaction.",
                NoArguments,
                Scope,
                IsProposal: false,
                async (context, _) =>
                {
                    var categories = await context.Services.GetRequiredService<ICategoryService>().GetAllCategoriesAsync(context.UserId);
                    return categories.Select(c => new
                    {
                        c.Id,
                        c.Name,
                        SubCategories = (c.SubCategories ?? []).Select(s => new { s.Id, s.Name, s.IsSavings })
                    });
                });

            yield return new AiTool(
                "list_tags",
                "The user's tags with id, name and how many transactions carry each. Use the ids to filter transactions by tag.",
                NoArguments,
                Scope,
                IsProposal: false,
                async (context, _) =>
                {
                    var tags = await context.Services.GetRequiredService<ITagService>().GetAllTagsAsync(context.UserId);
                    return tags.Select(t => new { t.Id, t.Name, t.TransactionCount });
                });

            yield return new AiTool(
                "get_budgets",
                "The user's budgets for the period containing referenceDate (default today): allocated, spent, income, " +
                "available, and per-subcategory allocations with spent percentage. Use it to answer whether a budget was exceeded. " +
                AiToolRegistry.MoneyConvention,
                """
                {
                  "type": "object",
                  "properties": {
                    "referenceDate": { "type": "string", "description": "Any date inside the budget period wanted, YYYY-MM-DD. Default: today." }
                  },
                  "additionalProperties": false
                }
                """,
                Scope,
                IsProposal: false,
                async (context, args) =>
                {
                    var budgets = await context.Services.GetRequiredService<IBudgetService>()
                        .GetAllBudgetAsync(context.UserId, args.GetDate("referenceDate"));
                    return budgets;
                });

            yield return new AiTool(
                "get_goals",
                "The user's goals (Item or Investment) with target amount, current amount, target date, priority and status. " +
                AiToolRegistry.MoneyConvention,
                """
                {
                  "type": "object",
                  "properties": {
                    "type": { "type": "string", "enum": ["Item", "Investment"] },
                    "status": { "type": "string", "enum": ["Active", "Achieved", "Cancelled"] }
                  },
                  "additionalProperties": false
                }
                """,
                Scope,
                IsProposal: false,
                async (context, args) =>
                {
                    var goals = await context.Services.GetRequiredService<IGoalService>().GetAllAsync(
                        context.UserId,
                        args.GetEnum<EnumGoalType>("type"),
                        args.GetEnum<EnumGoalStatus>("status"));

                    return goals.Select(g => new
                    {
                        g.Id,
                        g.Name,
                        g.Description,
                        g.Type,
                        g.Status,
                        g.Priority,
                        g.TargetAmount,
                        TargetFormatted = InsightFormat.Money(g.TargetAmount),
                        g.CurrentAmount,
                        CurrentFormatted = g.CurrentAmount is { } current ? InsightFormat.Money(current) : null,
                        g.TargetDate,
                        g.TargetTicker,
                        g.AchievedAt
                    });
                });

            yield return new AiTool(
                "list_recurrences",
                "The user's recurring transactions (subscriptions, salary, bills) with value, recurrence, category, account " +
                "and whether each is active, plus installment plans in progress. " + AiToolRegistry.MoneyConvention,
                NoArguments,
                Scope,
                IsProposal: false,
                async (context, _) =>
                    await context.Services.GetRequiredService<IRecurrencePageService>().GetPageAsync(context.UserId));
        }

        private static async Task<object> GetOverviewAsync(AiToolContext context, AiToolArguments _)
        {
            var services = context.Services;
            var userId = context.UserId;
            var today = DateOnly.FromDateTime(DateTime.UtcNow);
            var monthStart = new DateOnly(today.Year, today.Month, 1);

            var accounts = (await services.GetRequiredService<IAccountService>().GetAllAccountAsync(userId)).ToList();

            var db = services.GetRequiredService<ApplicationDbContext>();
            var monthTotals = await db.Transactions
                .AsNoTracking()
                .Where(t => t.UserId == userId && t.TransactionDate >= monthStart && t.TransactionDate <= today)
                .Where(t => t.Type != EnumTransactionType.Transfer)
                .GroupBy(t => t.Type)
                .Select(g => new { Type = g.Key, Total = g.Sum(t => (long)t.Value) })
                .ToListAsync(context.CancellationToken);

            var income = monthTotals.FirstOrDefault(t => t.Type == EnumTransactionType.Income)?.Total ?? 0;
            var expense = monthTotals.FirstOrDefault(t => t.Type == EnumTransactionType.Expense)?.Total ?? 0;

            var portfolio = await services.GetRequiredService<IInvestmentService>().GetPortfolioAsync(userId);

            var netWorth = (await services.GetRequiredService<IAnalyticsService>().GetNetWorthEvolutionAsync(new AnalyticsRequestDto
            {
                StartDate = monthStart.AddMonths(-1),
                FinishDate = today,
                UserId = userId
            })).LastOrDefault()?.NetWorth;

            var cashAccounts = accounts.Where(a => a.Type != EnumAccountType.Credit).ToList();
            var creditAccounts = accounts.Where(a => a.Type == EnumAccountType.Credit).ToList();
            var cashBalance = cashAccounts.Sum(a => (long)a.CurrentAmount);

            return new
            {
                Today = today,
                AccountsBalance = cashBalance,
                AccountsBalanceFormatted = InsightFormat.Money(cashBalance),
                CreditCards = creditAccounts.Select(a => new
                {
                    a.Name,
                    Balance = a.CurrentAmount,
                    BalanceFormatted = InsightFormat.Money(a.CurrentAmount),
                    a.CreditLimit
                }),
                MonthToDate = new
                {
                    From = monthStart,
                    To = today,
                    Income = income,
                    IncomeFormatted = InsightFormat.Money(income),
                    Expense = expense,
                    ExpenseFormatted = InsightFormat.Money(expense),
                    Result = income - expense,
                    ResultFormatted = InsightFormat.Money(income - expense)
                },
                PortfolioValue = portfolio.CurrentValue,
                PortfolioValueFormatted = InsightFormat.Money(portfolio.CurrentValue),
                NetWorth = netWorth,
                NetWorthFormatted = netWorth is { } value ? InsightFormat.Money(value) : null
            };
        }
    }
}

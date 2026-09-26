using FinanceControl.Data.Data;
using FinanceControl.Domain.Entities;
using FinanceControl.Domain.Interfaces.Services;
using FinanceControl.Shared.Dtos.Request;
using FinanceControl.Shared.Enums;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;

namespace FinanceControl.Services.Ai.Tools
{
    /// <summary>
    /// The two transaction tools: rows for "which ones", totals for "how much". Most chat
    /// questions ("quanto gasto por mês com mercado?") are summarize_transactions calls.
    /// </summary>
    internal static class TransactionReadTools
    {
        public const string Scope = "transactions:read";

        private const int DefaultPageSize = 50;
        private const int MaxPageSize = 200;

        private const string FilterProperties = """
                "startDate": { "type": "string", "description": "First day included, YYYY-MM-DD. Default: 30 days ago." },
                "endDate": { "type": "string", "description": "Last day included, YYYY-MM-DD. Default: today." },
                "accountIds": { "type": "array", "items": { "type": "integer" } },
                "categoryIds": { "type": "array", "items": { "type": "integer" } },
                "subCategoryIds": { "type": "array", "items": { "type": "integer" } },
                "tagIds": { "type": "array", "items": { "type": "integer" }, "description": "Matches transactions carrying any of these tags." },
                "search": { "type": "string", "description": "Free text matched against description, subcategory and account name." },
                "type": { "type": "string", "enum": ["Expense", "Income", "Transfer"] },
                "minValue": { "type": "integer", "description": "Minimum magnitude in cents." },
                "maxValue": { "type": "integer", "description": "Maximum magnitude in cents." }
            """;

        public static IEnumerable<AiTool> Create()
        {
            yield return new AiTool(
                "search_transactions",
                "Lists individual transactions matching the filters, newest first, with id, date, description, value, " +
                "type, category, subcategory, account, tags and installment info, plus the income/expense totals of the " +
                "whole filtered set. Use it to find specific transactions or the ids needed to edit one. For totals " +
                "grouped by month, category, tag or account prefer summarize_transactions. " + AiToolRegistry.MoneyConvention,
                $$"""
                {
                  "type": "object",
                  "properties": {
                    {{FilterProperties}},
                    "page": { "type": "integer", "minimum": 1 },
                    "pageSize": { "type": "integer", "minimum": 1, "maximum": {{MaxPageSize}} }
                  },
                  "additionalProperties": false
                }
                """,
                Scope,
                IsProposal: false,
                SearchAsync);

            yield return new AiTool(
                "summarize_transactions",
                "Totals of transactions matching the filters, grouped by month, category, subcategory, tag, account or " +
                "not grouped. Answers questions like 'how much do I spend per month on category X', 'how much did I spend " +
                "with tag Y this year' or 'how much did I spend between two dates'. Type defaults to Expense. Each group " +
                "has the total, the count and the average per month of the period. " + AiToolRegistry.MoneyConvention,
                $$"""
                {
                  "type": "object",
                  "properties": {
                    {{FilterProperties}},
                    "groupBy": { "type": "string", "enum": ["none", "month", "category", "subcategory", "tag", "account"] }
                  },
                  "additionalProperties": false
                }
                """,
                Scope,
                IsProposal: false,
                SummarizeAsync);
        }

        private static (DateOnly Start, DateOnly End) ReadPeriod(AiToolArguments args)
        {
            var today = DateOnly.FromDateTime(DateTime.UtcNow);
            var end = args.GetDate("endDate") ?? today;
            var start = args.GetDate("startDate") ?? end.AddDays(-30);

            if (start > end)
                throw new AiToolException("'startDate' must not be after 'endDate'.");

            if (end.DayNumber - start.DayNumber > 366 * 10)
                throw new AiToolException("The period is limited to 10 years.");

            return (start, end);
        }

        private static async Task<object> SearchAsync(AiToolContext context, AiToolArguments args)
        {
            var (start, end) = ReadPeriod(args);
            var pageSize = Math.Clamp(args.GetInt("pageSize") ?? DefaultPageSize, 1, MaxPageSize);

            var result = await context.Services.GetRequiredService<ITransactionService>().GetAllTransactionsFilteredAsync(
                new GetTransactionsFilterRequestDto
                {
                    StartDate = start,
                    FinishDate = end,
                    AccountIds = args.GetIntList("accountIds"),
                    CategoryIds = args.GetIntList("categoryIds"),
                    SubCategoryIds = args.GetIntList("subCategoryIds"),
                    TagIds = args.GetIntList("tagIds"),
                    Search = args.GetString("search"),
                    Type = args.GetEnum<EnumTransactionType>("type"),
                    MinValue = args.GetInt("minValue"),
                    MaxValue = args.GetInt("maxValue"),
                    Page = Math.Max(1, args.GetInt("page") ?? 1),
                    PageSize = pageSize,
                    SortField = "date",
                    SortOrder = "desc"
                },
                context.UserId);

            return new
            {
                Period = new { Start = start, End = end },
                result.TotalIncome,
                TotalIncomeFormatted = InsightFormat.Money(result.TotalIncome),
                result.TotalExpense,
                TotalExpenseFormatted = InsightFormat.Money(result.TotalExpense),
                result.Balance,
                Page = result.Page?.CurrentPage,
                TotalPages = result.Page?.TotalPages,
                TotalItems = result.Page?.TotalItems,
                Transactions = (result.Page?.Items ?? []).Select(t => new
                {
                    t.Id,
                    Date = t.TransactionDate,
                    t.Description,
                    t.Value,
                    ValueFormatted = InsightFormat.Money(t.Value),
                    t.Type,
                    Category = t.CategoryName,
                    SubCategory = t.SubCategoryName,
                    t.SubCategoryId,
                    Account = t.AccountName,
                    t.AccountId,
                    DestinationAccount = t.DestinationAccountName,
                    t.PaymentType,
                    t.PaymentMethod,
                    t.InstallmentNumber,
                    t.TotalInstallments,
                    Budget = t.BudgetName,
                    Tags = t.Tags.Select(tag => tag.Name)
                })
            };
        }

        private static async Task<object> SummarizeAsync(AiToolContext context, AiToolArguments args)
        {
            var (start, end) = ReadPeriod(args);
            var type = args.GetEnum<EnumTransactionType>("type") ?? EnumTransactionType.Expense;
            var groupBy = (args.GetString("groupBy") ?? "none").ToLowerInvariant();

            var db = context.Services.GetRequiredService<ApplicationDbContext>();
            var query = db.Transactions
                .AsNoTracking()
                .Where(t => t.UserId == context.UserId)
                .Where(t => t.TransactionDate >= start && t.TransactionDate <= end)
                .Where(t => t.Type == type);

            query = ApplyFilters(query, args);

            // Calendar months touched by the period, for the per-month average.
            var months = Math.Max(1, (end.Year - start.Year) * 12 + end.Month - start.Month + 1);

            List<SummaryRow> rows = groupBy switch
            {
                "none" => await query
                    .GroupBy(_ => 1)
                    .Select(g => new SummaryRow("Total", null, g.Sum(t => (long)t.Value), g.Count()))
                    .ToListAsync(context.CancellationToken),

                "month" => (await query
                        .GroupBy(t => new { t.TransactionDate.Year, t.TransactionDate.Month })
                        .Select(g => new { g.Key.Year, g.Key.Month, Total = g.Sum(t => (long)t.Value), Count = g.Count() })
                        .ToListAsync(context.CancellationToken))
                    .OrderBy(g => g.Year).ThenBy(g => g.Month)
                    .Select(g => new SummaryRow($"{g.Year:D4}-{g.Month:D2}", null, g.Total, g.Count))
                    .ToList(),

                "category" => await query
                    .GroupBy(t => new { t.SubCategory.Category.Id, t.SubCategory.Category.Name })
                    .Select(g => new SummaryRow(g.Key.Name, g.Key.Id, g.Sum(t => (long)t.Value), g.Count()))
                    .ToListAsync(context.CancellationToken),

                "subcategory" => await query
                    .GroupBy(t => new { t.SubCategory.Id, t.SubCategory.Name, Category = t.SubCategory.Category.Name })
                    .Select(g => new SummaryRow(g.Key.Category + " > " + g.Key.Name, g.Key.Id, g.Sum(t => (long)t.Value), g.Count()))
                    .ToListAsync(context.CancellationToken),

                "account" => await query
                    .GroupBy(t => new { t.Account.Id, t.Account.Name })
                    .Select(g => new SummaryRow(g.Key.Name, g.Key.Id, g.Sum(t => (long)t.Value), g.Count()))
                    .ToListAsync(context.CancellationToken),

                // A transaction with two tags counts in both groups, which is what "how much
                // did I spend with tag X" means; the note in the result says so.
                "tag" => await query
                    .SelectMany(t => t.Tags, (t, tag) => new { tag.Id, tag.Name, t.Value })
                    .GroupBy(x => new { x.Id, x.Name })
                    .Select(g => new SummaryRow(g.Key.Name, g.Key.Id, g.Sum(x => (long)x.Value), g.Count()))
                    .ToListAsync(context.CancellationToken),

                _ => throw new AiToolException("'groupBy' must be one of: none, month, category, subcategory, tag, account.")
            };

            if (groupBy != "month")
                rows = rows.OrderByDescending(r => r.Total).ToList();

            var grandTotal = await query.SumAsync(t => (long?)t.Value, context.CancellationToken) ?? 0;
            var grandCount = await query.CountAsync(context.CancellationToken);

            return new
            {
                Period = new { Start = start, End = end, CalendarMonths = months },
                Type = type,
                GroupBy = groupBy,
                Total = grandTotal,
                TotalFormatted = InsightFormat.Money(grandTotal),
                Count = grandCount,
                AveragePerMonth = grandTotal / months,
                AveragePerMonthFormatted = InsightFormat.Money(grandTotal / months),
                Note = groupBy == "tag" ? "A transaction with several tags is counted under each of them." : null,
                Groups = rows.Select(r => new
                {
                    r.Label,
                    r.Id,
                    r.Total,
                    TotalFormatted = InsightFormat.Money(r.Total),
                    r.Count,
                    AveragePerMonthFormatted = groupBy == "month" ? null : InsightFormat.Money(r.Total / months),
                    ShareOfTotal = grandTotal == 0 ? null : InsightFormat.Percent(r.Total, grandTotal)
                })
            };
        }

        private static IQueryable<Transaction> ApplyFilters(IQueryable<Transaction> query, AiToolArguments args)
        {
            if (args.GetIntList("accountIds") is { } accountIds)
                query = query.Where(t => accountIds.Contains(t.AccountId));

            if (args.GetIntList("categoryIds") is { } categoryIds)
                query = query.Where(t => categoryIds.Contains(t.SubCategory.CategoryId));

            if (args.GetIntList("subCategoryIds") is { } subCategoryIds)
                query = query.Where(t => subCategoryIds.Contains(t.SubCategoryId));

            if (args.GetIntList("tagIds") is { } tagIds)
                query = query.Where(t => t.Tags.Any(tag => tagIds.Contains(tag.Id)));

            if (args.GetString("search") is { Length: > 0 } search)
            {
                var pattern = $"%{search.Trim()}%";
                query = query.Where(t =>
                    EF.Functions.ILike(t.Description, pattern) ||
                    EF.Functions.ILike(t.SubCategory.Name, pattern) ||
                    EF.Functions.ILike(t.Account.Name, pattern));
            }

            if (args.GetInt("minValue") is { } minValue)
                query = query.Where(t => t.Value >= minValue);

            if (args.GetInt("maxValue") is { } maxValue)
                query = query.Where(t => t.Value <= maxValue);

            return query;
        }

        private sealed record SummaryRow(string Label, int? Id, long Total, int Count);
    }
}

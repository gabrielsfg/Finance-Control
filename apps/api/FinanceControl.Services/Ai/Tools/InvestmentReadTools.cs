using FinanceControl.Data.Data;
using FinanceControl.Domain.Interfaces.Services;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;

namespace FinanceControl.Services.Ai.Tools
{
    /// <summary>
    /// The portfolio as the app shows it. Descriptive only: the chat's prompt and the
    /// output guard forbid recommending any asset, and nothing here evaluates one.
    /// </summary>
    internal static class InvestmentReadTools
    {
        public const string Scope = "investments:read";

        private const string PeriodSchema = """
            {
              "type": "object",
              "properties": {
                "startDate": { "type": "string", "description": "YYYY-MM-DD. Default: 12 months ago." },
                "endDate": { "type": "string", "description": "YYYY-MM-DD. Default: today." }
              },
              "additionalProperties": false
            }
            """;

        public static IEnumerable<AiTool> Create()
        {
            yield return new AiTool(
                "get_portfolio",
                "The user's investment positions: ticker, name, asset class, quantity, average and current price, " +
                "current value, amount invested, return, day change, plus the allocation by asset class and the portfolio " +
                "totals. Unit prices and values are integer cents; quantities and percentages are decimals. " +
                AiToolRegistry.MoneyConvention,
                """{ "type": "object", "properties": {}, "additionalProperties": false }""",
                Scope,
                IsProposal: false,
                async (context, _) =>
                    await context.Services.GetRequiredService<IInvestmentService>().GetPortfolioAsync(context.UserId));

            yield return new AiTool(
                "get_dividends",
                "Dividends and other distributions (proventos) the user received in the period, one row per payment, " +
                "with totals per ticker and overall. Optionally filtered by ticker. " + AiToolRegistry.MoneyConvention,
                """
                {
                  "type": "object",
                  "properties": {
                    "startDate": { "type": "string", "description": "YYYY-MM-DD. Default: 1 January of this year." },
                    "endDate": { "type": "string", "description": "YYYY-MM-DD. Default: today." },
                    "ticker": { "type": "string" }
                  },
                  "additionalProperties": false
                }
                """,
                Scope,
                IsProposal: false,
                GetDividendsAsync);

            yield return new AiTool(
                "get_investment_performance",
                "Portfolio performance: return all-time, last 12 months and last month (with the comparison against CDI), " +
                "and the month-by-month returns of each year in the period. Fields ending in 'Bps' are basis points " +
                "(125 = 1.25%). " + AiToolRegistry.MoneyConvention,
                PeriodSchema,
                Scope,
                IsProposal: false,
                async (context, args) =>
                {
                    var (start, end) = ReadPeriod(args);
                    var analytics = context.Services.GetRequiredService<IAnalyticsService>();

                    var totals = await analytics.GetInvestmentProfitabilityTotalsAsync(context.UserId, start, end);
                    var annual = await analytics.GetInvestmentAnnualReturnsAsync(context.UserId, start, end);

                    return new { Period = new { Start = start, End = end }, Totals = totals, AnnualReturns = annual };
                });
        }

        private static (DateOnly Start, DateOnly End) ReadPeriod(AiToolArguments args)
        {
            var today = DateOnly.FromDateTime(DateTime.UtcNow);
            var end = args.GetDate("endDate") ?? today;
            var start = args.GetDate("startDate") ?? end.AddMonths(-12);

            if (start > end)
                throw new AiToolException("'startDate' must not be after 'endDate'.");

            return (start, end);
        }

        private static async Task<object> GetDividendsAsync(AiToolContext context, AiToolArguments args)
        {
            var today = DateOnly.FromDateTime(DateTime.UtcNow);
            var end = args.GetDate("endDate") ?? today;
            var start = args.GetDate("startDate") ?? new DateOnly(end.Year, 1, 1);
            var ticker = args.GetString("ticker")?.Trim().ToUpperInvariant();

            var db = context.Services.GetRequiredService<ApplicationDbContext>();
            var query = db.InvestmentDividends
                .AsNoTracking()
                .Where(d => d.UserId == context.UserId)
                .Where(d => d.PaymentDate != null && d.PaymentDate >= start && d.PaymentDate <= end);

            if (!string.IsNullOrEmpty(ticker))
                query = query.Where(d => d.Investment.MarketAsset.Ticker == ticker);

            var payments = await query
                .OrderByDescending(d => d.PaymentDate)
                .Select(d => new { d.Investment.MarketAsset.Ticker, d.PaymentDate, d.Amount, d.Type })
                .ToListAsync(context.CancellationToken);

            var total = payments.Sum(p => p.Amount);

            return new
            {
                Period = new { Start = start, End = end },
                Total = total,
                TotalFormatted = InsightFormat.Money(total),
                ByTicker = payments
                    .GroupBy(p => p.Ticker)
                    .Select(g => new
                    {
                        Ticker = g.Key,
                        Total = g.Sum(p => p.Amount),
                        TotalFormatted = InsightFormat.Money(g.Sum(p => p.Amount)),
                        Payments = g.Count()
                    })
                    .OrderByDescending(g => g.Total),
                Payments = payments.Take(200).Select(p => new
                {
                    p.Ticker,
                    Date = p.PaymentDate,
                    p.Amount,
                    AmountFormatted = InsightFormat.Money(p.Amount),
                    p.Type
                })
            };
        }
    }
}

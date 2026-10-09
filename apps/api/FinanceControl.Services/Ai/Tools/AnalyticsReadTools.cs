using FinanceControl.Domain.Interfaces.Services;
using FinanceControl.Shared.Dtos.Request;
using Microsoft.Extensions.DependencyInjection;

namespace FinanceControl.Services.Ai.Tools
{
    /// <summary>
    /// Net worth, projections, "what if" simulations and the market data the app already
    /// caches. Projections and simulations are the app's own deterministic engines — the
    /// model reports their output, it does not forecast anything itself.
    /// </summary>
    internal static class AnalyticsReadTools
    {
        public const string AnalyticsScope = "analytics:read";
        public const string MarketScope = "market:read";

        private const int MaxMarketTickers = 10;

        public static IEnumerable<AiTool> Create()
        {
            yield return new AiTool(
                "get_net_worth_history",
                "Month-by-month net worth (accounts plus investments) for the last N months, with the per-account " +
                "breakdown. With includeReal=true also returns the inflation-adjusted (real) series and the nominal vs " +
                "real growth. " + AiToolRegistry.MoneyConvention,
                """
                {
                  "type": "object",
                  "properties": {
                    "months": { "type": "integer", "minimum": 1, "maximum": 120, "description": "Default 12." },
                    "includeReal": { "type": "boolean" }
                  },
                  "additionalProperties": false
                }
                """,
                AnalyticsScope,
                IsProposal: false,
                async (context, args) =>
                {
                    var months = Math.Clamp(args.GetInt("months") ?? 12, 1, 120);
                    var today = DateOnly.FromDateTime(DateTime.UtcNow);
                    var analytics = context.Services.GetRequiredService<IAnalyticsService>();

                    var history = await analytics.GetNetWorthEvolutionAsync(new AnalyticsRequestDto
                    {
                        StartDate = new DateOnly(today.Year, today.Month, 1).AddMonths(-(months - 1)),
                        FinishDate = today,
                        UserId = context.UserId
                    });

                    var real = args.GetBool("includeReal") == true
                        ? await analytics.GetRealNetWorthAsync(context.UserId)
                        : null;

                    return new
                    {
                        History = history.Select(h => new
                        {
                            Month = $"{h.Year:D4}-{h.Month:D2}",
                            h.NetWorth,
                            NetWorthFormatted = InsightFormat.Money(h.NetWorth),
                            h.Investments,
                            Accounts = h.Breakdown.Select(b => new { b.AccountName, b.Balance })
                        }),
                        Real = real
                    };
                });

            yield return new AiTool(
                "get_projections",
                "The app's projections, computed from the user's own history: 'balance' (account balance for the " +
                "coming weeks), 'net_worth' (net worth for the next N months, optionally until a target amount), " +
                "'passive_income' (dividends vs living cost, months until financial independence) and 'commitments' " +
                "(installments and recurring bills already committed for the next N months). Always present them as " +
                "estimates. " + AiToolRegistry.MoneyConvention,
                """
                {
                  "type": "object",
                  "properties": {
                    "kind": { "type": "string", "enum": ["balance", "net_worth", "passive_income", "commitments"] },
                    "months": { "type": "integer", "minimum": 1, "maximum": 60 },
                    "targetAmount": { "type": "integer", "description": "net_worth only: target in cents." },
                    "accountId": { "type": "integer", "description": "balance only: restrict to one account." }
                  },
                  "required": ["kind"],
                  "additionalProperties": false
                }
                """,
                AnalyticsScope,
                IsProposal: false,
                async (context, args) =>
                {
                    var analytics = context.Services.GetRequiredService<IAnalyticsService>();
                    var months = args.GetInt("months");

                    return args.RequireString("kind") switch
                    {
                        "balance" => await analytics.GetBalanceProjectionAsync(context.UserId, args.GetInt("accountId")),
                        "net_worth" => await analytics.GetNetWorthProjectionAsync(
                            context.UserId, Math.Clamp(months ?? 12, 1, 60), args.GetInt("targetAmount")),
                        "passive_income" => await analytics.GetPassiveIncomeProjectionAsync(
                            context.UserId, Math.Clamp(months ?? 24, 1, 60)),
                        "commitments" => await analytics.GetCommitmentsImpactAsync(
                            context.UserId, Math.Clamp(months ?? 6, 1, 24)),
                        _ => throw new AiToolException("'kind' must be one of: balance, net_worth, passive_income, commitments.")
                    };
                });

            yield return new AiTool(
                "run_simulation",
                "Simulates, over real historical data, what an initial amount plus a monthly contribution would have " +
                "become if invested in a benchmark between two dates. Benchmarks: CDI, SELIC, IPCA+4, IPCA+5, IPCA+6, " +
                "IBOVESPA, IFIX, SP500_BRL, or a ticker the app tracks. Nothing is saved. Past performance does not " +
                "guarantee future results — say so when presenting it. " + AiToolRegistry.MoneyConvention,
                """
                {
                  "type": "object",
                  "properties": {
                    "benchmark": { "type": "string" },
                    "startDate": { "type": "string", "description": "YYYY-MM-DD." },
                    "endDate": { "type": "string", "description": "YYYY-MM-DD. Default: today." },
                    "initialAmount": { "type": "integer", "description": "Cents. Default 0." },
                    "monthlyContribution": { "type": "integer", "description": "Cents. Default 0." }
                  },
                  "required": ["benchmark", "startDate"],
                  "additionalProperties": false
                }
                """,
                AnalyticsScope,
                IsProposal: false,
                async (context, args) =>
                {
                    var start = args.GetDate("startDate") ?? throw new AiToolException("'startDate' is required.");
                    var end = args.GetDate("endDate") ?? DateOnly.FromDateTime(DateTime.UtcNow);
                    if (start >= end)
                        throw new AiToolException("'startDate' must be before 'endDate'.");

                    var initial = Math.Max(0, args.GetLong("initialAmount") ?? 0);
                    var monthly = Math.Max(0, args.GetLong("monthlyContribution") ?? 0);
                    if (initial == 0 && monthly == 0)
                        throw new AiToolException("Give an initialAmount, a monthlyContribution or both.");

                    var simulation = await context.Services.GetRequiredService<ISimulationService>()
                        .GetHistoricalSimulationAsync(args.RequireString("benchmark").Trim().ToUpperInvariant(), start, end, monthly, initial);

                    // A 20-year run has 240 points; one per year plus the last is enough to narrate it.
                    var yearly = simulation.Points
                        .Where((point, index) => point.Month == 12 || index == simulation.Points.Count - 1)
                        .Select(p => new { p.Year, p.Month, p.Invested, p.Value, p.Interest });

                    return new
                    {
                        simulation.Benchmark,
                        simulation.StartDate,
                        simulation.EndDate,
                        simulation.TotalInvested,
                        TotalInvestedFormatted = InsightFormat.Money(simulation.TotalInvested),
                        simulation.FinalValue,
                        FinalValueFormatted = InsightFormat.Money(simulation.FinalValue),
                        simulation.TotalReturnPct,
                        simulation.AnnualizedReturnPct,
                        simulation.IsPartialData,
                        simulation.DataNote,
                        YearEndPoints = yearly
                    };
                });

            yield return new AiTool(
                "get_market_data",
                "Current market data the app tracks: price, previous close and day change for up to 10 tickers, and/or " +
                "the macro indicators (CDI, Selic, IPCA and others) with their latest value and date. Informational " +
                "only — never use it to recommend buying or selling. " + AiToolRegistry.MoneyConvention,
                """
                {
                  "type": "object",
                  "properties": {
                    "tickers": { "type": "array", "items": { "type": "string" }, "maxItems": 10 },
                    "includeIndicators": { "type": "boolean", "description": "Default true when no ticker is given." }
                  },
                  "additionalProperties": false
                }
                """,
                MarketScope,
                IsProposal: false,
                async (context, args) =>
                {
                    var market = context.Services.GetRequiredService<IMarketService>();
                    var tickers = (args.GetStringList("tickers") ?? [])
                        .Select(t => t.Trim().ToUpperInvariant())
                        .Distinct()
                        .Take(MaxMarketTickers)
                        .ToList();

                    var assets = new List<object>();
                    foreach (var ticker in tickers)
                    {
                        try
                        {
                            var detail = await market.GetDetailAsync(ticker);
                            assets.Add(new
                            {
                                detail.Ticker,
                                detail.Name,
                                detail.AssetClass,
                                detail.Currency,
                                detail.CurrentPrice,
                                CurrentPriceFormatted = InsightFormat.Money(detail.CurrentPrice),
                                detail.PreviousClose,
                                detail.DayChangePct,
                                detail.LastPriceUpdate
                            });
                        }
                        catch (Exception exception) when (exception is not OperationCanceledException)
                        {
                            assets.Add(new { Ticker = ticker, Error = "Ticker not tracked by the app." });
                        }
                    }

                    var includeIndicators = args.GetBool("includeIndicators") ?? tickers.Count == 0;
                    var indicators = includeIndicators ? await market.GetMacroIndicatorsAsync() : null;

                    return new { Assets = assets, Indicators = indicators };
                });
        }
    }
}

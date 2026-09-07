import { useQuery } from "@tanstack/react-query";
import { analyticsApi } from "@/lib/api/analytics";
import type {
  AnalyticsSummaryResponse,
  MonthlyData,
  DaySpend,
  CategoryMonthlyData,
  NetWorthPoint,
  InvestmentEvolutionResponse,
  ProfitabilityTotals,
  AnnualReturnsResponse,
  ProfitabilityVsCdiPoint,
  ProfitabilityVsBenchmarksResponse,
  InvestmentLaunchesResponse,
  NetWorthProjectionResponse,
  CategoryProjection,
  PassiveIncomeProjectionResponse,
  FinancialMilestonesResponse,
  PortfolioCompositionProjectionResponse,
  RealNetWorthResponse,
  BalanceEvolutionPoint,
  FutureCommitmentsItem,
  BalanceProjectionResponse,
  CommitmentsImpactResponse,
  SavingsPeriodsResponse,
  SavingsDetailResponse,
} from "@/lib/types/analytics.types";

// A date range that ends before today is frozen — no new transactions can land
// in a finished period — so its derived analytics can be cached aggressively.
// Ranges that still include today stay short-lived. Transaction/investment
// mutations invalidate ["analytics"], so even backdated edits refresh despite
// the long stale time.
const HISTORICAL_STALE_TIME = 1000 * 60 * 60 * 4; // 4h
const LIVE_STALE_TIME = 60_000; // 1min

const localToday = () => {
  const now = new Date();
  return new Date(now.getTime() - now.getTimezoneOffset() * 60_000).toISOString().slice(0, 10);
};

const rangeStaleTime = (finishDate: string) =>
  finishDate < localToday() ? HISTORICAL_STALE_TIME : LIVE_STALE_TIME;

export const useAnalyticsSummary = (startDate: string, finishDate: string, tagIds?: number[]) =>
  useQuery<AnalyticsSummaryResponse>({
    queryKey: ["analytics", "summary", startDate, finishDate, tagIds],
    queryFn: () => analyticsApi.getSummary(startDate, finishDate, tagIds),
    staleTime: rangeStaleTime(finishDate),
  });

export const useAnalyticsMonthly = (startDate: string, finishDate: string, tagIds?: number[]) =>
  useQuery<MonthlyData[]>({
    queryKey: ["analytics", "monthly", startDate, finishDate, tagIds],
    queryFn: () => analyticsApi.getIncomeExpense(startDate, finishDate, tagIds),
    staleTime: rangeStaleTime(finishDate),
  });

export const useAnalyticsHeatmap = (startDate: string, finishDate: string, tagIds?: number[]) =>
  useQuery<DaySpend[]>({
    queryKey: ["analytics", "heatmap", startDate, finishDate, tagIds],
    queryFn: () => analyticsApi.getSpendingHeatmap(startDate, finishDate, tagIds),
    staleTime: rangeStaleTime(finishDate),
  });

/**
 * One request per category, merged into a single timeline the chart can draw: each month
 * becomes one point carrying every category as its own key, so a `<Line dataKey="Moradia">`
 * finds a value at every month.
 *
 * `categories` must carry the name as well as the id — the endpoint answers with bare
 * `{ month, year, total }` and never says which category it was for, so the name has to
 * come from the caller to key the merged point.
 */
export const useAnalyticsCategoryEvolution = (
  startDate: string,
  finishDate: string,
  categories: { categoryId: number; categoryName: string }[],
  tagIds?: number[],
) =>
  useQuery<CategoryMonthlyData[]>({
    queryKey: [
      "analytics", "category-evolution", startDate, finishDate,
      categories.map((c) => c.categoryId), tagIds,
    ],
    queryFn: async () => {
      if (categories.length === 0) return [];
      const results = await Promise.all(
        categories.map((c) =>
          analyticsApi.getCategoryEvolution(startDate, finishDate, c.categoryId, c.categoryName, tagIds),
        ),
      );

      const merged = new Map<string, CategoryMonthlyData>();
      for (const points of results) {
        for (const point of points) {
          const existing = merged.get(point.label);
          if (existing) Object.assign(existing, point);
          else merged.set(point.label, { ...point });
        }
      }

      // A category with no spend in a month simply has no point there. Recharts would
      // break the line at the gap, so the missing keys are filled with zero.
      const series = [...merged.values()];
      for (const point of series) {
        for (const { categoryName } of categories) {
          point[categoryName] ??= 0;
        }
      }
      return series;
    },
    staleTime: rangeStaleTime(finishDate),
    enabled: categories.length > 0,
  });

export const useAnalyticsNetWorth = (startDate: string, finishDate: string) =>
  useQuery<NetWorthPoint[]>({
    queryKey: ["analytics", "net-worth", startDate, finishDate],
    queryFn: () => analyticsApi.getNetWorthEvolution(startDate, finishDate),
    staleTime: rangeStaleTime(finishDate),
  });

export const useAnalyticsInvestmentEvolution = (startDate: string, finishDate: string) =>
  useQuery<InvestmentEvolutionResponse>({
    queryKey: ["analytics", "investment-evolution", startDate, finishDate],
    queryFn: () => analyticsApi.getInvestmentEvolution(startDate, finishDate),
    staleTime: rangeStaleTime(finishDate),
  });

export const useInvestmentProfitabilityTotals = (startDate: string, finishDate: string) =>
  useQuery<ProfitabilityTotals>({
    queryKey: ["analytics", "profitability-totals", startDate, finishDate],
    queryFn: () => analyticsApi.getInvestmentProfitabilityTotals(startDate, finishDate),
    staleTime: rangeStaleTime(finishDate),
  });

export const useInvestmentAnnualReturns = (startDate: string, finishDate: string) =>
  useQuery<AnnualReturnsResponse>({
    queryKey: ["analytics", "annual-returns", startDate, finishDate],
    queryFn: () => analyticsApi.getInvestmentAnnualReturns(startDate, finishDate),
    staleTime: rangeStaleTime(finishDate),
  });

export const useInvestmentProfitabilityVsCdi = (startDate: string, finishDate: string) =>
  useQuery<ProfitabilityVsCdiPoint[]>({
    queryKey: ["analytics", "vs-cdi", startDate, finishDate],
    queryFn: () => analyticsApi.getInvestmentProfitabilityVsCdi(startDate, finishDate),
    staleTime: rangeStaleTime(finishDate),
  });

export const useInvestmentProfitabilityVsBenchmarks = (startDate: string, finishDate: string) =>
  useQuery<ProfitabilityVsBenchmarksResponse>({
    queryKey: ["analytics", "vs-benchmarks", startDate, finishDate],
    queryFn: () => analyticsApi.getInvestmentProfitabilityVsBenchmarks(startDate, finishDate),
    staleTime: rangeStaleTime(finishDate),
  });

export const useInvestmentLaunches = (startDate: string, finishDate: string) =>
  useQuery<InvestmentLaunchesResponse>({
    queryKey: ["analytics", "launches", startDate, finishDate],
    queryFn: () => analyticsApi.getInvestmentLaunches(startDate, finishDate),
    staleTime: rangeStaleTime(finishDate),
  });

export const useNetWorthProjection = (projectionMonths = 24) =>
  useQuery<NetWorthProjectionResponse>({
    queryKey: ["analytics", "nw-projection", projectionMonths],
    queryFn: () => analyticsApi.getNetWorthProjection(projectionMonths),
    staleTime: 60_000,
  });

export const useCategoryProjection = (lookbackMonths = 3) =>
  useQuery<CategoryProjection[]>({
    queryKey: ["analytics", "cat-projection", lookbackMonths],
    queryFn: () => analyticsApi.getCategoryProjection(lookbackMonths),
    staleTime: 60_000,
  });

export const usePassiveIncomeProjection = (projectionMonths = 24) =>
  useQuery<PassiveIncomeProjectionResponse>({
    queryKey: ["analytics", "passive-income", projectionMonths],
    queryFn: () => analyticsApi.getPassiveIncomeProjection(projectionMonths),
    staleTime: 60_000,
  });

export const useFinancialMilestones = () =>
  useQuery<FinancialMilestonesResponse>({
    queryKey: ["analytics", "milestones"],
    queryFn: analyticsApi.getFinancialMilestones,
    staleTime: 60_000,
  });

export const usePortfolioCompositionProjection = (projectionMonths = 12) =>
  useQuery<PortfolioCompositionProjectionResponse>({
    queryKey: ["analytics", "portfolio-composition", projectionMonths],
    queryFn: () => analyticsApi.getPortfolioCompositionProjection(projectionMonths),
    staleTime: 60_000,
  });

export const useRealNetWorth = () =>
  useQuery<RealNetWorthResponse>({
    queryKey: ["analytics", "real-nw"],
    queryFn: analyticsApi.getRealNetWorth,
    staleTime: 60_000,
  });

export const useBalanceEvolution = (startDate: string, finishDate: string) =>
  useQuery<BalanceEvolutionPoint[]>({
    queryKey: ["analytics", "balance-evolution", startDate, finishDate],
    queryFn: () => analyticsApi.getBalanceEvolution(startDate, finishDate),
    staleTime: rangeStaleTime(finishDate),
  });

export const useFutureCommitments = (months = 6) =>
  useQuery<FutureCommitmentsItem[]>({
    queryKey: ["analytics", "future-commitments", months],
    queryFn: () => analyticsApi.getFutureCommitments(months),
    staleTime: 60_000,
  });

export const useBalanceProjection = (lookbackDays = 30) =>
  useQuery<BalanceProjectionResponse>({
    queryKey: ["analytics", "balance-projection", lookbackDays],
    queryFn: () => analyticsApi.getBalanceProjection(lookbackDays),
    staleTime: 60_000,
  });

export const useCommitmentsImpact = (months = 6) =>
  useQuery<CommitmentsImpactResponse>({
    queryKey: ["analytics", "commitments-impact", months],
    queryFn: () => analyticsApi.getCommitmentsImpact(months),
    staleTime: 60_000,
  });

export const useSavingsPeriods = (budgetId: number | undefined, periods = 12) =>
  useQuery<SavingsPeriodsResponse>({
    queryKey: ["analytics", "savings-periods", budgetId, periods],
    queryFn: () => analyticsApi.getSavingsPeriods(budgetId!, periods),
    enabled: budgetId !== undefined,
    staleTime: LIVE_STALE_TIME,
  });

export const useSavingsDetail = (budgetId: number | undefined, periodStart: string | undefined) =>
  useQuery<SavingsDetailResponse>({
    queryKey: ["analytics", "savings-detail", budgetId, periodStart],
    queryFn: () => analyticsApi.getSavingsDetail(budgetId!, periodStart),
    enabled: budgetId !== undefined && periodStart !== undefined,
    staleTime: LIVE_STALE_TIME,
  });

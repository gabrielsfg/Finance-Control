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

export const useAnalyticsCategoryEvolution = (startDate: string, finishDate: string, categoryIds: number[], tagIds?: number[]) =>
  useQuery<CategoryMonthlyData[]>({
    queryKey: ["analytics", "category-evolution", startDate, finishDate, categoryIds, tagIds],
    queryFn: async () => {
      if (categoryIds.length === 0) return [];
      const results = await Promise.all(
        categoryIds.map((id) => analyticsApi.getCategoryEvolution(startDate, finishDate, id, tagIds))
      );
      // merge arrays: each call returns points per month with {label, [categoryName]: value}
      // flatten into a unified timeline keyed by label
      const merged: Record<string, CategoryMonthlyData> = {};
      for (const points of results) {
        for (const point of points) {
          if (!merged[point.label]) merged[point.label] = { label: point.label };
          Object.assign(merged[point.label], point);
        }
      }
      return Object.values(merged);
    },
    staleTime: rangeStaleTime(finishDate),
    enabled: categoryIds.length > 0,
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

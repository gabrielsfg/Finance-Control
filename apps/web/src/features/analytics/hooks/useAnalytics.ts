import { useQuery } from "@tanstack/react-query";
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
import {
  MOCK_ANALYTICS_SUMMARY,
  MOCK_ANALYTICS_MONTHLY,
  MOCK_ANALYTICS_HEATMAP,
  MOCK_CATEGORY_EVOLUTION,
  MOCK_NET_WORTH,
  MOCK_INVESTMENT_EVOLUTION,
  MOCK_PROFITABILITY_TOTALS,
  MOCK_ANNUAL_RETURNS,
  MOCK_PROFITABILITY_VS_BENCHMARKS,
  MOCK_INVESTMENT_LAUNCHES,
  MOCK_NET_WORTH_PROJECTION,
  MOCK_CATEGORY_PROJECTION,
  MOCK_PASSIVE_INCOME,
  MOCK_MILESTONES,
  MOCK_PORTFOLIO_COMPOSITION,
  MOCK_REAL_NET_WORTH,
  MOCK_BALANCE_EVOLUTION,
  MOCK_FUTURE_COMMITMENTS,
  MOCK_BALANCE_PROJECTION,
  MOCK_COMMITMENTS_IMPACT,
} from "@/lib/mocks";

const INF = Infinity;

export const useAnalyticsSummary = (_s: string, _f: string) =>
  useQuery<AnalyticsSummaryResponse>({
    queryKey: ["analytics", "summary", "mock"],
    queryFn: () => Promise.resolve(MOCK_ANALYTICS_SUMMARY),
    staleTime: INF,
  });

export const useAnalyticsMonthly = (_s: string, _f: string) =>
  useQuery<MonthlyData[]>({
    queryKey: ["analytics", "monthly", "mock"],
    queryFn: () => Promise.resolve(MOCK_ANALYTICS_MONTHLY),
    staleTime: INF,
  });

export const useAnalyticsHeatmap = (_s: string, _f: string) =>
  useQuery<DaySpend[]>({
    queryKey: ["analytics", "heatmap", "mock"],
    queryFn: () => Promise.resolve(MOCK_ANALYTICS_HEATMAP),
    staleTime: INF,
  });

export const useAnalyticsCategoryEvolution = (_s: string, _f: string, _ids: number[]) => ({
  data: MOCK_CATEGORY_EVOLUTION,
  isLoading: false,
  isError: false,
});

export const useAnalyticsNetWorth = (_s: string, _f: string) =>
  useQuery<NetWorthPoint[]>({
    queryKey: ["analytics", "net-worth", "mock"],
    queryFn: () => Promise.resolve(MOCK_NET_WORTH),
    staleTime: INF,
  });

export const useAnalyticsInvestmentEvolution = (_s: string, _f: string) =>
  useQuery<InvestmentEvolutionResponse>({
    queryKey: ["analytics", "investment-evolution", "mock"],
    queryFn: () => Promise.resolve(MOCK_INVESTMENT_EVOLUTION),
    staleTime: INF,
  });

export const useInvestmentProfitabilityTotals = (_s: string, _f: string) =>
  useQuery<ProfitabilityTotals>({
    queryKey: ["analytics", "profitability-totals", "mock"],
    queryFn: () => Promise.resolve(MOCK_PROFITABILITY_TOTALS),
    staleTime: INF,
  });

export const useInvestmentAnnualReturns = (_s: string, _f: string) =>
  useQuery<AnnualReturnsResponse>({
    queryKey: ["analytics", "annual-returns", "mock"],
    queryFn: () => Promise.resolve(MOCK_ANNUAL_RETURNS),
    staleTime: INF,
  });

export const useInvestmentProfitabilityVsCdi = (_s: string, _f: string) =>
  useQuery<ProfitabilityVsCdiPoint[]>({
    queryKey: ["analytics", "vs-cdi", "mock"],
    queryFn: () => Promise.resolve(MOCK_PROFITABILITY_VS_BENCHMARKS.points),
    staleTime: INF,
  });

export const useInvestmentProfitabilityVsBenchmarks = (_s: string, _f: string) =>
  useQuery<ProfitabilityVsBenchmarksResponse>({
    queryKey: ["analytics", "vs-benchmarks", "mock"],
    queryFn: () => Promise.resolve(MOCK_PROFITABILITY_VS_BENCHMARKS),
    staleTime: INF,
  });

export const useInvestmentLaunches = (_s: string, _f: string) =>
  useQuery<InvestmentLaunchesResponse>({
    queryKey: ["analytics", "launches", "mock"],
    queryFn: () => Promise.resolve(MOCK_INVESTMENT_LAUNCHES),
    staleTime: INF,
  });

export const useNetWorthProjection = (_months = 24) =>
  useQuery<NetWorthProjectionResponse>({
    queryKey: ["analytics", "nw-projection", "mock"],
    queryFn: () => Promise.resolve(MOCK_NET_WORTH_PROJECTION),
    staleTime: INF,
  });

export const useCategoryProjection = (_months = 3) =>
  useQuery<CategoryProjection[]>({
    queryKey: ["analytics", "cat-projection", "mock"],
    queryFn: () => Promise.resolve(MOCK_CATEGORY_PROJECTION),
    staleTime: INF,
  });

export const usePassiveIncomeProjection = (_months = 24) =>
  useQuery<PassiveIncomeProjectionResponse>({
    queryKey: ["analytics", "passive-income", "mock"],
    queryFn: () => Promise.resolve(MOCK_PASSIVE_INCOME),
    staleTime: INF,
  });

export const useFinancialMilestones = () =>
  useQuery<FinancialMilestonesResponse>({
    queryKey: ["analytics", "milestones", "mock"],
    queryFn: () => Promise.resolve(MOCK_MILESTONES),
    staleTime: INF,
  });

export const usePortfolioCompositionProjection = (_months = 12) =>
  useQuery<PortfolioCompositionProjectionResponse>({
    queryKey: ["analytics", "portfolio-composition", "mock"],
    queryFn: () => Promise.resolve(MOCK_PORTFOLIO_COMPOSITION),
    staleTime: INF,
  });

export const useRealNetWorth = () =>
  useQuery<RealNetWorthResponse>({
    queryKey: ["analytics", "real-nw", "mock"],
    queryFn: () => Promise.resolve(MOCK_REAL_NET_WORTH),
    staleTime: INF,
  });

export const useBalanceEvolution = (_s: string, _f: string) =>
  useQuery<BalanceEvolutionPoint[]>({
    queryKey: ["analytics", "balance-evolution", "mock"],
    queryFn: () => Promise.resolve(MOCK_BALANCE_EVOLUTION),
    staleTime: INF,
  });

export const useFutureCommitments = (_months = 6) =>
  useQuery<FutureCommitmentsItem[]>({
    queryKey: ["analytics", "future-commitments", "mock"],
    queryFn: () => Promise.resolve(MOCK_FUTURE_COMMITMENTS),
    staleTime: INF,
  });

export const useBalanceProjection = (_days = 30) =>
  useQuery<BalanceProjectionResponse>({
    queryKey: ["analytics", "balance-projection", "mock"],
    queryFn: () => Promise.resolve(MOCK_BALANCE_PROJECTION),
    staleTime: INF,
  });

export const useCommitmentsImpact = (_months = 6) =>
  useQuery<CommitmentsImpactResponse>({
    queryKey: ["analytics", "commitments-impact", "mock"],
    queryFn: () => Promise.resolve(MOCK_COMMITMENTS_IMPACT),
    staleTime: INF,
  });

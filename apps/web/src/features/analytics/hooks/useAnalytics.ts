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
  InvestmentLaunchesResponse,
  NetWorthProjectionResponse,
  CategoryProjection,
  PassiveIncomeProjectionResponse,
  FinancialMilestonesResponse,
  PortfolioCompositionProjectionResponse,
  RealNetWorthResponse,
} from "@/lib/types/analytics.types";

export const useAnalyticsSummary = (startDate: string, finishDate: string) =>
  useQuery<AnalyticsSummaryResponse>({
    queryKey: ["analytics", "summary", startDate, finishDate],
    queryFn: () => analyticsApi.getSummary(startDate, finishDate),
    staleTime: 5 * 60 * 1000,
  });

export const useAnalyticsMonthly = (startDate: string, finishDate: string) =>
  useQuery<MonthlyData[]>({
    queryKey: ["analytics", "monthly", startDate, finishDate],
    queryFn: () => analyticsApi.getIncomeExpense(startDate, finishDate),
    staleTime: 5 * 60 * 1000,
  });

export const useAnalyticsHeatmap = (startDate: string, finishDate: string) =>
  useQuery<DaySpend[]>({
    queryKey: ["analytics", "heatmap", startDate, finishDate],
    queryFn: () => analyticsApi.getSpendingHeatmap(startDate, finishDate),
    staleTime: 5 * 60 * 1000,
  });

export const useAnalyticsCategoryEvolution = (startDate: string, finishDate: string, categoryIds: number[]) =>
  useQuery<CategoryMonthlyData[]>({
    queryKey: ["analytics", "category-evolution", startDate, finishDate, categoryIds],
    queryFn: () => {
      const [firstId] = categoryIds;
      return analyticsApi.getCategoryEvolution(startDate, finishDate, firstId ?? 0);
    },
    enabled: categoryIds.length > 0,
    staleTime: 5 * 60 * 1000,
  });

export const useAnalyticsNetWorth = (startDate: string, finishDate: string) =>
  useQuery<NetWorthPoint[]>({
    queryKey: ["analytics", "net-worth", startDate, finishDate],
    queryFn: () => analyticsApi.getNetWorthEvolution(startDate, finishDate),
    staleTime: 5 * 60 * 1000,
  });

export const useAnalyticsInvestmentEvolution = (startDate: string, finishDate: string) =>
  useQuery<InvestmentEvolutionResponse>({
    queryKey: ["analytics", "investment-evolution", startDate, finishDate],
    queryFn: () => analyticsApi.getInvestmentEvolution(startDate, finishDate),
    staleTime: 5 * 60 * 1000,
  });

export const useInvestmentProfitabilityTotals = (startDate: string, finishDate: string) =>
  useQuery<ProfitabilityTotals>({
    queryKey: ["analytics", "investment-profitability-totals", startDate, finishDate],
    queryFn: () => analyticsApi.getInvestmentProfitabilityTotals(startDate, finishDate),
    staleTime: 5 * 60 * 1000,
  });

export const useInvestmentAnnualReturns = (startDate: string, finishDate: string) =>
  useQuery<AnnualReturnsResponse>({
    queryKey: ["analytics", "investment-annual-returns", startDate, finishDate],
    queryFn: () => analyticsApi.getInvestmentAnnualReturns(startDate, finishDate),
    staleTime: 5 * 60 * 1000,
  });

export const useInvestmentProfitabilityVsCdi = (startDate: string, finishDate: string) =>
  useQuery<ProfitabilityVsCdiPoint[]>({
    queryKey: ["analytics", "investment-vs-cdi", startDate, finishDate],
    queryFn: () => analyticsApi.getInvestmentProfitabilityVsCdi(startDate, finishDate),
    staleTime: 5 * 60 * 1000,
  });

export const useInvestmentLaunches = (startDate: string, finishDate: string) =>
  useQuery<InvestmentLaunchesResponse>({
    queryKey: ["analytics", "investment-launches", startDate, finishDate],
    queryFn: () => analyticsApi.getInvestmentLaunches(startDate, finishDate),
    staleTime: 5 * 60 * 1000,
  });

export const useNetWorthProjection = (projectionMonths = 24) =>
  useQuery<NetWorthProjectionResponse>({
    queryKey: ["analytics", "net-worth-projection", projectionMonths],
    queryFn: () => analyticsApi.getNetWorthProjection(projectionMonths),
    staleTime: 5 * 60 * 1000,
  });

export const useCategoryProjection = (lookbackMonths = 3) =>
  useQuery<CategoryProjection[]>({
    queryKey: ["analytics", "category-projection", lookbackMonths],
    queryFn: () => analyticsApi.getCategoryProjection(lookbackMonths),
    staleTime: 5 * 60 * 1000,
  });

export const usePassiveIncomeProjection = (projectionMonths = 24) =>
  useQuery<PassiveIncomeProjectionResponse>({
    queryKey: ["analytics", "passive-income-projection", projectionMonths],
    queryFn: () => analyticsApi.getPassiveIncomeProjection(projectionMonths),
    staleTime: 5 * 60 * 1000,
  });

export const useFinancialMilestones = () =>
  useQuery<FinancialMilestonesResponse>({
    queryKey: ["analytics", "milestones"],
    queryFn: () => analyticsApi.getFinancialMilestones(),
    staleTime: 5 * 60 * 1000,
  });

export const usePortfolioCompositionProjection = (projectionMonths = 12) =>
  useQuery<PortfolioCompositionProjectionResponse>({
    queryKey: ["analytics", "portfolio-composition-projection", projectionMonths],
    queryFn: () => analyticsApi.getPortfolioCompositionProjection(projectionMonths),
    staleTime: 5 * 60 * 1000,
  });

export const useRealNetWorth = () =>
  useQuery<RealNetWorthResponse>({
    queryKey: ["analytics", "real-net-worth"],
    queryFn: () => analyticsApi.getRealNetWorth(),
    staleTime: 5 * 60 * 1000,
  });

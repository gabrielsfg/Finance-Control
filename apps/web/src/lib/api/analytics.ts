import { api } from "./axios";
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

export const analyticsApi = {
  getSummary: async (startDate: string, finishDate: string, tagIds?: number[]): Promise<AnalyticsSummaryResponse> => {
    const response = await api.get<AnalyticsSummaryResponse>("/analytics/summary", {
      params: { startDate, finishDate, ...(tagIds?.length ? { tagIds } : {}) },
    });
    return response.data;
  },

  getIncomeExpense: async (startDate: string, finishDate: string, tagIds?: number[]): Promise<MonthlyData[]> => {
    const response = await api.get<MonthlyData[]>("/analytics/income-expense", {
      params: { startDate, finishDate, ...(tagIds?.length ? { tagIds } : {}) },
    });
    return response.data;
  },

  getSpendingHeatmap: async (startDate: string, finishDate: string, tagIds?: number[]): Promise<DaySpend[]> => {
    const response = await api.get<DaySpend[]>("/analytics/spending-heatmap", {
      params: { startDate, finishDate, ...(tagIds?.length ? { tagIds } : {}) },
    });
    return response.data;
  },

  getCategoryEvolution: async (
    startDate: string,
    finishDate: string,
    categoryId: number,
    tagIds?: number[],
  ): Promise<CategoryMonthlyData[]> => {
    const response = await api.get<CategoryMonthlyData[]>("/analytics/category-evolution", {
      params: { startDate, finishDate, categoryId, ...(tagIds?.length ? { tagIds } : {}) },
    });
    return response.data;
  },

  getNetWorthEvolution: async (startDate: string, finishDate: string): Promise<NetWorthPoint[]> => {
    const response = await api.get<NetWorthPoint[]>("/analytics/net-worth-evolution", {
      params: { startDate, finishDate },
    });
    return response.data;
  },

  getNetWorthProjection: async (projectionMonths = 24): Promise<NetWorthProjectionResponse> => {
    const response = await api.get<NetWorthProjectionResponse>("/analytics/projection/net-worth", {
      params: { projectionMonths },
    });
    return response.data;
  },

  getCategoryProjection: async (lookbackMonths = 3): Promise<CategoryProjection[]> => {
    const response = await api.get<CategoryProjection[]>("/analytics/projection/categories", {
      params: { lookbackMonths },
    });
    return response.data;
  },

  getPassiveIncomeProjection: async (projectionMonths = 24): Promise<PassiveIncomeProjectionResponse> => {
    const response = await api.get<PassiveIncomeProjectionResponse>("/analytics/projection/passive-income", {
      params: { projectionMonths },
    });
    return response.data;
  },

  getFinancialMilestones: async (): Promise<FinancialMilestonesResponse> => {
    const response = await api.get<FinancialMilestonesResponse>("/analytics/milestones");
    return response.data;
  },

  getPortfolioCompositionProjection: async (projectionMonths: number): Promise<PortfolioCompositionProjectionResponse> => {
    const response = await api.get<PortfolioCompositionProjectionResponse>("/analytics/projection/portfolio-composition", {
      params: { projectionMonths },
    });
    return response.data;
  },

  getRealNetWorth: async (): Promise<RealNetWorthResponse> => {
    const response = await api.get<RealNetWorthResponse>("/analytics/real-net-worth");
    return response.data;
  },

  getInvestmentEvolution: async (startDate: string, finishDate: string): Promise<InvestmentEvolutionResponse> => {
    const response = await api.get<InvestmentEvolutionResponse>("/analytics/investment/evolution", {
      params: { startDate, finishDate },
    });
    return response.data;
  },

  getInvestmentProfitabilityTotals: async (startDate: string, finishDate: string): Promise<ProfitabilityTotals> => {
    const response = await api.get<ProfitabilityTotals>("/analytics/investment/profitability-totals", {
      params: { startDate, finishDate },
    });
    return response.data;
  },

  getInvestmentAnnualReturns: async (startDate: string, finishDate: string): Promise<AnnualReturnsResponse> => {
    const response = await api.get<AnnualReturnsResponse>("/analytics/investment/annual-returns", {
      params: { startDate, finishDate },
    });
    return response.data;
  },

  getInvestmentProfitabilityVsCdi: async (startDate: string, finishDate: string): Promise<ProfitabilityVsCdiPoint[]> => {
    const response = await api.get<ProfitabilityVsCdiPoint[]>("/analytics/investment/profitability-vs-cdi", {
      params: { startDate, finishDate },
    });
    return response.data;
  },

  getInvestmentProfitabilityVsBenchmarks: async (startDate: string, finishDate: string): Promise<ProfitabilityVsBenchmarksResponse> => {
    const response = await api.get<ProfitabilityVsBenchmarksResponse>("/analytics/investment/profitability-vs-benchmarks", {
      params: { startDate, finishDate },
    });
    return response.data;
  },

  getInvestmentLaunches: async (startDate: string, finishDate: string): Promise<InvestmentLaunchesResponse> => {
    const response = await api.get<InvestmentLaunchesResponse>("/analytics/investment/launches", {
      params: { startDate, finishDate },
    });
    return response.data;
  },

  getBalanceEvolution: async (startDate: string, finishDate: string): Promise<BalanceEvolutionPoint[]> => {
    const response = await api.get<BalanceEvolutionPoint[]>("/analytics/balance-evolution", {
      params: { startDate, finishDate },
    });
    return response.data;
  },

  getFutureCommitments: async (months = 6): Promise<FutureCommitmentsItem[]> => {
    const response = await api.get<FutureCommitmentsItem[]>("/analytics/future-commitments", {
      params: { months },
    });
    return response.data;
  },

  getBalanceProjection: async (lookbackDays = 30): Promise<BalanceProjectionResponse> => {
    const response = await api.get<BalanceProjectionResponse>("/analytics/projection/balance", {
      params: { lookbackDays },
    });
    return response.data;
  },

  getCommitmentsImpact: async (months = 6): Promise<CommitmentsImpactResponse> => {
    const response = await api.get<CommitmentsImpactResponse>("/analytics/projection/commitments-impact", {
      params: { months },
    });
    return response.data;
  },

  getSavingsPeriods: async (budgetId: number, periods = 12): Promise<SavingsPeriodsResponse> => {
    const response = await api.get<SavingsPeriodsResponse>("/analytics/savings/periods", {
      params: { budgetId, periods },
    });
    return response.data;
  },

  getSavingsDetail: async (budgetId: number, periodStart?: string): Promise<SavingsDetailResponse> => {
    const response = await api.get<SavingsDetailResponse>("/analytics/savings/detail", {
      params: { budgetId, ...(periodStart ? { periodStart } : {}) },
    });
    return response.data;
  },
};

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

/**
 * `/analytics/income-expense` and `/analytics/category-evolution` return a raw
 * `{ month, year, ... }` point — no display label, and no derived balance.
 *
 * Both charts read `label` as their category axis. When it is missing, every point
 * collapses onto the same undefined band and Recharts positions the marks at NaN: the
 * axes still render from the numeric domain, so the card looks alive while the series
 * is invisible. Building the label here keeps that failure impossible — the exported
 * types describe what callers actually receive.
 */
const MONTH_LABELS = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"];

/** "Set/25" — short enough for a dense axis, unambiguous across a year boundary. */
export function monthPointLabel(month: number, year: number): string {
  return `${MONTH_LABELS[month - 1] ?? month}/${String(year).slice(-2)}`;
}

type RawMonthlyPoint = { month: number; year: number; totalIncome: number; totalExpense: number };
type RawCategoryPoint = { month: number; year: number; total: number };

/** Per-account balance at a point in time; negative for a liability (e.g. a card). */
type RawNetWorthPoint = {
  month: number;
  year: number;
  netWorth: number;
  breakdown: { accountId: number; accountName: string; balance: number }[];
};

export const analyticsApi = {
  getSummary: async (startDate: string, finishDate: string, tagIds?: number[]): Promise<AnalyticsSummaryResponse> => {
    const response = await api.get<AnalyticsSummaryResponse>("/analytics/summary", {
      params: { startDate, finishDate, ...(tagIds?.length ? { tagIds } : {}) },
    });
    return response.data;
  },

  getIncomeExpense: async (startDate: string, finishDate: string, tagIds?: number[]): Promise<MonthlyData[]> => {
    const response = await api.get<RawMonthlyPoint[]>("/analytics/income-expense", {
      params: { startDate, finishDate, ...(tagIds?.length ? { tagIds } : {}) },
    });
    return response.data.map((point) => ({
      ...point,
      label: monthPointLabel(point.month, point.year),
      balance: point.totalIncome - point.totalExpense,
    }));
  },

  getSpendingHeatmap: async (startDate: string, finishDate: string, tagIds?: number[]): Promise<DaySpend[]> => {
    const response = await api.get<DaySpend[]>("/analytics/spending-heatmap", {
      params: { startDate, finishDate, ...(tagIds?.length ? { tagIds } : {}) },
    });
    return response.data;
  },

  /**
   * One category's monthly totals. The endpoint does not echo which category it answered
   * for, so the caller names the series — that name becomes the point's key, which is
   * what the chart's `dataKey` reads.
   */
  getCategoryEvolution: async (
    startDate: string,
    finishDate: string,
    categoryId: number,
    categoryName: string,
    tagIds?: number[],
  ): Promise<CategoryMonthlyData[]> => {
    const response = await api.get<RawCategoryPoint[]>("/analytics/category-evolution", {
      params: { startDate, finishDate, categoryId, ...(tagIds?.length ? { tagIds } : {}) },
    });
    return response.data.map((point) => ({
      label: monthPointLabel(point.month, point.year),
      [categoryName]: point.total,
    }));
  },

  /**
   * The endpoint reports `netWorth` plus a per-account breakdown; the split into assets
   * and liabilities is the sign of each account's balance. Deriving it here is what makes
   * the returned `NetWorthPoint` true — the chart's "Ativos"/"Passivos" series and the
   * summary tiles read those two fields, and were silently getting `undefined` (the tiles'
   * `?? 0` printed R$ 0,00, and the missing `label` left the whole chart blank).
   */
  getNetWorthEvolution: async (startDate: string, finishDate: string): Promise<NetWorthPoint[]> => {
    const response = await api.get<RawNetWorthPoint[]>("/analytics/net-worth-evolution", {
      params: { startDate, finishDate },
    });
    return response.data.map((point) => {
      let assets = 0;
      let liabilities = 0;
      for (const account of point.breakdown ?? []) {
        if (account.balance >= 0) assets += account.balance;
        else liabilities -= account.balance;
      }
      return {
        label: monthPointLabel(point.month, point.year),
        netWorth: point.netWorth,
        assets,
        liabilities,
      };
    });
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

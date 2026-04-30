import { api } from "./axios";
import type {
  AnalyticsSummaryResponse,
  MonthlyData,
  DaySpend,
  CategoryMonthlyData,
  NetWorthPoint,
} from "@/lib/types/analytics.types";

export const analyticsApi = {
  getSummary: async (lookbackMonths = 7): Promise<AnalyticsSummaryResponse> => {
    const response = await api.get<AnalyticsSummaryResponse>("/analytics/summary", {
      params: { lookbackMonths },
    });
    return response.data;
  },

  getIncomeExpense: async (startDate: string, finishDate: string): Promise<MonthlyData[]> => {
    const response = await api.get<MonthlyData[]>("/analytics/income-expense", {
      params: { startDate, finishDate },
    });
    return response.data;
  },

  getSpendingHeatmap: async (startDate: string, finishDate: string): Promise<DaySpend[]> => {
    const response = await api.get<DaySpend[]>("/analytics/spending-heatmap", {
      params: { startDate, finishDate },
    });
    return response.data;
  },

  getCategoryEvolution: async (
    startDate: string,
    finishDate: string,
    categoryId: number,
  ): Promise<CategoryMonthlyData[]> => {
    const response = await api.get<CategoryMonthlyData[]>("/analytics/category-evolution", {
      params: { startDate, finishDate, categoryId },
    });
    return response.data;
  },

  getNetWorthEvolution: async (startDate: string, finishDate: string): Promise<NetWorthPoint[]> => {
    const response = await api.get<NetWorthPoint[]>("/analytics/net-worth-evolution", {
      params: { startDate, finishDate },
    });
    return response.data;
  },
};

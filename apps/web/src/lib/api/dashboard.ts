import { api } from "./axios";
import type { DashboardSummary } from "@/lib/types/dashboard.types";

type DashboardParams = {
  startDate: string;
  finishDate: string;
  budgetId?: number;
};

export const dashboardApi = {
  getSummary: async (params: DashboardParams): Promise<DashboardSummary> => {
    const response = await api.get<DashboardSummary>("/mainpage/summary", { params });
    return response.data;
  },
};

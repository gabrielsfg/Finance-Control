import { useQuery } from "@tanstack/react-query";
import { dashboardApi } from "@/lib/api/dashboard";

type DashboardParams = {
  startDate: string;
  finishDate: string;
  budgetId?: number;
};

export const useDashboard = (params: DashboardParams) =>
  useQuery({
    queryKey: ["dashboard", params],
    queryFn: () => dashboardApi.getSummary(params),
    staleTime: 60_000,
  });

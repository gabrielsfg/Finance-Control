import { useQuery } from "@tanstack/react-query";
import { dashboardApi } from "@/lib/api/dashboard";
import { format, startOfMonth, endOfMonth } from "date-fns";

export const useDashboard = () => {
  const now = new Date();
  const startDate = format(startOfMonth(now), "yyyy-MM-dd");
  const finishDate = format(endOfMonth(now), "yyyy-MM-dd");

  return useQuery({
    queryKey: ["dashboard", startDate, finishDate],
    queryFn: () => dashboardApi.getSummary({ startDate, finishDate }),
    staleTime: 60_000,
  });
};

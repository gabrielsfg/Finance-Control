import { useQuery } from "@tanstack/react-query";
import { MOCK_DASHBOARD } from "@/lib/mocks";

export const useDashboard = () =>
  useQuery({
    queryKey: ["dashboard", "mock"],
    queryFn: () => Promise.resolve(MOCK_DASHBOARD),
    staleTime: Infinity,
  });

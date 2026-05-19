import { useQuery, useMutation } from "@tanstack/react-query";
import { simulationApi } from "@/lib/api/simulation";

export const useBenchmarkRates = () =>
  useQuery({
    queryKey: ["simulation", "benchmark-rates"],
    queryFn: simulationApi.getBenchmarkRates,
    staleTime: 6 * 60 * 60 * 1000, // 6h — rates don't change often
    retry: 1,
  });

export const useHistoricalSimulation = () =>
  useMutation({
    mutationFn: simulationApi.getHistoricalSimulation,
  });

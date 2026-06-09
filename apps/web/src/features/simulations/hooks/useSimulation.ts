import { useQuery, useMutation } from "@tanstack/react-query";
import { simulationApi } from "@/lib/api/simulation";

export const useAvailableBenchmarks = () =>
  useQuery({
    queryKey: ["simulation", "available-benchmarks"],
    queryFn: simulationApi.getAvailableBenchmarks,
    staleTime: 6 * 60 * 60 * 1000, // 6h — same as backend cache
    retry: 1,
  });

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

export const usePortfolioBacktest = () =>
  useMutation({
    mutationFn: simulationApi.portfolioBacktest,
  });

// Fetches real CAGR data from Brapi for all preset assets that have a ticker.
// Results are cached for 12h (matches backend cache). Falls back gracefully when
// the Pro token is not configured — isReal=false items keep the stub rate.
export const useAssetRates = (tickers: string[]) =>
  useQuery({
    queryKey: ["simulation", "asset-rates", tickers.slice().sort().join(",")],
    queryFn: () => simulationApi.getAssetRates(tickers),
    staleTime: 12 * 60 * 60 * 1000, // 12h
    retry: 1,
    enabled: tickers.length > 0,
  });

export const useAssetRateForPeriod = (ticker: string | null, period: string | null) =>
  useQuery({
    queryKey: ["simulation", "asset-rate", ticker, period],
    queryFn: () => simulationApi.getAssetRateForPeriod(ticker!, period!),
    staleTime: 12 * 60 * 60 * 1000, // 12h
    retry: 1,
    enabled: !!ticker && !!period,
  });

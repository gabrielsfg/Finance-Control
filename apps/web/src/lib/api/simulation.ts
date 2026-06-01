import { api } from "./axios";
import type { BenchmarkRates, HistoricalSimulation } from "@/lib/types/simulation";

export interface AssetRate {
  ticker: string;
  annualReturnPct: number;
  yearsOfData: number;
  isReal: boolean;
  rateSource: string;
}

export const simulationApi = {
  getBenchmarkRates: async (): Promise<BenchmarkRates> => {
    const { data } = await api.get<BenchmarkRates>("/simulation/benchmark-rates");
    return data;
  },

  getHistoricalSimulation: async (params: {
    benchmark: string;
    startDate: string;
    endDate: string;
    monthlyContribution: number;
    initialAmount: number;
  }): Promise<HistoricalSimulation> => {
    const { data } = await api.get<HistoricalSimulation>("/simulation/historical", { params });
    return data;
  },

  getAssetRates: async (tickers: string[]): Promise<AssetRate[]> => {
    const { data } = await api.get<AssetRate[]>("/simulation/asset-rates", {
      params: { tickers: tickers.join(",") },
    });
    return data;
  },
};

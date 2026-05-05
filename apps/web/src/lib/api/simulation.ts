import { api } from "./axios";
import type { BenchmarkRates, HistoricalSimulation } from "@/lib/types/simulation";

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
};

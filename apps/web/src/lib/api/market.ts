import { api } from "./axios";
import type { MarketAsset, MarketAssetDetail, Fundamentals } from "@/lib/types/market.types";

export const marketApi = {
  list: async (params: { type?: string; sort?: string; limit?: number }): Promise<MarketAsset[]> => {
    const response = await api.get<MarketAsset[]>("/market", { params });
    return response.data;
  },

  search: async (q: string): Promise<MarketAsset[]> => {
    const response = await api.get<MarketAsset[]>("/market/search", { params: { q } });
    return response.data;
  },

  getDetail: async (ticker: string): Promise<MarketAssetDetail> => {
    const response = await api.get<MarketAssetDetail>(`/market/${ticker}`);
    return response.data;
  },

  getFundamentals: async (ticker: string): Promise<Fundamentals> => {
    const response = await api.get<Fundamentals>(`/market/${ticker}/fundamentals`);
    return response.data;
  },
};

import { api } from "./axios";
import type { MarketAsset, MarketAssetDetail } from "@/lib/types/market.types";

export const marketApi = {
  search: async (q: string): Promise<MarketAsset[]> => {
    const response = await api.get<MarketAsset[]>("/market/search", { params: { q } });
    return response.data;
  },

  getDetail: async (ticker: string): Promise<MarketAssetDetail> => {
    const response = await api.get<MarketAssetDetail>(`/market/${ticker}`);
    return response.data;
  },
};

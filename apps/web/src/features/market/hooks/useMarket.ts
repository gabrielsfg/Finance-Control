import { useQuery } from "@tanstack/react-query";
import { marketApi } from "@/lib/api/market";
import type { MarketAsset, MarketAssetDetail } from "@/lib/types/market.types";

export const useMarketSearch = (q: string) =>
  useQuery<MarketAsset[]>({
    queryKey: ["market", "search", q],
    queryFn: () => marketApi.search(q),
    enabled: q.trim().length >= 1,
    staleTime: 60_000,
  });

export const useMarketAssetDetail = (ticker: string) =>
  useQuery<MarketAssetDetail>({
    queryKey: ["market", "detail", ticker],
    queryFn: () => marketApi.getDetail(ticker),
    enabled: ticker.length > 0,
    staleTime: 60_000,
  });

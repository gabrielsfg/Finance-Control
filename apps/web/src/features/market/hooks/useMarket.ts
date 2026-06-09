import { useQuery } from "@tanstack/react-query";
import { marketApi } from "@/lib/api/market";
import type { MarketAsset, MarketAssetDetail, Fundamentals, FiiIndicators, MacroIndicator } from "@/lib/types/market.types";

export const useMarketList = (params: { type?: string; sort?: string; limit?: number }) =>
  useQuery<MarketAsset[]>({
    queryKey: ["market", "list", params.type ?? "all", params.sort ?? "change_desc", params.limit ?? 20],
    queryFn: () => marketApi.list(params),
    staleTime: 5 * 60_000,
  });

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

export const useFundamentals = (ticker: string | null) =>
  useQuery<Fundamentals>({
    queryKey: ["market", "fundamentals", ticker],
    queryFn: () => marketApi.getFundamentals(ticker!),
    enabled: !!ticker,
    staleTime: 6 * 60 * 60 * 1000, // 6h — matches backend cache
    retry: 1,
  });

export const useFiiIndicators = (ticker: string | null) =>
  useQuery<FiiIndicators>({
    queryKey: ["market", "fii", ticker],
    queryFn: () => marketApi.getFiiIndicators(ticker!),
    enabled: !!ticker,
    staleTime: 6 * 60 * 60 * 1000, // 6h — matches backend cache
    retry: 1,
  });

export const useMacroIndicators = () =>
  useQuery<MacroIndicator[]>({
    queryKey: ["market", "macro"],
    queryFn: marketApi.getMacro,
    staleTime: 6 * 60 * 60 * 1000, // 6h — matches backend cache
    retry: 1,
  });

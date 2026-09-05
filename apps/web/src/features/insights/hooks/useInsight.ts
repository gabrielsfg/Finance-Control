import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { insightApi } from "@/lib/api/insight";
import type { Insight } from "@/lib/types/insight.types";

/**
 * The weekly spending analysis. Generated on the first read of the week and cached
 * server-side for the rest of it, so refetching costs nothing.
 */
export const useSpendingInsight = (enabled = true) =>
  useQuery<Insight | null>({
    queryKey: ["insight", "spending"],
    queryFn: insightApi.getSpending,
    // Cached for the whole week on the server; asking again in the same session
    // would only spend a round trip.
    staleTime: 1000 * 60 * 30,
    retry: false,
    // Off for a free account: the endpoint answers 204 by plan, so the call can only
    // ever come back empty.
    enabled,
  });

export const usePortfolioInsight = (enabled = true) =>
  useQuery<Insight | null>({
    queryKey: ["insight", "portfolio"],
    queryFn: insightApi.getPortfolio,
    staleTime: 1000 * 60 * 30,
    retry: false,
    enabled,
  });

/** Regenerates inside the same week. Still counted against the monthly quota. */
export const useRefreshSpendingInsight = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: insightApi.refreshSpending,
    onSuccess: (data) => queryClient.setQueryData(["insight", "spending"], data),
  });
};

export const useAiContext = (enabled = true) =>
  useQuery({
    queryKey: ["insight", "context"],
    queryFn: insightApi.getContext,
    staleTime: 1000 * 60 * 5,
    retry: false,
    enabled,
  });

export const useUpsertAiContext = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (text: string) => insightApi.upsertContext(text),
    onSuccess: (data) => {
      queryClient.setQueryData(["insight", "context"], data);
      // The context feeds the next generation, so the current card is now stale.
      queryClient.invalidateQueries({ queryKey: ["insight", "spending"] });
    },
  });
};

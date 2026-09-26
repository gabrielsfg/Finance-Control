import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { insightApi } from "@/lib/api/insight";
import type { AiSettings, InsightResult, UpdateAiSettingsRequest } from "@/lib/types/insight.types";

/**
 * The weekly spending analysis. Generated on the first read of the week and cached
 * server-side for the rest of it, so refetching costs nothing.
 */
export const useSpendingInsight = (enabled = true) =>
  useQuery<InsightResult>({
    queryKey: ["insight", "spending"],
    queryFn: insightApi.getSpending,
    // Cached for the whole week on the server; asking again in the same session
    // would only spend a round trip.
    staleTime: 1000 * 60 * 30,
    retry: false,
    // Off for a free account: the endpoint would answer NotPremium by plan, which the
    // card already knows without the round trip.
    enabled,
  });

export const usePortfolioInsight = (enabled = true) =>
  useQuery<InsightResult>({
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
    onSuccess: (data) =>
      // A refused refresh (quota spent, say) comes back without an insight. The one
      // already on screen is still this week's, so it stays and only the status changes.
      queryClient.setQueryData<InsightResult>(["insight", "spending"], (previous) =>
        data.insight || !previous?.insight ? data : { ...data, insight: previous.insight },
      ),
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

export const aiSettingsQueryKey = ["insight", "settings"] as const;

/** The "IA no Quantia" card: the user's switch, the provider and what is stored. */
export const useAiSettings = (enabled = true) =>
  useQuery<AiSettings>({
    queryKey: aiSettingsQueryKey,
    queryFn: insightApi.getSettings,
    staleTime: 1000 * 30,
    enabled,
  });

export const useUpdateAiSettings = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: UpdateAiSettingsRequest) => insightApi.updateSettings(data),
    onSuccess: (data) => {
      queryClient.setQueryData(aiSettingsQueryKey, data);
      // Every AI surface reads the switch: the profile carries it, and the cards and the
      // chat answer AiDisabled while it is off.
      queryClient.invalidateQueries({ queryKey: ["profile"] });
      queryClient.invalidateQueries({ queryKey: ["insight", "spending"] });
      queryClient.invalidateQueries({ queryKey: ["insight", "portfolio"] });
    },
  });
};

export const useDeleteInsights = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: insightApi.deleteAll,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: aiSettingsQueryKey });
      queryClient.invalidateQueries({ queryKey: ["insight", "spending"] });
      queryClient.invalidateQueries({ queryKey: ["insight", "portfolio"] });
    },
  });
};

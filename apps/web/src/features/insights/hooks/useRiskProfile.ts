import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { riskProfileApi } from "@/lib/api/insight";
import type { RiskProfile, SaveRiskProfileRequest } from "@/lib/types/insight.types";

export const useRiskProfile = () =>
  useQuery<RiskProfile | null>({
    queryKey: ["riskProfile"],
    queryFn: riskProfileApi.get,
    retry: false,
  });

export const useSaveRiskProfile = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: SaveRiskProfileRequest) => riskProfileApi.save(data),
    onSuccess: (data) => {
      queryClient.setQueryData(["riskProfile"], data);
      // The profile is an input to the portfolio analysis — the cached one predates it.
      queryClient.invalidateQueries({ queryKey: ["insight", "portfolio"] });
    },
  });
};

export const useDeleteRiskProfile = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: riskProfileApi.remove,
    onSuccess: () => {
      queryClient.setQueryData(["riskProfile"], null);
      queryClient.invalidateQueries({ queryKey: ["insight", "portfolio"] });
    },
  });
};

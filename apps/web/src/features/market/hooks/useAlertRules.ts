import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { alertsApi } from "@/lib/api/alerts";
import type { AlertRule, CreateAlertRuleRequest } from "@/lib/types/alerts.types";

const ALERTS_KEY = ["alert-rules"] as const;

export const useAlertRules = () =>
  useQuery({
    queryKey: ALERTS_KEY,
    queryFn: alertsApi.getAll,
    staleTime: 60_000,
  });

export const useCreateAlertRule = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateAlertRuleRequest) => alertsApi.create(data),
    onSuccess: (list: AlertRule[]) => queryClient.setQueryData(ALERTS_KEY, list),
  });
};

export const useDeleteAlertRule = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => alertsApi.delete(id),
    onSuccess: (list: AlertRule[]) => queryClient.setQueryData(ALERTS_KEY, list),
  });
};

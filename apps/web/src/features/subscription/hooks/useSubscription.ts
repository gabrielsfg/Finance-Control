import { useMutation, useQuery, useQueryClient, type QueryClient } from "@tanstack/react-query";
import { subscriptionApi } from "@/lib/api/subscription";
import type {
  ChangeSubscriptionPlanRequest,
  CreateSubscriptionRequest,
  SubscriptionState,
  UpdateSubscriptionCardRequest,
} from "@/lib/types/subscription.types";

export const SUBSCRIPTION_KEY = ["subscription"] as const;

export const useSubscription = () =>
  useQuery({ queryKey: SUBSCRIPTION_KEY, queryFn: subscriptionApi.get, staleTime: 30_000 });

export const useSubscriptionPlans = () =>
  useQuery({ queryKey: ["subscription-plans"], queryFn: subscriptionApi.getPlans, staleTime: 5 * 60_000 });

/**
 * The plan also travels on the profile (sidebar chip, Premium gates), so every change
 * to the subscription refreshes both — otherwise an upgrade would unlock nothing until
 * the profile went stale on its own.
 */
function applyState(queryClient: QueryClient, state: SubscriptionState) {
  queryClient.setQueryData(SUBSCRIPTION_KEY, state);
  queryClient.invalidateQueries({ queryKey: ["profile"] });
  queryClient.invalidateQueries({ queryKey: ["subscription-plans"] });
}

export const useCreateSubscription = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateSubscriptionRequest) => subscriptionApi.create(data),
    onSuccess: (state) => applyState(queryClient, state),
  });
};

export const useCancelSubscription = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: subscriptionApi.cancel,
    onSuccess: (state) => applyState(queryClient, state),
  });
};

export const useResumeSubscription = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: subscriptionApi.resume,
    onSuccess: (state) => applyState(queryClient, state),
  });
};

export const useRefundSubscription = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: subscriptionApi.refund,
    onSuccess: (state) => applyState(queryClient, state),
  });
};

export const useChangeSubscriptionPlan = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: ChangeSubscriptionPlanRequest) => subscriptionApi.changePlan(data),
    onSuccess: (result) => {
      if (result.applied && result.subscription) applyState(queryClient, result.subscription);
    },
  });
};

export const useUpdateSubscriptionCard = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: UpdateSubscriptionCardRequest) => subscriptionApi.updateCard(data),
    onSuccess: (state) => applyState(queryClient, state),
  });
};

export const usePendingPix = (enabled: boolean) =>
  useQuery({
    queryKey: ["subscription", "pending-pix"],
    queryFn: subscriptionApi.getPendingPix,
    enabled,
    staleTime: 60_000,
  });

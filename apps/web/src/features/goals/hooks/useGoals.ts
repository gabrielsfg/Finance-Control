import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { goalsApi } from "@/lib/api/goals";
import type {
  CreateGoalRequest,
  UpdateGoalRequest,
  ContributeGoalRequest,
  WithdrawGoalRequest,
  PurchaseGoalRequest,
  GoalType,
  GoalStatus,
} from "@/lib/types/goal.types";

export const useGoals = (params?: { type?: GoalType; status?: GoalStatus }) =>
  useQuery({
    queryKey: ["goals", params],
    queryFn: () => goalsApi.getAll(params),
    staleTime: 60_000,
  });

export const useGoalDetail = (id: number | null) =>
  useQuery({
    queryKey: ["goals", id],
    queryFn: () => goalsApi.getById(id!),
    staleTime: 60_000,
    enabled: id !== null,
  });

export const useCreateGoal = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateGoalRequest) => goalsApi.create(data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["goals"] }),
  });
};

export const useUpdateGoal = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: UpdateGoalRequest }) => goalsApi.update(id, data),
    onSuccess: (updated) => queryClient.setQueryData(["goals", updated.id], updated),
  });
};

export const useDeleteGoal = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, returnToAccountId }: { id: number; returnToAccountId?: number }) =>
      goalsApi.delete(id, returnToAccountId),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["goals"] }),
  });
};

export const useContributeGoal = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: ContributeGoalRequest }) =>
      goalsApi.contribute(id, data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["goals"] }),
  });
};

export const useWithdrawGoal = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: WithdrawGoalRequest }) =>
      goalsApi.withdraw(id, data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["goals"] }),
  });
};

export const useGoalInvestmentTransactions = (id: number | null) =>
  useQuery({
    queryKey: ["goals", id, "investment-transactions"],
    queryFn: () => goalsApi.getInvestmentTransactions(id!),
    staleTime: 60_000,
    enabled: id !== null,
  });

export const usePurchaseGoal = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: PurchaseGoalRequest }) =>
      goalsApi.purchase(id, data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["goals"] }),
  });
};

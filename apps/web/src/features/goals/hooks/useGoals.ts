import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { goalsApi } from "@/lib/api/goals";
import type { CreateGoalRequest, UpdateGoalRequest, GoalType, GoalStatus } from "@/lib/types/goal.types";

export const useGoals = (params?: { type?: GoalType; status?: GoalStatus }) =>
  useQuery({
    queryKey: ["goals", params],
    queryFn: () => goalsApi.getAll(params),
    staleTime: 60_000,
  });

export const useGoalDetail = (id: number) =>
  useQuery({
    queryKey: ["goals", id],
    queryFn: () => goalsApi.getById(id),
    staleTime: 60_000,
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
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["goals"] }),
  });
};

export const useDeleteGoal = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => goalsApi.delete(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["goals"] }),
  });
};

export const useRecordCheckpoint = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, amount }: { id: number; amount: number }) => goalsApi.recordCheckpoint(id, amount),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["goals"] }),
  });
};

export const useAchieveGoal = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => goalsApi.achieve(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["goals"] }),
  });
};

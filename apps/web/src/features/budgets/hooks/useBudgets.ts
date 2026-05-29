import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { budgetsApi } from "@/lib/api/budgets";
import type { Budget, CreateBudgetRequest, UpdateBudgetRequest } from "@/lib/types/budgets.types";

export const useBudgets = (referenceDate?: string) =>
  useQuery<Budget[]>({
    queryKey: ["budgets", referenceDate ?? "current"],
    queryFn: () => budgetsApi.getAll(referenceDate),
    staleTime: 60_000,
  });

export const useCreateBudget = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateBudgetRequest) => budgetsApi.create(data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["budgets"] }),
  });
};

export const useUpdateBudget = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: UpdateBudgetRequest }) => budgetsApi.update(id, data),
    onSuccess: (updated) => queryClient.setQueryData(["budgets"], updated),
  });
};

export const useActivateBudget = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => budgetsApi.activate(id),
    onSuccess: (updated) => queryClient.setQueryData(["budgets"], updated),
  });
};

export const useDeleteBudget = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => budgetsApi.delete(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["budgets"] }),
  });
};

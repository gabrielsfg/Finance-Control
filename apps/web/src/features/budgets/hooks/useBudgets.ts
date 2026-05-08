import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { budgetsApi } from "@/lib/api/budgets";
import { MOCK_BUDGETS } from "@/lib/mocks";
import type { Budget, CreateBudgetRequest, UpdateBudgetRequest } from "@/lib/types/budgets.types";

export const useBudgets = () =>
  useQuery<Budget[]>({
    queryKey: ["budgets"],
    queryFn: () => Promise.resolve(MOCK_BUDGETS),
    staleTime: Infinity,
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

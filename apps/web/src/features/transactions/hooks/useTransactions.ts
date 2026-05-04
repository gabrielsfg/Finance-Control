import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { transactionsApi } from "@/lib/api/transactions";
import type {
  TransactionItem,
  CreateTransactionRequest,
  UpdateTransactionRequest,
  GetTransactionsFilterParams,
} from "@/lib/types/transactions.types";

const KEY = ["transactions"] as const;

export const useTransactions = () =>
  useQuery<TransactionItem[]>({
    queryKey: KEY,
    queryFn: () => transactionsApi.getAll(),
    staleTime: 60_000,
  });

export const useTransactionsFiltered = (params: GetTransactionsFilterParams) =>
  useQuery<TransactionItem[]>({
    queryKey: ["transactions", "filtered", params],
    queryFn: () => transactionsApi.getFiltered(params),
    staleTime: 60_000,
  });

export const useCreateTransaction = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateTransactionRequest) => transactionsApi.create(data),
    onSuccess: (updated) => queryClient.setQueryData(KEY, updated),
  });
};

export const useUpdateTransaction = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: UpdateTransactionRequest }) =>
      transactionsApi.update(id, data),
    onSuccess: (updated) => queryClient.setQueryData(KEY, updated),
  });
};

export const useDeleteTransaction = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => transactionsApi.delete(id),
    onSuccess: (updated) => queryClient.setQueryData(KEY, updated),
  });
};

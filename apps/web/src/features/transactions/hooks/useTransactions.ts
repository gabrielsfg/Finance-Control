import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { transactionsApi } from "@/lib/api/transactions";
import type {
  TransactionItem,
  CreateTransactionRequest,
  UpdateTransactionRequest,
  GetTransactionsFilterParams,
  TransactionsFilteredResponse,
} from "@/lib/types/transactions.types";

const KEY = ["transactions"] as const;

export const useTransactions = () =>
  useQuery<TransactionItem[]>({
    queryKey: KEY,
    queryFn: () => transactionsApi.getAll(),
  });

export const useTransactionsFiltered = (params: GetTransactionsFilterParams) =>
  useQuery<TransactionsFilteredResponse>({
    queryKey: ["transactions", "filtered", params],
    queryFn: () => transactionsApi.getFiltered(params),
  });

export const useCreateTransaction = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateTransactionRequest) => transactionsApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["transactions", "filtered"] });
    },
  });
};

export const useUpdateTransaction = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: UpdateTransactionRequest }) =>
      transactionsApi.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["transactions", "filtered"] });
    },
  });
};

export const useDeleteTransaction = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => transactionsApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["transactions", "filtered"] });
    },
  });
};

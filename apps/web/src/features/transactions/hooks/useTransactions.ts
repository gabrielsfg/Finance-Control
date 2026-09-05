import { useQuery, useMutation, useQueryClient, keepPreviousData } from "@tanstack/react-query";
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
    // Every filter, page and search term is part of the key, so without this each change
    // is a cache miss and the page falls back to its full-screen spinner — which unmounts
    // the header along with it and wipes whatever the user was typing in the search box.
    placeholderData: keepPreviousData,
  });

export const useCreateTransaction = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateTransactionRequest) => transactionsApi.create(data),
    onSuccess: () => {
      // Transactions feed account balances, the dashboard and analytics — refresh all.
      queryClient.invalidateQueries({ queryKey: ["transactions", "filtered"] });
      queryClient.invalidateQueries({ queryKey: ["accounts"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard"] });
      queryClient.invalidateQueries({ queryKey: ["analytics"] });
      // Saving can create tags inline. Without this the picker keeps offering a list
      // that no longer has them, and the next transaction retypes the same name into a
      // second tag — the exact split the picker exists to prevent.
      queryClient.invalidateQueries({ queryKey: ["tags"] });
    },
  });
};

export const useUpdateTransaction = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: UpdateTransactionRequest }) =>
      transactionsApi.update(id, data),
    onSuccess: () => {
      // Transactions feed account balances, the dashboard and analytics — refresh all.
      queryClient.invalidateQueries({ queryKey: ["transactions", "filtered"] });
      queryClient.invalidateQueries({ queryKey: ["accounts"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard"] });
      queryClient.invalidateQueries({ queryKey: ["analytics"] });
      // Editing can create a tag inline too — same reason as on create.
      queryClient.invalidateQueries({ queryKey: ["tags"] });
    },
  });
};

export const useDeleteTransaction = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => transactionsApi.delete(id),
    onSuccess: () => {
      // Transactions feed account balances, the dashboard and analytics — refresh all.
      queryClient.invalidateQueries({ queryKey: ["transactions", "filtered"] });
      queryClient.invalidateQueries({ queryKey: ["accounts"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard"] });
      queryClient.invalidateQueries({ queryKey: ["analytics"] });
    },
  });
};

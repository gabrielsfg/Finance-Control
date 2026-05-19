import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { accountsApi } from "@/lib/api/accounts";
import type {
  CreateAccountRequest,
  UpdateAccountRequest,
  DeleteAccountRequest,
} from "@/lib/types/accounts.types";

const QUERY_KEY = ["accounts"];

export const useAccounts = () =>
  useQuery({
    queryKey: QUERY_KEY,
    queryFn: accountsApi.getAll,
    staleTime: 60_000,
  });

export const useCreateAccount = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateAccountRequest) => accountsApi.create(data),
    onSuccess: (updatedAccounts) => {
      queryClient.setQueryData(QUERY_KEY, updatedAccounts);
    },
  });
};

export const useUpdateAccount = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: UpdateAccountRequest }) =>
      accountsApi.update(id, data),
    onSuccess: (updatedAccounts) => {
      queryClient.setQueryData(QUERY_KEY, updatedAccounts);
    },
  });
};

export const useBalanceHistory = (accountId: number, days = 30) =>
  useQuery({
    queryKey: ["accounts", accountId, "balance-history", days],
    queryFn: () => accountsApi.getBalanceHistory(accountId, days),
    staleTime: 60_000,
    enabled: accountId > 0,
  });

export const useDeleteAccount = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: DeleteAccountRequest }) =>
      accountsApi.delete(id, data),
    onSuccess: (updatedAccounts) => {
      queryClient.setQueryData(QUERY_KEY, updatedAccounts);
    },
  });
};


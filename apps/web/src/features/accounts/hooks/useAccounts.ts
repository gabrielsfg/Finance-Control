import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { accountsApi } from "@/lib/api/accounts";
import { MOCK_ACCOUNTS, MOCK_BALANCE_HISTORIES } from "@/lib/mocks";
import type {
  CreateAccountRequest,
  UpdateAccountRequest,
  DeleteAccountRequest,
} from "@/lib/types/accounts.types";

const QUERY_KEY = ["accounts"];

export const useAccounts = () => {
  return useQuery({
    queryKey: QUERY_KEY,
    queryFn: () => Promise.resolve(MOCK_ACCOUNTS),
    staleTime: Infinity,
  });
};

export const useCreateAccount = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateAccountRequest) => accountsApi.create(data),
    onSuccess: (updatedAccounts) => {
      queryClient.setQueryData(QUERY_KEY, updatedAccounts);
    },
    onError: () => {
      queryClient.setQueryData(QUERY_KEY, MOCK_ACCOUNTS);
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
    onError: () => {
      queryClient.setQueryData(QUERY_KEY, MOCK_ACCOUNTS);
    },
  });
};

export const useBalanceHistory = (accountId: number, days = 30) => {
  return useQuery({
    queryKey: ["accounts", accountId, "balance-history", days],
    queryFn: () => Promise.resolve(MOCK_BALANCE_HISTORIES[accountId] ?? []),
    staleTime: Infinity,
    enabled: accountId > 0,
  });
};

export const useDeleteAccount = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: DeleteAccountRequest }) =>
      accountsApi.delete(id, data),
    onSuccess: (updatedAccounts) => {
      queryClient.setQueryData(QUERY_KEY, updatedAccounts);
    },
    onError: () => {
      queryClient.setQueryData(QUERY_KEY, MOCK_ACCOUNTS);
    },
  });
};


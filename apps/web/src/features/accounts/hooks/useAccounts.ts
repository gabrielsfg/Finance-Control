import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { accountsApi } from "@/lib/api/accounts";
import type {
  CreateAccountRequest,
  UpdateAccountRequest,
  DeleteAccountRequest,
} from "@/lib/types/accounts.types";

const QUERY_KEY = ["accounts"];

export const useAccounts = () => {
  return useQuery({
    queryKey: QUERY_KEY,
    queryFn: accountsApi.getAll,
  });
};

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


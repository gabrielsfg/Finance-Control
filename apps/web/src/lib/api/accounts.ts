import { api } from "./axios";
import type {
  AccountItem,
  AccountDetail,
  CreateAccountRequest,
  UpdateAccountRequest,
  DeleteAccountRequest,
} from "@/lib/types/accounts.types";

export const accountsApi = {
  getAll: async (): Promise<AccountItem[]> => {
    const response = await api.get<AccountItem[]>("/account");
    return response.data;
  },

  getById: async (id: number): Promise<AccountDetail> => {
    const response = await api.get<AccountDetail>(`/account/${id}`);
    return response.data;
  },

  create: async (data: CreateAccountRequest): Promise<AccountItem[]> => {
    const response = await api.post<AccountItem[]>("/account", data);
    return response.data;
  },

  update: async (id: number, data: UpdateAccountRequest): Promise<AccountItem[]> => {
    const response = await api.patch<AccountItem[]>(`/account/${id}`, data);
    return response.data;
  },

  delete: async (id: number, data: DeleteAccountRequest): Promise<AccountItem[]> => {
    const response = await api.delete<AccountItem[]>(`/account/${id}`, { data });
    return response.data;
  },
};

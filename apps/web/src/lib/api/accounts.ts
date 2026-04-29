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
    const response = await api.get<AccountItem[]>("/accounts");
    return response.data;
  },

  getById: async (id: number): Promise<AccountDetail> => {
    const response = await api.get<AccountDetail>(`/accounts/${id}`);
    return response.data;
  },

  create: async (data: CreateAccountRequest): Promise<AccountItem[]> => {
    const response = await api.post<AccountItem[]>("/accounts", data);
    return response.data;
  },

  update: async (id: number, data: UpdateAccountRequest): Promise<AccountItem[]> => {
    const response = await api.patch<AccountItem[]>(`/accounts/${id}`, data);
    return response.data;
  },

  delete: async (id: number, data: DeleteAccountRequest): Promise<AccountItem[]> => {
    const response = await api.delete<AccountItem[]>(`/accounts/${id}`, { data });
    return response.data;
  },
};

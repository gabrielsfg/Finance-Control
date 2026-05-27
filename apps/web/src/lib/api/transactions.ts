import { api } from "./axios";
import type {
  TransactionItem,
  CreateTransactionRequest,
  UpdateTransactionRequest,
  GetTransactionsFilterParams,
  TransactionsFilteredResponse,
} from "@/lib/types/transactions.types";

export const transactionsApi = {
  getAll: async (): Promise<TransactionItem[]> => {
    const res = await api.get<TransactionItem[]>("/transaction");
    return res.data;
  },

  getFiltered: async (params: GetTransactionsFilterParams): Promise<TransactionsFilteredResponse> => {
    const res = await api.get<TransactionsFilteredResponse>("/transaction/filtered", { params });
    return res.data;
  },

  create: async (data: CreateTransactionRequest): Promise<TransactionItem[]> => {
    const res = await api.post<{ transactions: TransactionItem[] }>("/transaction", data);
    return res.data.transactions;
  },

  update: async (id: number, data: UpdateTransactionRequest): Promise<TransactionItem[]> => {
    const res = await api.patch<{ transactions: TransactionItem[] }>(`/transaction/${id}`, data);
    return res.data.transactions;
  },

  delete: async (id: number): Promise<void> => {
    await api.delete(`/transaction/${id}`);
  },
};

import { api } from "./axios";
import type {
  TransactionItem,
  CreateTransactionRequest,
  UpdateTransactionRequest,
} from "@/lib/types/transactions.types";

export const transactionsApi = {
  getAll: async (): Promise<TransactionItem[]> => {
    const res = await api.get<TransactionItem[]>("/transaction");
    return res.data;
  },

  create: async (data: CreateTransactionRequest): Promise<TransactionItem[]> => {
    const res = await api.post<{ transactions: TransactionItem[] }>("/transaction", data);
    return res.data.transactions;
  },

  update: async (id: number, data: UpdateTransactionRequest): Promise<TransactionItem[]> => {
    const res = await api.patch<TransactionItem[]>(`/transaction/${id}`, data);
    return res.data;
  },

  delete: async (id: number): Promise<TransactionItem[]> => {
    const res = await api.delete<TransactionItem[]>(`/transaction/${id}`);
    return res.data;
  },
};

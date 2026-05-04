import { api } from "./axios";
import type { Budget, CreateBudgetRequest, UpdateBudgetRequest } from "@/lib/types/budgets.types";

export const budgetsApi = {
  getAll: async (): Promise<Budget[]> => {
    const res = await api.get<Budget[]>("/budget");
    return res.data;
  },

  create: async (data: CreateBudgetRequest): Promise<Budget> => {
    const res = await api.post<Budget>("/budget", data);
    return res.data;
  },

  update: async (id: number, data: UpdateBudgetRequest): Promise<Budget[]> => {
    const res = await api.put<Budget[]>(`/budget/${id}`, data);
    return res.data;
  },

  activate: async (id: number): Promise<Budget[]> => {
    const res = await api.patch<Budget[]>(`/budget/${id}/activate`);
    return res.data;
  },

  delete: async (id: number): Promise<void> => {
    await api.delete(`/budget/${id}`);
  },
};

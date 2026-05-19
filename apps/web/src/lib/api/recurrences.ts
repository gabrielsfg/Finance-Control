import { api } from "./axios";
import type {
  RecurrencePageData,
  RecurringItem,
  CreateRecurringRequest,
  UpdateRecurringRequest,
} from "@/lib/types/recurrences.types";

export const recurrencesApi = {
  getPage: async (): Promise<RecurrencePageData> => {
    const res = await api.get<RecurrencePageData>("/recurrences");
    return res.data;
  },

  createRecurring: async (data: CreateRecurringRequest): Promise<RecurringItem> => {
    const res = await api.post<RecurringItem>("/recurrences/recurring", data);
    return res.data;
  },

  updateRecurring: async (id: number, data: UpdateRecurringRequest): Promise<RecurringItem> => {
    const res = await api.patch<RecurringItem>(`/recurrences/recurring/${id}`, data);
    return res.data;
  },

  cancelRecurring: async (id: number): Promise<void> => {
    await api.patch(`/recurrences/recurring/${id}/cancel`);
  },

  reactivateRecurring: async (id: number): Promise<RecurringItem> => {
    const res = await api.patch<RecurringItem>(`/recurrences/recurring/${id}/reactivate`);
    return res.data;
  },

  deleteRecurring: async (id: number): Promise<void> => {
    await api.delete(`/recurrences/recurring/${id}`);
  },
};

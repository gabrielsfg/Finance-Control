import { api } from "./axios";
import type { AlertRule, CreateAlertRuleRequest } from "@/lib/types/alerts.types";

export const alertsApi = {
  getAll: async (): Promise<AlertRule[]> => {
    const res = await api.get<AlertRule[]>("/alertrule");
    return res.data;
  },

  // Mutations return the full updated list (project convention).
  create: async (data: CreateAlertRuleRequest): Promise<AlertRule[]> => {
    const res = await api.post<AlertRule[]>("/alertrule", data);
    return res.data;
  },

  delete: async (id: number): Promise<AlertRule[]> => {
    const res = await api.delete<AlertRule[]>(`/alertrule/${id}`);
    return res.data;
  },
};

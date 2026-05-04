import { api } from "./axios";
import type { Goal, GoalDetail, GoalCheckpoint, CreateGoalRequest, UpdateGoalRequest, GoalType, GoalStatus } from "@/lib/types/goal.types";

export const goalsApi = {
  getAll: async (params?: { type?: GoalType; status?: GoalStatus }): Promise<Goal[]> => {
    const response = await api.get<Goal[]>("/goals", { params });
    return response.data;
  },

  getById: async (id: number): Promise<GoalDetail> => {
    const response = await api.get<GoalDetail>(`/goals/${id}`);
    return response.data;
  },

  create: async (data: CreateGoalRequest): Promise<Goal> => {
    const response = await api.post<Goal>("/goals", data);
    return response.data;
  },

  update: async (id: number, data: UpdateGoalRequest): Promise<Goal> => {
    const response = await api.patch<Goal>(`/goals/${id}`, data);
    return response.data;
  },

  delete: async (id: number): Promise<void> => {
    await api.delete(`/goals/${id}`);
  },

  recordCheckpoint: async (id: number, amount: number): Promise<GoalCheckpoint> => {
    const response = await api.post<GoalCheckpoint>(`/goals/${id}/checkpoint`, { amount });
    return response.data;
  },

  achieve: async (id: number): Promise<Goal> => {
    const response = await api.post<Goal>(`/goals/${id}/achieve`);
    return response.data;
  },
};

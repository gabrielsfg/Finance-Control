import { api } from "./axios";
import type {
  Goal,
  GoalDetail,
  CreateGoalRequest,
  UpdateGoalRequest,
  ContributeGoalRequest,
  WithdrawGoalRequest,
  PurchaseGoalRequest,
  GoalInvestmentTransaction,
  GoalType,
  GoalStatus,
} from "@/lib/types/goal.types";

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

  delete: async (id: number, returnToAccountId?: number): Promise<void> => {
    await api.delete(`/goals/${id}`, { params: returnToAccountId ? { returnToAccountId } : undefined });
  },

  contribute: async (id: number, data: ContributeGoalRequest): Promise<Goal> => {
    const response = await api.post<Goal>(`/goals/${id}/contribute`, data);
    return response.data;
  },

  withdraw: async (id: number, data: WithdrawGoalRequest): Promise<Goal> => {
    const response = await api.post<Goal>(`/goals/${id}/withdraw`, data);
    return response.data;
  },

  purchase: async (id: number, data: PurchaseGoalRequest): Promise<Goal> => {
    const response = await api.post<Goal>(`/goals/${id}/purchase`, data);
    return response.data;
  },

  getInvestmentTransactions: async (id: number): Promise<GoalInvestmentTransaction[]> => {
    const response = await api.get<GoalInvestmentTransaction[]>(`/goals/${id}/investment-transactions`);
    return response.data;
  },
};

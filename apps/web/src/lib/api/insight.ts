import { api } from "./axios";
import type {
  AiContext,
  AiSettings,
  DeletedCountResponse,
  InsightResult,
  RiskProfile,
  SaveRiskProfileRequest,
  UpdateAiSettingsRequest,
} from "@/lib/types/insight.types";

/**
 * The analysis endpoints always answer 200 with `{ status, insight }`. Free plan, AI
 * switched off, quota spent or too little history are normal states the card renders,
 * so none of them is an error.
 */
export const insightApi = {
  getSpending: async (): Promise<InsightResult> => {
    const response = await api.get<InsightResult>("/insight/spending");
    return response.data;
  },

  refreshSpending: async (): Promise<InsightResult> => {
    const response = await api.post<InsightResult>("/insight/spending/refresh");
    return response.data;
  },

  getPortfolio: async (): Promise<InsightResult> => {
    const response = await api.get<InsightResult>("/insight/portfolio");
    return response.data;
  },

  /** Deletes every stored analysis of the user. */
  deleteAll: async (): Promise<DeletedCountResponse> => {
    const response = await api.delete<DeletedCountResponse>("/insight");
    return response.data;
  },

  getSettings: async (): Promise<AiSettings> => {
    const response = await api.get<AiSettings>("/insight/settings");
    return response.data;
  },

  updateSettings: async (data: UpdateAiSettingsRequest): Promise<AiSettings> => {
    const response = await api.put<AiSettings>("/insight/settings", data);
    return response.data;
  },

  getContext: async (): Promise<AiContext | null> => {
    const response = await api.get<AiContext | "">("/insight/context");
    return response.status === 204 ? null : (response.data as AiContext);
  },

  upsertContext: async (text: string): Promise<AiContext> => {
    const response = await api.put<AiContext>("/insight/context", { text });
    return response.data;
  },
};

export const riskProfileApi = {
  get: async (): Promise<RiskProfile | null> => {
    const response = await api.get<RiskProfile | "">("/riskprofile");
    return response.status === 204 ? null : (response.data as RiskProfile);
  },

  save: async (data: SaveRiskProfileRequest): Promise<RiskProfile> => {
    const response = await api.put<RiskProfile>("/riskprofile", data);
    return response.data;
  },

  remove: async (): Promise<void> => {
    await api.delete("/riskprofile");
  },
};

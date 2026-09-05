import { api } from "./axios";
import type {
  AiContext,
  Insight,
  RiskProfile,
  SaveRiskProfileRequest,
} from "@/lib/types/insight.types";

/**
 * The analysis endpoints answer 204 whenever there is nothing to show — free plan,
 * feature disabled, quota spent or too little history. All of those are normal states,
 * so they come back as null and the card simply does not render.
 */
export const insightApi = {
  getSpending: async (): Promise<Insight | null> => {
    const response = await api.get<Insight | "">("/insight/spending");
    return response.status === 204 ? null : (response.data as Insight);
  },

  refreshSpending: async (): Promise<Insight | null> => {
    const response = await api.post<Insight | "">("/insight/spending/refresh");
    return response.status === 204 ? null : (response.data as Insight);
  },

  getPortfolio: async (): Promise<Insight | null> => {
    const response = await api.get<Insight | "">("/insight/portfolio");
    return response.status === 204 ? null : (response.data as Insight);
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

import { api } from "./axios";
import type { DeletedCountResponse } from "@/lib/types/insight.types";
import type {
  AiAction,
  AiConversation,
  AiConversationItem,
  ConfirmAiActionRequest,
  SendAssistantMessageRequest,
  SendAssistantMessageResponse,
} from "@/lib/types/assistant.types";

export const assistantApi = {
  listConversations: async (): Promise<AiConversationItem[]> => {
    const response = await api.get<AiConversationItem[]>("/assistant/conversations");
    return response.data;
  },

  getConversation: async (id: number): Promise<AiConversation> => {
    const response = await api.get<AiConversation>(`/assistant/conversations/${id}`);
    return response.data;
  },

  /** Answers with the updated list. */
  deleteConversation: async (id: number): Promise<AiConversationItem[]> => {
    const response = await api.delete<AiConversationItem[]>(`/assistant/conversations/${id}`);
    return response.data;
  },

  deleteAllConversations: async (): Promise<DeletedCountResponse> => {
    const response = await api.delete<DeletedCountResponse>("/assistant/conversations");
    return response.data;
  },

  /** Not streamed — the model runs its tools before answering, so this can take 5–30 s. */
  sendMessage: async (data: SendAssistantMessageRequest): Promise<SendAssistantMessageResponse> => {
    const response = await api.post<SendAssistantMessageResponse>("/assistant/messages", data, {
      timeout: 90_000,
    });
    return response.data;
  },

  confirmAction: async (id: number, data: ConfirmAiActionRequest): Promise<AiAction> => {
    const response = await api.post<AiAction>(`/assistant/actions/${id}/confirm`, data);
    return response.data;
  },

  cancelAction: async (id: number): Promise<AiAction> => {
    const response = await api.post<AiAction>(`/assistant/actions/${id}/cancel`);
    return response.data;
  },
};

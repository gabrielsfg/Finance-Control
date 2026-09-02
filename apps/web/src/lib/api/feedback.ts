import { api } from "./axios";
import type { CreateFeedbackRequest, FeedbackItem } from "@/lib/types/feedback.types";

export const feedbackApi = {
  /**
   * Write-only endpoint: reports are read from the database during triage, so
   * there is nothing to fetch back here.
   */
  create: async (data: CreateFeedbackRequest): Promise<FeedbackItem> => {
    const response = await api.post<FeedbackItem>("/feedback", data);
    return response.data;
  },
};

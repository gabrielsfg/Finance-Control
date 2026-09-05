import { useMutation } from "@tanstack/react-query";
import { feedbackApi } from "@/lib/api/feedback";
import type { CreateFeedbackRequest } from "@/lib/types/feedback.types";

/** Nothing to invalidate: the submission is not read back anywhere in the app. */
export const useSubmitFeedback = () =>
  useMutation({
    mutationFn: (data: CreateFeedbackRequest) => feedbackApi.create(data),
  });

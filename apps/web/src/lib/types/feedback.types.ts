export type FeedbackType = "Bug" | "Suggestion";

export type FeedbackStatus = "New" | "UnderReview" | "Done" | "Dismissed";

export type CreateFeedbackRequest = {
  type: FeedbackType;
  title: string;
  description?: string;
  /** Which client sent it — the API only stores "web" and "mobile". */
  source: "web";
};

export type FeedbackItem = {
  id: number;
  type: FeedbackType;
  title: string;
  description: string | null;
  status: FeedbackStatus;
  createdAt: string;
};

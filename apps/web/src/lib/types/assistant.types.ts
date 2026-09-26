import type { AiAvailability } from "./insight.types";

export type AiMessageRole = "User" | "Assistant";

export type AiActionKind = "CreateTransaction" | "UpdateTransaction" | "CreateGoal" | "CreateBudget";

export type AiActionStatus = "Pending" | "Confirmed" | "Cancelled" | "Expired" | "Failed";

export type AiActionPreviewLine = {
  label: string;
  value: string;
};

export type AiActionPreview = {
  title: string;
  lines: AiActionPreviewLine[];
};

/** A confirmation card: what the assistant proposes to write. Nothing is saved until confirmed. */
export type AiAction = {
  id: number;
  kind: AiActionKind;
  status: AiActionStatus;
  /** The request confirming sends — edited fields go back in the same shape. */
  payload: Record<string, unknown>;
  /** UpdateTransaction: the transaction being edited. */
  targetId: number | null;
  /** Ready to render, names already resolved by the API. */
  preview: AiActionPreview;
  expiresAt: string;
  resultId: number | null;
  error: string | null;
};

export type AiMessage = {
  id: number;
  role: AiMessageRole;
  content: string;
  createdAt: string;
  /** The assistant could not answer — shown muted, with a retry. */
  isError: boolean;
  actions: AiAction[];
};

export type AiConversationItem = {
  id: number;
  title: string;
  createdAt: string;
  lastMessageAt: string;
};

export type AiConversation = AiConversationItem & {
  /** Oldest first. */
  messages: AiMessage[];
};

export type SendAssistantMessageRequest = {
  conversationId: number | null;
  message: string;
};

export type SendAssistantMessageResponse = {
  /** Anything but Available means nothing was stored and the message fields are null. */
  status: AiAvailability;
  conversationId: number | null;
  conversationTitle: string | null;
  userMessage: AiMessage | null;
  assistantMessage: AiMessage | null;
  messagesUsed: number;
  messagesLimit: number;
};

export type ConfirmAiActionRequest = {
  /** The edited proposal, or null to confirm it unchanged. */
  payload: Record<string, unknown> | null;
};

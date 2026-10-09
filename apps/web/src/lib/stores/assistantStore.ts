import { create } from "zustand";
import type { AiAvailability } from "@/lib/types/insight.types";

type BlockedStatus = Exclude<AiAvailability, "Available">;

type AssistantState = {
  isOpen: boolean;
  /** Null is a new, not yet created conversation. */
  activeConversationId: number | null;
  showConversationList: boolean;
  /** The last send the API refused by status — nothing was stored, so it is rendered instead. */
  blockedStatus: BlockedStatus | null;
  open: () => void;
  close: () => void;
  openConversation: (id: number) => void;
  startNewConversation: () => void;
  setShowConversationList: (show: boolean) => void;
  setActiveConversationId: (id: number | null) => void;
  setBlockedStatus: (status: BlockedStatus | null) => void;
};

/**
 * UI state of the chat drawer. Server state (conversations, messages, usage) lives in
 * React Query; this only remembers which conversation is on screen and whether the
 * drawer is open, so navigating between pages keeps the chat where it was.
 * Not persisted: a reload starting on the conversation list is the expected behaviour.
 */
export const useAssistantStore = create<AssistantState>()((set) => ({
  isOpen: false,
  activeConversationId: null,
  showConversationList: false,
  blockedStatus: null,
  // A refusal from a previous session of the drawer (AI switched off, quota) may no
  // longer hold — the settings query is the source of truth on reopen.
  open: () => set({ isOpen: true, blockedStatus: null }),
  close: () => set({ isOpen: false }),
  openConversation: (id) =>
    set({ activeConversationId: id, showConversationList: false, blockedStatus: null }),
  startNewConversation: () =>
    set({ activeConversationId: null, showConversationList: false, blockedStatus: null }),
  setShowConversationList: (show) => set({ showConversationList: show }),
  setActiveConversationId: (id) => set({ activeConversationId: id }),
  setBlockedStatus: (status) => set({ blockedStatus: status }),
}));

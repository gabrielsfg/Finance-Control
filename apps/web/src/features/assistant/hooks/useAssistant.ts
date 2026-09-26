import {
  useIsMutating,
  useMutation,
  useQuery,
  useQueryClient,
  type QueryClient,
} from "@tanstack/react-query";
import { assistantApi } from "@/lib/api/assistant";
import { aiSettingsQueryKey } from "@/features/insights/hooks/useInsight";
import { useAssistantStore } from "@/lib/stores/assistantStore";
import type { AiSettings } from "@/lib/types/insight.types";
import type {
  AiAction,
  AiActionKind,
  AiConversation,
  AiMessage,
  SendAssistantMessageRequest,
} from "@/lib/types/assistant.types";

export const conversationsQueryKey = ["assistant", "conversations"] as const;
export const conversationQueryKey = (id: number) => ["assistant", "conversation", id] as const;

const sendMessageMutationKey = ["assistant", "send"] as const;

export const useConversations = (enabled = true) =>
  useQuery({
    queryKey: conversationsQueryKey,
    queryFn: assistantApi.listConversations,
    staleTime: 1000 * 30,
    enabled,
  });

export const useConversation = (id: number | null) =>
  useQuery({
    queryKey: conversationQueryKey(id ?? 0),
    queryFn: () => assistantApi.getConversation(id as number),
    // The messages only change through this client (send, confirm, cancel), and every
    // one of those writes the cache — a refetch would only re-download the same thread.
    staleTime: 1000 * 60 * 5,
    retry: false,
    enabled: id !== null,
  });

export const useDeleteConversation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => assistantApi.deleteConversation(id),
    onSuccess: (updated, id) => {
      queryClient.setQueryData(conversationsQueryKey, updated);
      queryClient.removeQueries({ queryKey: conversationQueryKey(id) });
      queryClient.invalidateQueries({ queryKey: aiSettingsQueryKey });
    },
  });
};

export const useDeleteAllConversations = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: assistantApi.deleteAllConversations,
    onSuccess: () => {
      queryClient.setQueryData(conversationsQueryKey, []);
      queryClient.removeQueries({ queryKey: ["assistant", "conversation"] });
      queryClient.invalidateQueries({ queryKey: aiSettingsQueryKey });
    },
  });
};

/**
 * Sends one message. The answer carries both stored messages, so they are appended to
 * the cached thread directly rather than refetching it — and the usage counter on the
 * settings cache follows the numbers the response brings.
 */
export const useSendMessage = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationKey: sendMessageMutationKey,
    mutationFn: (data: SendAssistantMessageRequest) => assistantApi.sendMessage(data),
    // Store updates live here, not in the caller's `mutate` callbacks: those are dropped
    // if the drawer closes mid-request, and a new conversation would then never become
    // the active one.
    onSuccess: (response, variables) => {
      queryClient.setQueryData<AiSettings>(aiSettingsQueryKey, (previous) =>
        previous
          ? {
              ...previous,
              chatMessagesUsed: response.messagesUsed,
              chatMessagesLimit: response.messagesLimit,
            }
          : previous,
      );

      const store = useAssistantStore.getState();
      if (response.status !== "Available") {
        store.setBlockedStatus(response.status);
        return;
      }
      if (response.conversationId === null) return;

      const { conversationId, conversationTitle, userMessage, assistantMessage } = response;
      const added = [userMessage, assistantMessage].filter((m): m is AiMessage => m !== null);
      const now = new Date().toISOString();

      queryClient.setQueryData<AiConversation>(conversationQueryKey(conversationId), (previous) =>
        previous
          ? {
              ...previous,
              title: conversationTitle ?? previous.title,
              lastMessageAt: now,
              messages: [...previous.messages, ...added],
            }
          : {
              id: conversationId,
              title: conversationTitle ?? "Nova conversa",
              createdAt: now,
              lastMessageAt: now,
              messages: added,
            },
      );
      queryClient.invalidateQueries({ queryKey: conversationsQueryKey });

      // The first message of a new conversation creates it — follow it, unless the user
      // has moved to another conversation in the meantime.
      if (variables.conversationId === null && store.activeConversationId === null) {
        store.setActiveConversationId(conversationId);
      }
    },
  });
};

/** Whether a message is on its way — for controls outside the chat view (header buttons). */
export const useIsSendingMessage = () => useIsMutating({ mutationKey: sendMessageMutationKey }) > 0;

/** What a confirmed action changed, so every screen showing that domain refetches. */
const AFFECTED_QUERIES: Record<AiActionKind, string[]> = {
  CreateTransaction: ["transactions", "accounts", "dashboard", "analytics", "budgets", "tags"],
  UpdateTransaction: ["transactions", "accounts", "dashboard", "analytics", "budgets", "tags"],
  CreateGoal: ["goals", "dashboard"],
  CreateBudget: ["budgets", "dashboard", "analytics"],
};

/** Swaps the updated action into whichever cached message holds it. */
function writeAction(queryClient: QueryClient, conversationId: number, action: AiAction) {
  queryClient.setQueryData<AiConversation>(conversationQueryKey(conversationId), (previous) =>
    previous
      ? {
          ...previous,
          messages: previous.messages.map((message) => ({
            ...message,
            actions: message.actions.map((a) => (a.id === action.id ? action : a)),
          })),
        }
      : previous,
  );
}

export const useConfirmAction = (conversationId: number) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }: { id: number; payload: Record<string, unknown> | null }) =>
      assistantApi.confirmAction(id, { payload }),
    onSuccess: (action) => {
      writeAction(queryClient, conversationId, action);
      for (const key of AFFECTED_QUERIES[action.kind]) {
        queryClient.invalidateQueries({ queryKey: [key] });
      }
    },
  });
};

export const useCancelAction = (conversationId: number) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => assistantApi.cancelAction(id),
    onSuccess: (action) => writeAction(queryClient, conversationId, action),
  });
};

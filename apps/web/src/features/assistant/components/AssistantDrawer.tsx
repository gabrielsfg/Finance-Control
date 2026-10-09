"use client";

import { useEffect, useRef, useState } from "react";
import {
  ArrowUp,
  Gauge,
  History,
  Loader2,
  MessageSquarePlus,
  RotateCcw,
  Sparkles,
  Trash2,
  X,
} from "lucide-react";
import { PremiumNotice } from "@/components/shared/PremiumNotice";
import { AiStatusNotice } from "@/features/insights/components/AiStatusNotice";
import { useAiSettings } from "@/features/insights/hooks/useInsight";
import { usePlan } from "@/lib/hooks/usePlan";
import { useAssistantStore } from "@/lib/stores/assistantStore";
import { formatRelativeTime } from "@/lib/utils/formatDate";
import { cn } from "@/lib/utils";
import {
  useConversation,
  useConversations,
  useDeleteConversation,
  useIsSendingMessage,
  useSendMessage,
} from "../hooks/useAssistant";
import { getApiErrorMessage } from "../utils/apiError";
import { MessageContent } from "./MessageContent";
import { ActionCard } from "./ActionCard";
import type { AiMessage } from "@/lib/types/assistant.types";

/** Matches the API validator. */
const MAX_MESSAGE_LENGTH = 2000;

const EXAMPLE_PROMPTS = [
  "Quanto gastei com mercado nos últimos 3 meses?",
  "Quanto gasto por mês com a tag Viagem?",
  "Estourei algum orçamento este mês?",
  "Registra um gasto de R$ 50 no mercado hoje",
];

/**
 * The chat assistant, as a right-hand drawer over whatever page is open.
 *
 * Gated in order: plan (free accounts see the upsell), platform switch, the user's own
 * switch, then the monthly quota. Each is a state rendered in place of the chat — the
 * API would refuse the message anyway, and saying why up front beats a failed send.
 */
export function AssistantDrawer() {
  const { isOpen, close, showConversationList } = useAssistantStore();
  const { isPremium, isLoading: planLoading } = usePlan();
  const settings = useAiSettings(isOpen && isPremium);
  const blockedStatus = useAssistantStore((s) => s.blockedStatus);

  useEffect(() => {
    if (!isOpen) return;
    const onKeyDown = (e: KeyboardEvent) => e.key === "Escape" && close();
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [isOpen, close]);

  if (!isOpen) return null;

  const aiSettings = settings.data;
  const used = aiSettings?.chatMessagesUsed ?? 0;
  const limit = aiSettings?.chatMessagesLimit ?? 0;
  const canChat = isPremium && aiSettings?.isAvailable !== false && aiSettings?.aiEnabled !== false;

  const renderBody = () => {
    if (planLoading || (isPremium && settings.isLoading)) {
      return (
        <div className="flex flex-1 items-center justify-center">
          <Loader2 size={20} className="animate-spin text-[var(--brand-accent)]" />
        </div>
      );
    }

    if (!isPremium || blockedStatus === "NotPremium") {
      return (
        <div className="flex flex-1 flex-col justify-center px-6">
          <p className="font-display mb-3 text-[17px] font-bold tracking-[-0.01em] text-[var(--text)]">
            Pergunte sobre o seu dinheiro
          </p>
          <PremiumNotice description="Um assistente que consulta seus lançamentos, orçamentos, metas e investimentos para responder em segundos — e registra transações por você, sempre com a sua confirmação." />
        </div>
      );
    }

    if (aiSettings?.isAvailable === false || blockedStatus === "Unavailable") {
      return (
        <div className="flex flex-1 flex-col justify-center px-6">
          <AiStatusNotice status="Unavailable" />
        </div>
      );
    }

    if (aiSettings?.aiEnabled === false || blockedStatus === "AiDisabled") {
      return (
        <div className="flex flex-1 flex-col justify-center px-6">
          <AiStatusNotice status="AiDisabled" />
        </div>
      );
    }

    if (showConversationList) return <ConversationList />;

    return <ChatView quotaReached={blockedStatus === "QuotaExceeded" || (limit > 0 && used >= limit)} limit={limit} />;
  };

  return (
    <>
      <div className="anim-fade fixed inset-0 z-40 bg-black/40 backdrop-blur-[2px]" onClick={close} />

      <div
        role="dialog"
        aria-label="Assistente de IA"
        className="anim-drawer border-border bg-surface fixed inset-y-0 right-0 z-50 flex w-full max-w-[460px] flex-col border-l shadow-2xl"
      >
        <DrawerHeader canChat={canChat} used={used} limit={limit} />
        {renderBody()}
      </div>
    </>
  );
}

function DrawerHeader({ canChat, used, limit }: { canChat: boolean; used: number; limit: number }) {
  const { close, showConversationList, setShowConversationList, startNewConversation } =
    useAssistantStore();
  const sending = useIsSendingMessage();

  return (
    <div className="border-border flex items-center gap-3 border-b px-5 py-4">
      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-[9px] bg-[color-mix(in_srgb,var(--brand-cobalt)_12%,transparent)]">
        <Sparkles size={16} className="text-[var(--brand-accent)]" strokeWidth={1.75} />
      </div>
      <div className="min-w-0 flex-1">
        <h2 className="font-display text-text text-[15px] font-semibold">Assistente</h2>
        {canChat && limit > 0 ? (
          <p className="text-text-muted font-mono text-[11px] tabular-nums">
            {used}/{limit} mensagens este mês
          </p>
        ) : (
          <p className="text-text-muted text-[12px]">Pergunte sobre suas finanças</p>
        )}
      </div>

      {canChat && (
        <>
          <button
            onClick={() => setShowConversationList(!showConversationList)}
            disabled={sending}
            title="Conversas"
            aria-label="Conversas"
            aria-pressed={showConversationList}
            className={cn(
              "flex h-8 w-8 items-center justify-center rounded-[9px] transition-colors disabled:opacity-50",
              showConversationList
                ? "bg-[var(--surface2)] text-[var(--text)]"
                : "text-text-muted hover:bg-[var(--surface2)] hover:text-[var(--text)]",
            )}
          >
            <History size={16} />
          </button>
          <button
            onClick={startNewConversation}
            disabled={sending}
            title="Nova conversa"
            aria-label="Nova conversa"
            className="text-text-muted flex h-8 w-8 items-center justify-center rounded-[9px] transition-colors hover:bg-[var(--surface2)] hover:text-[var(--text)] disabled:opacity-50"
          >
            <MessageSquarePlus size={16} />
          </button>
        </>
      )}

      <button
        onClick={close}
        aria-label="Fechar"
        className="text-text-muted hover:text-text flex h-8 w-8 items-center justify-center transition-colors"
      >
        <X size={18} />
      </button>
    </div>
  );
}

function ConversationList() {
  const { activeConversationId, openConversation, startNewConversation } = useAssistantStore();
  const { data: conversations = [], isLoading, isError, refetch } = useConversations();
  const remove = useDeleteConversation();
  const [confirmingId, setConfirmingId] = useState<number | null>(null);

  if (isLoading) {
    return (
      <div className="flex flex-1 items-center justify-center">
        <Loader2 size={18} className="animate-spin text-[var(--brand-accent)]" />
      </div>
    );
  }

  if (isError) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-3 px-6 text-center">
        <p className="text-[13px] text-[var(--text-sub)]">Não foi possível carregar suas conversas.</p>
        <RetryButton onClick={() => refetch()} />
      </div>
    );
  }

  return (
    <div className="flex flex-1 flex-col overflow-y-auto px-3 py-3">
      <button
        onClick={startNewConversation}
        className="border-border mb-2 flex items-center gap-2 rounded-[11px] border border-dashed px-3 py-2.5 text-[13px] font-medium text-[var(--text)] transition-colors hover:bg-[var(--surface2)]"
      >
        <MessageSquarePlus size={14} className="text-[var(--brand-accent)]" />
        Nova conversa
      </button>

      {conversations.length === 0 && (
        <p className="px-3 py-6 text-center text-[12.5px] text-[var(--text-sub)]">
          Nenhuma conversa ainda.
        </p>
      )}

      {conversations.map((conversation) => {
        const active = conversation.id === activeConversationId;
        const confirming = confirmingId === conversation.id;
        return (
          <div
            key={conversation.id}
            className={cn(
              "group flex items-center gap-2 rounded-[11px] px-3 py-2.5 transition-colors",
              active ? "bg-[var(--surface2)]" : "hover:bg-[var(--surface2)]",
            )}
          >
            <button
              onClick={() => openConversation(conversation.id)}
              className="min-w-0 flex-1 text-left"
            >
              <p className="truncate text-[13.5px] font-medium text-[var(--text)]">
                {conversation.title || "Conversa sem título"}
              </p>
              <p className="text-[11.5px] text-[var(--text-sub)]">
                {formatRelativeTime(conversation.lastMessageAt)}
              </p>
            </button>

            {confirming ? (
              <div className="flex shrink-0 items-center gap-1">
                <button
                  onClick={() => setConfirmingId(null)}
                  className="rounded-[8px] px-2 py-1 text-[12px] text-[var(--text-sub)] hover:text-[var(--text)]"
                >
                  Manter
                </button>
                <button
                  onClick={() =>
                    remove.mutate(conversation.id, {
                      onSuccess: () => {
                        setConfirmingId(null);
                        if (active) startNewConversation();
                      },
                    })
                  }
                  disabled={remove.isPending}
                  className="rounded-[8px] px-2 py-1 text-[12px] font-semibold text-[var(--clay)] disabled:opacity-50"
                >
                  {remove.isPending ? <Loader2 size={12} className="animate-spin" /> : "Excluir"}
                </button>
              </div>
            ) : (
              <button
                onClick={() => setConfirmingId(conversation.id)}
                aria-label="Excluir conversa"
                title="Excluir conversa"
                className="text-text-muted shrink-0 rounded-[8px] p-1.5 opacity-0 transition-opacity group-hover:opacity-100 hover:text-[var(--clay)] focus-visible:opacity-100"
              >
                <Trash2 size={14} />
              </button>
            )}
          </div>
        );
      })}
    </div>
  );
}

function ChatView({ quotaReached, limit }: { quotaReached: boolean; limit: number }) {
  const { activeConversationId, setBlockedStatus, startNewConversation } = useAssistantStore();
  const conversation = useConversation(activeConversationId);
  const send = useSendMessage();
  const [draft, setDraft] = useState("");
  const [pendingText, setPendingText] = useState<string | null>(null);
  const [failed, setFailed] = useState<{ text: string; message: string } | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  const messages = conversation.data?.messages ?? [];

  // Follow the thread: every new message, the pending bubble and the typing indicator
  // land at the bottom.
  useEffect(() => {
    const el = scrollRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [messages.length, pendingText, failed]);

  const submit = (text: string) => {
    const message = text.trim();
    if (!message || send.isPending || quotaReached) return;

    setFailed(null);
    setBlockedStatus(null);
    setPendingText(message);
    setDraft("");

    send.mutate(
      { conversationId: activeConversationId, message },
      {
        onSuccess: (response) => {
          setPendingText(null);
          // Nothing was stored — the draft goes back so it is not lost. The hook has
          // already recorded the status the drawer renders.
          if (response.status !== "Available") setDraft(message);
        },
        onError: (err) => {
          setPendingText(null);
          const status = (err as { response?: { status?: number } })?.response?.status;
          if (status === 404) {
            // The conversation is gone (deleted elsewhere): continue in a fresh one.
            startNewConversation();
          }
          setFailed({
            text: message,
            message: getApiErrorMessage(err, "Não foi possível enviar sua mensagem."),
          });
        },
      },
    );
  };

  /** The user message an error answer replied to — what "Tentar novamente" resends. */
  const previousUserText = (index: number): string | null => {
    for (let i = index - 1; i >= 0; i--) {
      if (messages[i].role === "User") return messages[i].content;
    }
    return null;
  };

  const isEmpty = messages.length === 0 && !pendingText && !conversation.isLoading;

  return (
    <>
      <div ref={scrollRef} className="flex flex-1 flex-col gap-4 overflow-y-auto px-5 py-5">
        {conversation.isLoading && (
          <div className="flex flex-1 items-center justify-center">
            <Loader2 size={18} className="animate-spin text-[var(--brand-accent)]" />
          </div>
        )}

        {conversation.isError && (
          <div className="flex flex-1 flex-col items-center justify-center gap-3 text-center">
            <p className="text-[13px] text-[var(--text-sub)]">Não foi possível abrir esta conversa.</p>
            <RetryButton onClick={() => conversation.refetch()} />
          </div>
        )}

        {isEmpty && !conversation.isError && (
          <EmptyState onPick={submit} disabled={quotaReached || send.isPending} />
        )}

        {messages.map((message, index) => (
          <MessageBubble
            key={message.id}
            message={message}
            conversationId={activeConversationId}
            onRetry={
              message.isError
                ? () => {
                    const text = previousUserText(index);
                    if (text) submit(text);
                  }
                : undefined
            }
            retryDisabled={send.isPending || quotaReached}
          />
        ))}

        {pendingText && (
          <>
            <UserBubble content={pendingText} />
            <TypingIndicator />
          </>
        )}

        {failed && (
          <div className="flex flex-col items-start gap-2 rounded-[13px] border border-dashed border-[var(--border-color)] px-3.5 py-3">
            <p className="text-[12.5px] text-[var(--text-sub)]">{failed.message}</p>
            <RetryButton onClick={() => submit(failed.text)} disabled={send.isPending || quotaReached} />
          </div>
        )}
      </div>

      <Composer
        value={draft}
        onChange={setDraft}
        onSubmit={() => submit(draft)}
        sending={send.isPending}
        quotaReached={quotaReached}
        limit={limit}
      />
    </>
  );
}

function EmptyState({ onPick, disabled }: { onPick: (text: string) => void; disabled: boolean }) {
  return (
    <div className="flex flex-1 flex-col justify-center gap-4">
      <div>
        <p className="font-display text-[17px] font-bold tracking-[-0.01em] text-[var(--text)]">
          Como posso ajudar?
        </p>
        <p className="mt-1 text-[12.5px] leading-relaxed text-[var(--text-sub)]">
          Eu consulto seus lançamentos, orçamentos, metas e investimentos. Para registrar algo,
          preparo a proposta e você confirma antes de salvar.
        </p>
      </div>
      <div className="flex flex-col gap-2">
        {EXAMPLE_PROMPTS.map((prompt) => (
          <button
            key={prompt}
            onClick={() => onPick(prompt)}
            disabled={disabled}
            className="border-border rounded-[11px] border bg-[var(--surface2)] px-3.5 py-2.5 text-left text-[13px] text-[var(--text)] transition-colors hover:border-[var(--brand-cobalt)] disabled:cursor-not-allowed disabled:opacity-50"
          >
            {prompt}
          </button>
        ))}
      </div>
    </div>
  );
}

function MessageBubble({
  message,
  conversationId,
  onRetry,
  retryDisabled,
}: {
  message: AiMessage;
  conversationId: number | null;
  onRetry?: () => void;
  retryDisabled: boolean;
}) {
  if (message.role === "User") return <UserBubble content={message.content} />;

  return (
    <div className="flex max-w-[92%] flex-col gap-2.5">
      <MessageContent
        content={message.content}
        className={cn(
          "text-[13.5px] leading-relaxed",
          message.isError ? "text-[var(--text-sub)] italic" : "text-[var(--text)]",
        )}
      />
      {message.isError && onRetry && <RetryButton onClick={onRetry} disabled={retryDisabled} />}
      {conversationId !== null &&
        message.actions.map((action) => (
          <ActionCard key={action.id} action={action} conversationId={conversationId} />
        ))}
    </div>
  );
}

function UserBubble({ content }: { content: string }) {
  return (
    <div
      className="ml-auto max-w-[85%] rounded-[14px] rounded-br-[5px] px-3.5 py-2.5 text-[13.5px] leading-relaxed whitespace-pre-wrap text-white"
      style={{ background: "var(--brand-cobalt)" }}
    >
      {content}
    </div>
  );
}

function TypingIndicator() {
  return (
    <div className="flex items-center gap-2 text-[12.5px] text-[var(--text-sub)]" aria-live="polite">
      <span className="flex gap-1">
        {[0, 1, 2].map((i) => (
          <span
            key={i}
            className="h-1.5 w-1.5 animate-bounce rounded-full bg-[var(--brand-accent)]"
            style={{ animationDelay: `${i * 150}ms` }}
          />
        ))}
      </span>
      Consultando seus dados…
    </div>
  );
}

function RetryButton({ onClick, disabled }: { onClick: () => void; disabled?: boolean }) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className="inline-flex items-center gap-1.5 font-mono text-[11px] tracking-[0.08em] text-[var(--brand-accent)] uppercase hover:underline disabled:opacity-50"
    >
      <RotateCcw size={11} />
      Tentar novamente
    </button>
  );
}

function Composer({
  value,
  onChange,
  onSubmit,
  sending,
  quotaReached,
  limit,
}: {
  value: string;
  onChange: (value: string) => void;
  onSubmit: () => void;
  sending: boolean;
  quotaReached: boolean;
  limit: number;
}) {
  const disabled = sending || quotaReached;
  const canSend = !disabled && value.trim().length > 0;

  return (
    <div className="border-border border-t px-4 py-3.5">
      {quotaReached && (
        <div className="mb-3 flex items-start gap-2 text-[12.5px] text-[var(--text-sub)]">
          <Gauge size={13} className="mt-[2px] shrink-0 text-[var(--gold)]" />
          <span>
            <span className="font-medium text-[var(--text)]">
              Você usou as {limit > 0 ? limit : "suas"} mensagens deste mês.
            </span>{" "}
            O limite renova no começo do próximo mês.
          </span>
        </div>
      )}

      <div className="border-border flex items-end gap-2 rounded-[14px] border bg-[var(--surface2)] px-3 py-2 focus-within:border-[var(--brand-cobalt)]">
        <textarea
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey && !e.nativeEvent.isComposing) {
              e.preventDefault();
              if (canSend) onSubmit();
            }
          }}
          maxLength={MAX_MESSAGE_LENGTH}
          rows={1}
          disabled={quotaReached}
          placeholder={quotaReached ? "Limite do mês atingido" : "Pergunte sobre suas finanças…"}
          aria-label="Mensagem"
          className="text-text placeholder:text-text-muted max-h-[140px] min-h-[24px] flex-1 resize-none bg-transparent py-1 text-[13.5px] leading-relaxed outline-none [field-sizing:content] disabled:cursor-not-allowed"
        />
        <button
          onClick={onSubmit}
          disabled={!canSend}
          aria-label="Enviar"
          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-[10px] text-white transition-opacity disabled:opacity-40"
          style={{ background: "var(--brand-cobalt)" }}
        >
          {sending ? <Loader2 size={15} className="animate-spin" /> : <ArrowUp size={15} />}
        </button>
      </div>

      <div className="mt-1.5 flex items-center justify-between gap-3 px-1">
        <span className="text-[10.5px] text-[var(--text-muted)]">
          Respostas geradas por IA podem conter erros. Não é recomendação de investimento.
        </span>
        <span
          className={cn(
            "shrink-0 font-mono text-[10.5px] tabular-nums",
            value.length >= MAX_MESSAGE_LENGTH ? "text-[var(--clay)]" : "text-[var(--text-muted)]",
          )}
        >
          {value.length}/{MAX_MESSAGE_LENGTH}
        </span>
      </div>
    </div>
  );
}

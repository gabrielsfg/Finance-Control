"use client";

import { useEffect, useRef, useState } from "react";
import { Check, Flag, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { useSubmitFeedback } from "../hooks/useFeedback";

/** Matches CreateFeedbackValidator on the API. */
const COMMENT_MAX = 2000;

/** How long the thank-you line stays before the form folds away. */
const THANKS_DURATION_MS = 2500;

type Target = { aiMessageId: number; aiInsightId?: never } | { aiInsightId: number; aiMessageId?: never };

/**
 * The "Reportar resposta" icon button shown next to an AI answer or analysis. Plain
 * `title` tooltip, like the other icon buttons in the app.
 */
export function ReportAiContentButton({
  active,
  reported,
  onClick,
  className,
}: {
  active: boolean;
  reported: boolean;
  onClick: () => void;
  className?: string;
}) {
  const label = reported ? "Resposta reportada" : "Reportar resposta";

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={reported}
      title={label}
      aria-label={label}
      aria-pressed={active}
      className={cn(
        "flex h-7 w-7 shrink-0 items-center justify-center rounded-[8px] transition-colors disabled:cursor-default",
        active
          ? "bg-[var(--surface2)] text-[var(--text)]"
          : "text-text-muted hover:bg-[var(--surface2)] hover:text-[var(--text)]",
        reported && "text-[var(--moss)] hover:bg-transparent hover:text-[var(--moss)]",
        className,
      )}
    >
      {reported ? <Check size={13} /> : <Flag size={13} />}
    </button>
  );
}

/**
 * Inline report form: an optional comment and a send button. Rendered inside the message
 * or the card, so it never stacks a second drawer over the assistant drawer.
 */
export function ReportAiContentForm({
  target,
  onClose,
  onReported,
}: {
  target: Target;
  onClose: () => void;
  onReported: () => void;
}) {
  const submit = useSubmitFeedback();
  const [comment, setComment] = useState("");
  const [sent, setSent] = useState(false);
  // Parents pass an inline callback; the timer must not restart on every re-render.
  const onCloseRef = useRef(onClose);
  useEffect(() => {
    onCloseRef.current = onClose;
  }, [onClose]);

  useEffect(() => {
    if (!sent) return;
    const timer = setTimeout(() => onCloseRef.current(), THANKS_DURATION_MS);
    return () => clearTimeout(timer);
  }, [sent]);

  if (sent) {
    return (
      <div
        role="status"
        className="flex items-center gap-2 rounded-[11px] bg-[color-mix(in_srgb,var(--moss)_10%,transparent)] px-3 py-2 text-[12.5px] text-[var(--text)]"
      >
        <Check size={13} className="text-[var(--moss)]" />
        Obrigado! Vamos analisar.
      </div>
    );
  }

  const send = () => {
    const description = comment.trim();
    submit.mutate(
      {
        type: "AiContent",
        title: "",
        description: description || undefined,
        source: "web",
        ...target,
      },
      {
        onSuccess: () => {
          setSent(true);
          onReported();
        },
      },
    );
  };

  return (
    <div className="border-border flex flex-col gap-2 rounded-[11px] border bg-[var(--surface2)] p-3">
      <label htmlFor="report-ai-comment" className="text-[12.5px] font-medium text-[var(--text)]">
        Reportar resposta
      </label>
      <textarea
        id="report-ai-comment"
        value={comment}
        onChange={(e) => setComment(e.target.value)}
        maxLength={COMMENT_MAX}
        rows={3}
        autoFocus
        placeholder="Conte o que está errado (opcional)"
        className="border-border bg-surface text-text placeholder:text-text-muted w-full resize-none rounded-[9px] border px-3 py-2 text-[13px] leading-relaxed outline-none focus:border-[var(--brand-cobalt)]"
      />
      {submit.isError && (
        <p className="text-[12px] text-[var(--clay)]">Não foi possível enviar agora. Tente novamente.</p>
      )}
      <div className="flex justify-end gap-2">
        <button
          type="button"
          onClick={onClose}
          className="rounded-[9px] px-3 py-1.5 text-[12.5px] text-[var(--text-sub)] hover:text-[var(--text)]"
        >
          Cancelar
        </button>
        <button
          type="button"
          onClick={send}
          disabled={submit.isPending}
          className="flex items-center gap-1.5 rounded-[9px] bg-[var(--brand-cobalt)] px-3 py-1.5 text-[12.5px] font-semibold text-white disabled:opacity-50"
        >
          {submit.isPending && <Loader2 size={12} className="animate-spin" />}
          Enviar
        </button>
      </div>
    </div>
  );
}

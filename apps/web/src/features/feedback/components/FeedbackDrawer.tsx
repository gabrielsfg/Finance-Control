"use client";

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod/v4";
import { Bug, Check, Lightbulb, Loader2, MessageSquarePlus, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { useSubmitFeedback } from "../hooks/useFeedback";
import type { FeedbackType } from "@/lib/types/feedback.types";

type Props = {
  open: boolean;
  onClose: () => void;
};

const TITLE_MAX = 120;
const DESCRIPTION_MAX = 2000;

// Mirrors CreateFeedbackValidator on the API, so the form never sends something
// the server will bounce.
const feedbackSchema = z.object({
  title: z
    .string()
    .trim()
    .min(3, "Escreva pelo menos 3 caracteres")
    .max(TITLE_MAX, `No máximo ${TITLE_MAX} caracteres`),
  description: z.string().trim().max(DESCRIPTION_MAX, `No máximo ${DESCRIPTION_MAX} caracteres`),
});

type FeedbackForm = z.infer<typeof feedbackSchema>;

const INPUT_CLASS =
  "border-border bg-surface2 text-text placeholder:text-text-muted w-full border outline-none focus:border-[var(--brand-cobalt)] rounded-[13px] px-3.5 text-[15px]";

const TYPE_OPTIONS: {
  value: FeedbackType;
  label: string;
  hint: string;
  Icon: typeof Bug;
  color: string;
}[] = [
  {
    value: "Bug",
    label: "Problema",
    hint: "Algo quebrou ou está errado",
    Icon: Bug,
    color: "var(--clay)",
  },
  {
    value: "Suggestion",
    label: "Sugestão",
    hint: "Uma ideia ou pedido",
    Icon: Lightbulb,
    color: "var(--gold)",
  },
];

export const FeedbackDrawer = ({ open, onClose }: Props) => {
  const [type, setType] = useState<FeedbackType>("Bug");
  const [sent, setSent] = useState(false);
  const submit = useSubmitFeedback();

  const {
    register,
    handleSubmit,
    reset,
    watch,
    formState: { errors },
  } = useForm<FeedbackForm>({
    resolver: zodResolver(feedbackSchema),
    defaultValues: { title: "", description: "" },
  });

  // A drawer that reopens showing the previous answer reads as if it failed to
  // send, so every open starts clean.
  useEffect(() => {
    if (!open) return;
    setType("Bug");
    setSent(false);
    submit.reset();
    reset({ title: "", description: "" });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [onClose]);

  if (!open) return null;

  const descriptionLength = watch("description")?.length ?? 0;

  const onSubmit = handleSubmit((values) => {
    submit.mutate(
      {
        type,
        title: values.title,
        description: values.description || undefined,
        source: "web",
      },
      { onSuccess: () => setSent(true) },
    );
  });

  return (
    <>
      <div
        className="anim-fade fixed inset-0 z-40 bg-black/40 backdrop-blur-[2px]"
        onClick={onClose}
      />

      <div
        role="dialog"
        aria-label="Enviar feedback"
        className="anim-drawer border-border bg-surface fixed inset-y-0 right-0 z-50 flex w-full max-w-[480px] flex-col border-l shadow-2xl"
      >
        <div className="border-border flex items-center justify-between border-b px-5 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-[9px] bg-[color-mix(in_srgb,var(--brand-cobalt)_12%,transparent)]">
              <MessageSquarePlus size={16} className="text-[var(--brand-accent)]" strokeWidth={1.75} />
            </div>
            <div>
              <h2 className="font-display text-text text-[15px] font-semibold">Fale com a gente</h2>
              <p className="text-text-muted text-[12px]">Relate um problema ou mande uma ideia</p>
            </div>
          </div>
          <button
            onClick={onClose}
            aria-label="Fechar"
            className="text-text-muted hover:text-text transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {sent ? (
          <div className="flex flex-1 flex-col items-center justify-center gap-3 px-8 text-center">
            <div className="bg-green/10 flex h-14 w-14 items-center justify-center rounded-full">
              <Check size={26} className="text-[var(--moss)]" strokeWidth={2.2} />
            </div>
            <h3 className="font-display text-text text-[17px] font-bold">Recebemos, obrigado!</h3>
            <p className="text-text-sub text-[13.5px] leading-relaxed">
              Lemos tudo o que chega por aqui. Se precisarmos de mais detalhes, entramos em
              contato pelo e-mail da sua conta.
            </p>
            <button
              onClick={onClose}
              className="mt-2 rounded-[13px] bg-[var(--brand-cobalt)] px-6 py-2.5 text-[14px] font-semibold text-white"
            >
              Fechar
            </button>
          </div>
        ) : (
          <form onSubmit={onSubmit} className="flex flex-1 flex-col gap-5 overflow-y-auto px-5 py-5">
            <div className="flex flex-col gap-1.5">
              <label className="text-text-sub text-[13px] font-medium">Sobre o que é?</label>
              <div className="grid grid-cols-2 gap-2.5">
                {TYPE_OPTIONS.map(({ value, label, hint, Icon, color }) => {
                  const active = type === value;
                  return (
                    <button
                      key={value}
                      type="button"
                      onClick={() => setType(value)}
                      aria-pressed={active}
                      className={cn(
                        "flex flex-col items-start gap-1 rounded-[13px] border px-3.5 py-3 text-left transition-colors",
                        active
                          ? "border-transparent"
                          : "border-border bg-surface2 hover:border-[var(--text-muted)]",
                      )}
                      style={
                        active
                          ? {
                              background: `color-mix(in srgb, ${color} 12%, transparent)`,
                              borderColor: `color-mix(in srgb, ${color} 45%, transparent)`,
                            }
                          : undefined
                      }
                    >
                      <Icon size={16} style={{ color: active ? color : "var(--text-sub)" }} />
                      <span
                        className="text-[14px] font-semibold"
                        style={{ color: active ? color : "var(--text)" }}
                      >
                        {label}
                      </span>
                      <span className="text-text-muted text-[11.5px] leading-tight">{hint}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="flex flex-col gap-1.5">
              <label htmlFor="feedback-title" className="text-text-sub text-[13px] font-medium">
                Resumo
              </label>
              <input
                id="feedback-title"
                {...register("title")}
                maxLength={TITLE_MAX}
                placeholder={
                  type === "Bug"
                    ? "Ex.: o saldo da conta não atualiza"
                    : "Ex.: queria filtrar o extrato por tag"
                }
                className={cn(INPUT_CLASS, "h-11")}
              />
              {errors.title && (
                <p className="text-[12px] text-[var(--clay)]">{errors.title.message}</p>
              )}
            </div>

            <div className="flex flex-col gap-1.5">
              <label htmlFor="feedback-description" className="text-text-sub text-[13px] font-medium">
                Detalhes <span className="text-text-muted font-normal">(opcional)</span>
              </label>
              <textarea
                id="feedback-description"
                {...register("description")}
                maxLength={DESCRIPTION_MAX}
                rows={7}
                placeholder={
                  type === "Bug"
                    ? "O que você estava fazendo, o que esperava e o que aconteceu."
                    : "Conte como isso ajudaria no seu dia a dia."
                }
                className={cn(INPUT_CLASS, "resize-none py-3 leading-relaxed")}
              />
              <div className="flex items-center justify-between">
                {errors.description ? (
                  <p className="text-[12px] text-[var(--clay)]">{errors.description.message}</p>
                ) : (
                  <span />
                )}
                <span className="text-text-muted font-mono text-[11px]">
                  {descriptionLength}/{DESCRIPTION_MAX}
                </span>
              </div>
            </div>

            {submit.isError && (
              <p className="text-[12.5px] text-[var(--clay)]">
                Não foi possível enviar agora. Tente novamente.
              </p>
            )}

            <div className="border-border mt-auto flex gap-2.5 border-t pt-4">
              <button
                type="button"
                onClick={onClose}
                className="border-border text-text flex-1 rounded-[13px] border px-4 py-2.5 text-[14px] font-semibold"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={submit.isPending}
                className="flex flex-1 items-center justify-center gap-2 rounded-[13px] bg-[var(--brand-cobalt)] px-4 py-2.5 text-[14px] font-semibold text-white disabled:opacity-50"
              >
                {submit.isPending && <Loader2 size={15} className="animate-spin" />}
                Enviar
              </button>
            </div>
          </form>
        )}
      </div>
    </>
  );
};

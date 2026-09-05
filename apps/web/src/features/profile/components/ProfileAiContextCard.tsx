"use client";

import { useState } from "react";
import { Loader2 } from "lucide-react";
import { Card, CardHead } from "@/components/shared/Card";
import { PremiumNotice } from "@/components/shared/PremiumNotice";
import { useAiContext, useUpsertAiContext } from "@/features/insights/hooks/useInsight";
import { usePlan } from "@/lib/hooks/usePlan";

/** Matches the API validator, so an over-long note is refused here instead of by a 400. */
const MAX_LENGTH = 500;

/**
 * A free-text note the weekly analysis is generated with — "estou de mudança", "esse mês
 * teve viagem" — so the model reads an unusual month as context rather than as a
 * deviation to flag.
 */
export const ProfileAiContextCard = () => {
  const { isPremium, isLoading: planLoading } = usePlan();
  const { data: context } = useAiContext(isPremium);
  const upsert = useUpsertAiContext();
  const [draft, setDraft] = useState<string | null>(null);

  if (planLoading) return null;

  if (!isPremium) {
    return (
      <Card>
        <CardHead title="Contexto para a IA" />
        <PremiumNotice
          preview={false}
          description="Conte o que está fora do comum no seu mês — mudança, viagem, um gasto único — e a análise semanal passa a ler isso como contexto em vez de apontar como desvio."
        />
      </Card>
    );
  }

  // The saved note is the value until the user starts typing; from then on the draft is,
  // so a refetch mid-edit cannot overwrite what is being written.
  const value = draft ?? context?.text ?? "";
  const isDirty = value.trim() !== (context?.text ?? "").trim();

  return (
    <Card>
      <CardHead
        title="Contexto para a IA"
        subtitle="Opcional — o que a análise semanal deve levar em conta"
      />

      <textarea
        value={value}
        maxLength={MAX_LENGTH}
        rows={4}
        onChange={(e) => setDraft(e.target.value)}
        placeholder="Ex.: mudei de casa em março, os gastos de reforma são pontuais."
        className="border-border bg-surface2 text-text placeholder:text-text-muted focus:border-green/60 w-full resize-none rounded-[13px] border px-3.5 py-2.5 text-[13.5px] outline-none"
      />

      <div className="mt-2 flex items-center justify-between gap-3">
        <span className="text-text-muted font-mono text-[11px] tabular-nums">
          {value.length}/{MAX_LENGTH}
        </span>
        <button
          onClick={() => upsert.mutate(value.trim(), { onSuccess: () => setDraft(null) })}
          disabled={!isDirty || value.trim().length === 0 || upsert.isPending}
          className="inline-flex items-center justify-center gap-2 rounded-[13px] px-[18px] py-2 text-[13.5px] font-semibold text-white transition-transform enabled:hover:-translate-y-[1px] disabled:cursor-not-allowed disabled:opacity-50"
          style={{ background: "var(--brand-cobalt)" }}
        >
          {upsert.isPending ? <Loader2 size={14} className="animate-spin" /> : "Salvar contexto"}
        </button>
      </div>
    </Card>
  );
};

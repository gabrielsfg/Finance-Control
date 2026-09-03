"use client";

import { Loader2, RefreshCw, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useRefreshSpendingInsight, useSpendingInsight } from "@/features/insights/hooks/useInsight";

const CARD_STYLE = {
  background:
    "linear-gradient(135deg, color-mix(in srgb, var(--brand-cobalt) 10%, transparent), color-mix(in srgb, var(--brand-cobalt) 4%, var(--surface)))",
  borderColor: "color-mix(in srgb, var(--brand-cobalt) 25%, var(--border-color))",
};

/**
 * The weekly spending analysis.
 *
 * Renders nothing at all when the API answers 204 — free plan, feature off, quota spent
 * or too little history. An empty card advertising a feature the account does not have
 * is worse than no card.
 */
export const AiInsightCard = () => {
  const { data: insight, isLoading } = useSpendingInsight();
  const refresh = useRefreshSpendingInsight();

  if (isLoading) {
    return (
      <div className="rounded-[20px] border p-[22px]" style={CARD_STYLE}>
        <Header />
        <div className="flex items-center gap-2 py-2 text-[13px] text-[var(--text-sub)]">
          <Loader2 size={14} className="animate-spin" />
          Analisando seus lançamentos...
        </div>
      </div>
    );
  }

  if (!insight) return null;

  return (
    <div className="rounded-[20px] border p-[22px]" style={CARD_STYLE}>
      <Header />

      <p className="font-display mb-2 text-[17px] font-bold tracking-[-0.01em] text-[var(--text)]">
        {insight.headline}
      </p>

      <div className="mb-4 flex flex-col gap-2">
        {insight.paragraphs.map((paragraph, index) => (
          <p key={index} className="text-[13px] leading-relaxed text-[var(--text-sub)]">
            {paragraph.text}
          </p>
        ))}
      </div>

      <div className="flex items-center justify-between gap-3">
        {/* Required on screen, not only in the terms: whoever reads this card has
            almost certainly not read the terms of use. */}
        <p className="text-[11px] leading-snug text-[var(--text-muted)]">
          {insight.generatedByAi
            ? "Análise gerada por inteligência artificial a partir dos dados que você cadastrou. É informativa, pode conter erros e não é recomendação de investimento."
            : "Resumo calculado a partir dos dados que você cadastrou. É informativo e não é recomendação de investimento."}
        </p>

        <Button
          size="sm"
          variant="outline"
          className="shrink-0 text-[11px]"
          onClick={() => refresh.mutate()}
          disabled={refresh.isPending}
          aria-label="Atualizar análise"
        >
          {refresh.isPending ? (
            <Loader2 size={12} className="animate-spin" />
          ) : (
            <RefreshCw size={12} />
          )}
        </Button>
      </div>
    </div>
  );
};

const Header = () => (
  <div className="mb-4 flex items-center gap-[10px]">
    <div
      className="flex h-7 w-7 items-center justify-center rounded-[8px]"
      style={{ backgroundColor: "color-mix(in srgb, var(--brand-cobalt) 15%, transparent)" }}
    >
      <Zap size={14} style={{ color: "var(--brand-accent)" }} />
    </div>
    <span className="font-mono text-[11px] tracking-[0.1em] uppercase text-[var(--brand-accent)]">
      Insight da IA
    </span>
  </div>
);

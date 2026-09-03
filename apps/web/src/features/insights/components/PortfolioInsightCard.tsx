"use client";

import { Loader2, Zap } from "lucide-react";
import { usePortfolioInsight } from "../hooks/useInsight";

const CARD_STYLE = {
  background:
    "linear-gradient(135deg, color-mix(in srgb, var(--brand-cobalt) 10%, transparent), color-mix(in srgb, var(--brand-cobalt) 4%, var(--surface)))",
  borderColor: "color-mix(in srgb, var(--brand-cobalt) 25%, var(--border-color))",
};

/**
 * The descriptive portfolio analysis: weights, concentration, observed oscillation and
 * how the composition compares with the declared profile.
 *
 * Renders nothing when the API answers 204. Besides the usual reasons, that also covers
 * prices being too old — a portfolio analysis narrated over stale quotes is worse than
 * no analysis, so the server refuses rather than dressing it up.
 */
export const PortfolioInsightCard = () => {
  const { data: insight, isLoading } = usePortfolioInsight();

  if (isLoading) {
    return (
      <div className="rounded-[20px] border p-[22px]" style={CARD_STYLE}>
        <div className="flex items-center gap-2 text-[13px] text-[var(--text-sub)]">
          <Loader2 size={14} className="animate-spin" />
          Analisando sua carteira...
        </div>
      </div>
    );
  }

  if (!insight) return null;

  return (
    <div className="rounded-[20px] border p-[22px]" style={CARD_STYLE}>
      <div className="mb-4 flex items-center gap-[10px]">
        <div
          className="flex h-7 w-7 items-center justify-center rounded-[8px]"
          style={{ backgroundColor: "color-mix(in srgb, var(--brand-cobalt) 15%, transparent)" }}
        >
          <Zap size={14} style={{ color: "var(--brand-accent)" }} />
        </div>
        <span className="font-mono text-[11px] tracking-[0.1em] uppercase text-[var(--brand-accent)]">
          Retrato da carteira
        </span>
      </div>

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

      <p className="text-[11px] leading-snug text-[var(--text-muted)]">
        {insight.generatedByAi
          ? "Análise gerada por inteligência artificial a partir dos ativos que você cadastrou. É informativa, pode conter erros e não é recomendação de investimento."
          : "Resumo calculado a partir dos ativos que você cadastrou. É informativo e não é recomendação de investimento."}
      </p>
    </div>
  );
};

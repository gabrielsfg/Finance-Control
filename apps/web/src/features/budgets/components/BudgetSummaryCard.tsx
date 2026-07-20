"use client";

import { Card, CardHead, LedgerRule } from "@/components/shared/Card";
import type { Budget } from "@/lib/types/budgets.types";

type Tone = "ok" | "soon" | "due";
const TONE: Record<Tone, { bg: string; color: string; label: string }> = {
  ok:   { bg: "color-mix(in srgb, var(--moss) 15%, transparent)", color: "var(--moss)", label: "ok" },
  soon: { bg: "color-mix(in srgb, var(--gold) 18%, transparent)", color: "var(--gold)", label: "alerta" },
  due:  { bg: "color-mix(in srgb, var(--clay) 14%, transparent)", color: "var(--clay)", label: "excedido" },
};

function StatusRow({ label, count, tone }: { label: string; count: number; tone: Tone }) {
  const t = TONE[tone];
  return (
    <div className="flex items-center justify-between">
      <span className="text-[13.5px] font-medium text-[var(--text)]">{label}</span>
      <span className="flex items-center gap-2">
        <span className="font-mono text-[14px] font-semibold tabular-nums text-[var(--text)]">{count}</span>
        <span
          className="inline-block rounded-full px-[9px] py-[3px] font-mono text-[10.5px] uppercase tracking-[0.06em]"
          style={{ background: t.bg, color: t.color }}
        >
          {t.label}
        </span>
      </span>
    </div>
  );
}

function listNames(names: string[]): string {
  const uniq = Array.from(new Set(names));
  if (uniq.length === 0) return "";
  if (uniq.length === 1) return uniq[0];
  if (uniq.length === 2) return `${uniq[0]} e ${uniq[1]}`;
  return `${uniq.slice(0, 2).join(", ")} e mais ${uniq.length - 2}`;
}

export function BudgetSummaryCard({ budget }: { budget: Budget }) {
  const expense = (budget.allocations ?? []).filter((a) => a.allocationType === "Expense" && a.allocated > 0);

  const totalAllocated = expense.reduce((s, a) => s + a.allocated, 0);
  const totalSpent = expense.reduce((s, a) => s + a.spent, 0);
  const pct = totalAllocated > 0 ? (totalSpent / totalAllocated) * 100 : 0;

  const exceeded = expense.filter((a) => a.spentPercentage > 100);
  const attention = expense.filter((a) => a.spentPercentage > 80 && a.spentPercentage <= 100);
  const onTrack = expense.filter((a) => a.spentPercentage <= 80);

  const exceededNames = listNames(exceeded.map((a) => a.categoryName));
  const attentionNames = listNames(attention.map((a) => a.categoryName));

  let sentence: React.ReactNode;
  if (expense.length === 0) {
    sentence = "Defina valores nas subcategorias para acompanhar o uso do orçamento.";
  } else if (exceeded.length === 0 && attention.length === 0) {
    sentence = "Tudo dentro do orçamento — continue assim.";
  } else {
    sentence = (
      <>
        {attention.length > 0 && (
          <>
            <b className="font-semibold text-[var(--text)]">{attentionNames}</b>{" "}
            {attention.length > 1 ? "estão" : "está"} perto do limite.{" "}
          </>
        )}
        {exceeded.length > 0 && (
          <>
            <b className="font-semibold text-[var(--clay)]">{exceededNames}</b>{" "}
            {exceeded.length > 1 ? "ultrapassaram" : "ultrapassou"} o teto — revise os lançamentos ou ajuste o limite.
          </>
        )}
      </>
    );
  }

  return (
    <Card className="flex flex-col">
      <CardHead title="Resumo do orçamento" />

      <div className="text-center">
        <div
          className="font-mono font-semibold tracking-[-0.03em] text-[var(--brand-accent)]"
          style={{ fontSize: "clamp(36px, 4vw, 48px)", lineHeight: 1 }}
        >
          {pct.toFixed(0)}%
        </div>
        <div className="mt-1 text-[13px] text-[var(--text-sub)]">do orçamento usado</div>
      </div>

      <LedgerRule />

      <div className="flex flex-col gap-2.5">
        <StatusRow label="No prazo" count={onTrack.length} tone="ok" />
        <StatusRow label="Atenção" count={attention.length} tone="soon" />
        <StatusRow label="Estourado" count={exceeded.length} tone="due" />
      </div>

      <p className="mt-4 text-[13px] leading-relaxed text-[var(--text-sub)]">{sentence}</p>
    </Card>
  );
}

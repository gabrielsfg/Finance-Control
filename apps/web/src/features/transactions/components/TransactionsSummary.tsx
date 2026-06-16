"use client";

import { ArrowUpRight, ArrowDownRight, TrendingUp, TrendingDown } from "lucide-react";
import { formatCurrency } from "@/lib/utils/formatCurrency";

type Props = {
  totalIncome: number;
  totalExpense: number;
  balance: number;
  previousTotalIncome?: number;
  previousTotalExpense?: number;
  previousBalance?: number;
};

function pctChange(current: number, previous: number | undefined): number | undefined {
  if (previous === undefined || previous === 0) return undefined;
  return ((current - previous) / Math.abs(previous)) * 100;
}

function ChangeChip({ pct, lowerIsBetter = false }: { pct: number; lowerIsBetter?: boolean }) {
  const positive = lowerIsBetter ? pct < 0 : pct > 0;
  return (
    <span
      className="inline-flex items-center gap-[5px] rounded-full px-[9px] py-[3px] font-mono text-[12px] font-medium"
      style={{
        background: positive ? "rgba(95,198,160,0.18)" : "rgba(196,93,88,0.18)",
        color: positive ? "var(--moss-lift)" : "var(--clay-lift)",
      }}
    >
      {positive ? <ArrowUpRight size={11} strokeWidth={2.4} /> : <ArrowDownRight size={11} strokeWidth={2.4} />}
      {Math.abs(pct).toFixed(1)}%
    </span>
  );
}

export const TransactionsSummary = ({
  totalIncome,
  totalExpense,
  balance,
  previousTotalIncome,
  previousTotalExpense,
  previousBalance,
}: Props) => {
  const incomePct  = pctChange(totalIncome, previousTotalIncome);
  const expensePct = pctChange(totalExpense, previousTotalExpense);
  const balancePct = pctChange(balance, previousBalance);

  const segments = [
    {
      label: "Receitas",
      value: totalIncome / 100,
      pct: incomePct,
      lowerIsBetter: false,
      color: "var(--moss-lift)",
      icon: TrendingUp,
      borderRight: true,
    },
    {
      label: "Despesas",
      value: totalExpense / 100,
      pct: expensePct,
      lowerIsBetter: true,
      color: "var(--clay-lift)",
      icon: TrendingDown,
      borderRight: true,
    },
    {
      label: "Saldo",
      value: balance / 100,
      pct: balancePct,
      lowerIsBetter: false,
      color: balance >= 0 ? "var(--moss-lift)" : "var(--clay-lift)",
      icon: balance >= 0 ? TrendingUp : TrendingDown,
      borderRight: false,
    },
  ];

  return (
    <section
      className="overflow-hidden rounded-[26px]"
      style={{
        background: "radial-gradient(120% 140% at 8% 0%, var(--panel-2), var(--panel) 60%)",
        boxShadow: "var(--shadow-md)",
        color: "var(--panel-foreground)",
      }}
    >
      <div className="grid grid-cols-3">
        {segments.map((seg) => (
          <div
            key={seg.label}
            className="px-[26px] py-[22px]"
            style={seg.borderRight ? { borderRight: "1px solid rgba(255,255,255,0.1)" } : undefined}
          >
            <div
              className="font-mono text-[11px] uppercase tracking-[0.18em] mb-[10px]"
              style={{ color: "var(--panel-muted)" }}
            >
              {seg.label}
            </div>
            <div
              className="font-money font-semibold leading-[1.1]"
              style={{ fontSize: "clamp(20px,2.2vw,28px)", color: seg.color }}
            >
              {formatCurrency(Math.abs(seg.value))}
            </div>
            {seg.pct !== undefined && (
              <div className="mt-[8px]">
                <ChangeChip pct={seg.pct} lowerIsBetter={seg.lowerIsBetter} />
              </div>
            )}
          </div>
        ))}
      </div>
    </section>
  );
};

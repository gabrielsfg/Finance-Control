"use client";

import { TrendingUp, TrendingDown, Calendar, AlertTriangle } from "lucide-react";
import { Card } from "@/components/shared/Card";
import { formatCurrency } from "@/lib/utils/formatCurrency";
import type { AnalyticsSummaryResponse } from "@/lib/types/analytics.types";

type Props = { summary: AnalyticsSummaryResponse };

export const AnalyticsSummaryCards = ({ summary }: Props) => {
  const items = [
    {
      label: "Receita Média Mensal",
      value: formatCurrency(summary.avgMonthlyIncome / 100),
      sub: null,
      subColor: undefined,
      icon: TrendingUp,
      color: "var(--moss)",
    },
    {
      label: "Despesa Média Mensal",
      value: formatCurrency(summary.avgMonthlyExpense / 100),
      sub: null,
      subColor: undefined,
      icon: TrendingDown,
      color: "var(--clay)",
    },
    {
      label: "Melhor Mês",
      value: summary.bestMonth.label,
      sub: `Saldo ${summary.bestMonth.balance < 0 ? "-" : ""}${formatCurrency(Math.abs(summary.bestMonth.balance) / 100)}`,
      subColor: summary.bestMonth.balance < 0 ? "var(--clay)" : "var(--text)",
      icon: Calendar,
      color: "var(--brand-cobalt)",
    },
    {
      label: "Pior Mês",
      value: summary.worstMonth.label,
      sub: `Saldo ${summary.worstMonth.balance < 0 ? "-" : ""}${formatCurrency(Math.abs(summary.worstMonth.balance) / 100)}`,
      subColor: summary.worstMonth.balance < 0 ? "var(--clay)" : "var(--text)",
      icon: AlertTriangle,
      color: "var(--gold)",
    },
  ];

  return (
    <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
      {items.map(({ label, value, sub, subColor, icon: Icon, color }) => (
        <Card key={label}>
          <div
            className="mb-3 flex h-9 w-9 items-center justify-center rounded-[13px]"
            style={{ backgroundColor: `color-mix(in srgb, ${color} 14%, transparent)` }}
          >
            <Icon size={18} style={{ color }} strokeWidth={1.75} />
          </div>
          <p className="font-display text-[16px] font-bold text-[var(--text)]">{value}</p>
          <p className="mt-0.5 text-[12px] text-[var(--text-sub)]">{label}</p>
          {sub && (
            <p className="mt-0.5 font-mono text-[12px] tabular-nums" style={{ color: subColor }}>
              {sub}
            </p>
          )}
        </Card>
      ))}
    </div>
  );
};

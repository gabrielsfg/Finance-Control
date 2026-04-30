"use client";

import { TrendingUp, TrendingDown, Calendar, AlertTriangle } from "lucide-react";
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
      color: "var(--green)",
      bg: "bg-green/10",
    },
    {
      label: "Despesa Média Mensal",
      value: formatCurrency(summary.avgMonthlyExpense / 100),
      sub: null,
      subColor: undefined,
      icon: TrendingDown,
      color: "var(--red)",
      bg: "bg-red/10",
    },
    {
      label: "Melhor Mês",
      value: summary.bestMonth.label,
      sub: `Saldo ${formatCurrency(summary.bestMonth.balance / 100)}`,
      subColor: "var(--green)",
      icon: Calendar,
      color: "var(--blue)",
      bg: "bg-blue/10",
    },
    {
      label: "Pior Mês",
      value: summary.worstMonth.label,
      sub: `Saldo ${formatCurrency(summary.worstMonth.balance / 100)}`,
      subColor: "var(--orange)",
      icon: AlertTriangle,
      color: "var(--orange)",
      bg: "bg-orange/10",
    },
  ];

  return (
    <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
      {items.map(({ label, value, sub, subColor, icon: Icon, color, bg }) => (
        <div key={label} className="border-border bg-surface rounded-xl border p-5">
          <div className={`mb-3 flex h-9 w-9 items-center justify-center rounded-[10px] ${bg}`}>
            <Icon size={18} style={{ color }} strokeWidth={1.75} />
          </div>
          <p className="font-display font-700 text-text text-[16px]">{value}</p>
          <p className="text-text-muted mt-0.5 text-[12px]">{label}</p>
          {sub && (
            <p className="font-money mt-0.5 text-[12px]" style={{ color: subColor }}>
              {sub}
            </p>
          )}
        </div>
      ))}
    </div>
  );
};

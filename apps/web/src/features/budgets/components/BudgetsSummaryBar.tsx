"use client";

import { formatCurrency } from "@/lib/utils/formatCurrency";
import { ProgressBar } from "@/components/shared/ProgressBar";
import { cn } from "@/lib/utils";
import type { Budget } from "@/lib/types/budgets.types";

type Props = {
  budgets: Budget[];
  daysInPeriod?: number;
  dayOfPeriod?: number;
};

export const BudgetsSummaryBar = ({ budgets, daysInPeriod, dayOfPeriod }: Props) => {
  const active = budgets.filter((b) => b.isActive);
  const totalAllocated = active.reduce((s, b) => s + b.totalAllocated, 0);
  const totalSpent     = active.reduce((s, b) => s + b.totalSpent,     0);
  const available      = active.reduce((s, b) => s + b.available,      0);
  const pct            = totalAllocated > 0 ? (totalSpent / totalAllocated) * 100 : 0;
  const isOver         = totalSpent > totalAllocated;

  const now       = new Date();
  const dim       = daysInPeriod ?? new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
  const dom       = dayOfPeriod  ?? now.getDate();
  const daysLeft  = Math.max(0, dim - dom);

  // projected overspend
  const dailyRate    = dom > 0 ? totalSpent / dom : 0;
  const projected    = dailyRate * dim;
  const willExceed   = projected > totalAllocated && totalAllocated > 0;

  const kpis = [
    { label: "Orçamento Total",   value: formatCurrency(totalAllocated / 100),      color: "text-text" },
    { label: "Gasto",             value: formatCurrency(totalSpent / 100),           color: isOver ? "text-red" : "text-text" },
    { label: "Disponível",        value: formatCurrency(Math.abs(available) / 100),  color: available < 0 ? "text-red" : "text-green" },
    { label: "Dias Restantes",    value: String(daysLeft),                           color: "text-text" },
  ];

  return (
    <div
      className="border-border rounded-[16px] border px-8 py-6"
      style={{ background: "linear-gradient(135deg, var(--surface) 0%, var(--surface2) 100%)" }}
    >
      {/* 4 KPIs */}
      <div className="mb-5 grid grid-cols-2 gap-4 sm:grid-cols-4">
        {kpis.map(({ label, value, color }) => (
          <div key={label}>
            <p className="text-text-muted mb-1 text-[11px] tracking-[0.06em] uppercase">{label}</p>
            <p className={cn("font-money font-600 text-[22px] tracking-tight", color)}>{value}</p>
          </div>
        ))}
      </div>

      {/* Progress bar */}
      <ProgressBar value={totalSpent} max={totalAllocated} height={6} />

      {/* Projection warning */}
      <div className="mt-2 flex items-center justify-between">
        <span className="text-text-muted text-[12px]">
          {pct.toFixed(1)}% do orçamento utilizado
        </span>
        {willExceed && (
          <span className="text-orange text-[12px] font-medium">
            No ritmo atual, você vai estourar o orçamento em ~{Math.round(((totalAllocated - totalSpent) / dailyRate))} dias
          </span>
        )}
        {!willExceed && available >= 0 && (
          <span className="text-green text-[12px]">
            Restam {formatCurrency(available / 100)}
          </span>
        )}
        {isOver && (
          <span className="text-red text-[12px] font-medium">
            Estourado em {formatCurrency(Math.abs(totalAllocated - totalSpent) / 100)}
          </span>
        )}
      </div>
    </div>
  );
};

"use client";

import { SectionHeader } from "@/components/shared/SectionHeader";
import { ProgressBar } from "@/components/shared/ProgressBar";
import { formatCurrency } from "@/lib/utils/formatCurrency";
import { formatPercent } from "@/lib/utils/formatNumber";
import { cn } from "@/lib/utils";
import type { CategoryBreakdownResult } from "@/lib/types/analytics.types";

type Props = { data: CategoryBreakdownResult };

export const AnalyticsCategoryBreakdown = ({ data }: Props) => {
  const { maxSpent, items } = data;

  return (
    <div className="border-border bg-surface flex flex-col rounded-xl border p-5">
      <SectionHeader title="Gastos por Categoria" subtitle="Mês atual" />
      <div className="flex flex-col gap-4">
        {items.map((cat) => (
          <div key={cat.categoryName}>
            <div className="mb-1.5 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="h-2.5 w-2.5 rounded-[2px]" style={{ backgroundColor: cat.color ?? "var(--text-muted)" }} />
                <span className="text-text text-[14px] font-medium">{cat.categoryName}</span>
              </div>
              <div className="flex items-center gap-3">
                <span className="font-money text-text text-[14px]">
                  {formatCurrency(cat.totalSpent / 100)}
                </span>
                <span className={cn(
                  "w-14 text-right font-mono text-[12px]",
                  cat.change == null ? "text-text-muted" : cat.change > 0 ? "text-red" : cat.change < 0 ? "text-green" : "text-text-muted",
                )}>
                  {cat.change != null && cat.change !== 0 ? formatPercent(cat.change) : "—"}
                </span>
              </div>
            </div>
            <ProgressBar value={cat.totalSpent} max={maxSpent} height={5} color={cat.color} />
            <p className="text-text-muted mt-0.5 text-right text-[11px]">{cat.percent.toFixed(1)}% do total</p>
          </div>
        ))}
      </div>
    </div>
  );
};

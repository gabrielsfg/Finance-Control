"use client";

import { SectionHeader } from "@/components/shared/SectionHeader";
import { formatCurrency } from "@/lib/utils/formatCurrency";
import { cn } from "@/lib/utils";
import type { CategoryProjection } from "@/lib/types/analytics.types";

function barColor(spentPercent: number): string {
  if (spentPercent > 100) return "var(--red)";
  if (spentPercent >= 80) return "var(--orange)";
  return "var(--green)";
}

function barBg(spentPercent: number): string {
  if (spentPercent > 100) return "bg-red/10";
  if (spentPercent >= 80) return "bg-orange/10";
  return "bg-green/10";
}

type Props = { data: CategoryProjection[] };

export function ProjectedSpendingHeatmap({ data }: Props) {
  const totalSpent     = data.reduce((s, c) => s + c.spentSoFar, 0);
  const totalProjected = data.reduce((s, c) => s + c.projectedTotal, 0);
  const overBudgetCount = data.filter((c) => c.spentPercent > 100).length;
  const monthElapsed   = data[0]?.monthElapsedPercent ?? 0;

  return (
    <div className="border-border bg-surface flex flex-col rounded-xl border p-5">
      <SectionHeader
        title="Projeção de Gastos por Categoria"
        subtitle={`${monthElapsed.toFixed(0)}% do mês decorrido — projeção baseada nos últimos 3 meses`}
      />

      {/* Summary cards */}
      <div className="bg-surface2 mb-5 grid grid-cols-2 gap-3 rounded-xl p-4">
        <div>
          <p className="text-text-muted text-[12px]">Gasto até agora</p>
          <p className="font-money font-600 text-text text-[18px]">
            {formatCurrency(totalSpent / 100)}
          </p>
        </div>
        <div>
          <p className="text-text-muted text-[12px]">Projeção total do mês</p>
          <p className="font-money font-600 text-orange text-[18px]">
            {formatCurrency(totalProjected / 100)}
          </p>
          {overBudgetCount > 0 && (
            <p className="text-red mt-0.5 text-[11px]">
              {overBudgetCount} categoria{overBudgetCount > 1 ? "s" : ""} acima da média
            </p>
          )}
        </div>
      </div>

      {/* Category rows */}
      <div className="flex flex-col gap-3">
        {data.map((cat) => {
          const pct      = Math.min(cat.spentPercent, 140);
          const color    = barColor(cat.spentPercent);
          const bgClass  = barBg(cat.spentPercent);

          return (
            <div key={cat.categoryId} className={cn("rounded-xl border border-border p-4", bgClass.replace("/10", "/5"))}>
              <div className="mb-2 flex items-center justify-between">
                <span className="text-text text-[14px] font-medium">{cat.categoryName}</span>
                <span
                  className="font-mono text-[12px] font-medium"
                  style={{ color }}
                >
                  {cat.spentPercent.toFixed(0)}%
                </span>
              </div>

              {/* Progress bar */}
              <div className="bg-surface2 mb-2.5 h-2 w-full overflow-hidden rounded-full">
                <div
                  className="h-full rounded-full transition-all"
                  style={{ width: `${pct}%`, backgroundColor: color }}
                />
              </div>

              <div className="grid grid-cols-3 gap-2 text-[11px]">
                <div>
                  <p className="text-text-muted">Gasto até agora</p>
                  <p className="font-money text-text-sub">{formatCurrency(cat.spentSoFar / 100)}</p>
                </div>
                <div>
                  <p className="text-text-muted">Projeção</p>
                  <p className="font-money font-medium" style={{ color }}>
                    {formatCurrency(cat.projectedTotal / 100)}
                  </p>
                </div>
                <div>
                  <p className="text-text-muted">Média histórica</p>
                  <p className="font-money text-text-sub">{formatCurrency(cat.historicalMonthlyAvg / 100)}</p>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

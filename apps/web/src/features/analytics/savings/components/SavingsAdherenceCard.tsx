"use client";

import { SectionHeader } from "@/components/shared/SectionHeader";
import { ChartEmptyState } from "@/components/shared/ChartEmptyState";
import { formatCurrency } from "@/lib/utils/index";
import { getCategoryColor } from "@/lib/config/categoryColors";
import type { SavingsDetailResponse } from "@/lib/types/analytics.types";

function scoreColor(rate: number): string {
  if (rate >= 80) return "var(--green)";
  if (rate >= 50) return "var(--orange)";
  return "var(--red)";
}

type Props = { detail: SavingsDetailResponse };

export function SavingsAdherenceCard({ detail }: Props) {
  const { allocations, allocationsTotal, allocationsWithinLimit, adherenceRate } = detail;

  return (
    <div className="border-border bg-surface flex flex-col rounded-xl border p-5">
      <SectionHeader
        title="Aderência ao Orçamento"
        subtitle="Categorias que ficaram dentro do limite planejado"
      />

      {allocationsTotal === 0 || adherenceRate === null ? (
        <ChartEmptyState message="Nenhuma alocação de despesa no orçamento" />
      ) : (
        <>
          <div className="bg-surface2 mb-4 flex items-center justify-between rounded-xl p-4">
            <div>
              <p className="font-money font-600 text-[22px]" style={{ color: scoreColor(adherenceRate) }}>
                {allocationsWithinLimit}/{allocationsTotal}
              </p>
              <p className="text-text-muted text-[12px]">categorias dentro do limite</p>
            </div>
            <p className="font-money font-600 text-[18px]" style={{ color: scoreColor(adherenceRate) }}>
              {adherenceRate.toFixed(0)}%
            </p>
          </div>

          <div className="flex max-h-[300px] flex-col gap-3 overflow-y-auto pr-1">
            {allocations.map((al) => {
              const within = al.spent <= al.allocated;
              const pct = al.allocated > 0 ? Math.min(al.spent / al.allocated, 1) : 1;
              const color = getCategoryColor(al.categoryColor, al.categoryName);
              return (
                <div key={`${al.areaName}-${al.subCategoryId}`}>
                  <div className="mb-1 flex items-center justify-between gap-2">
                    <div className="flex min-w-0 items-center gap-1.5">
                      {al.subCategoryEmoji ? (
                        <span className="text-[13px]">{al.subCategoryEmoji}</span>
                      ) : (
                        <span className="h-2 w-2 shrink-0 rounded-full opacity-60" style={{ backgroundColor: color }} />
                      )}
                      <span className="text-text truncate text-[13px]">{al.subCategoryName}</span>
                      <span className="text-text-muted shrink-0 text-[11px]">{al.areaName}</span>
                    </div>
                    <span className="font-money shrink-0 text-[12px]" style={{ color: within ? "var(--text-sub)" : "var(--red)" }}>
                      {formatCurrency(al.spent / 100)} / {formatCurrency(al.allocated / 100)}
                    </span>
                  </div>
                  <div className="bg-surface2 h-1.5 w-full overflow-hidden rounded-full">
                    <div
                      className="h-full rounded-full"
                      style={{
                        width: `${pct * 100}%`,
                        backgroundColor: within ? "var(--green)" : "var(--red)",
                      }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}

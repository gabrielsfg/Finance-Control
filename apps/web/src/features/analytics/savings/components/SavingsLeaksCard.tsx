"use client";

import { CheckCircle2 } from "lucide-react";
import { SectionHeader } from "@/components/shared/SectionHeader";
import { formatCurrency } from "@/lib/utils/index";
import { getCategoryColor } from "@/lib/config/categoryColors";
import type { SavingsDetailResponse } from "@/lib/types/analytics.types";

type Props = { detail: SavingsDetailResponse };

export function SavingsLeaksCard({ detail }: Props) {
  // API sends allocations sorted by overage descending
  const leaks = detail.allocations.filter((al) => al.spent > al.allocated).slice(0, 5);

  return (
    <div className="border-border bg-surface flex flex-col rounded-xl border p-5">
      <SectionHeader
        title="Maiores Vazamentos"
        subtitle="Os estouros que mais custaram à sua economia no período"
      />

      {leaks.length === 0 ? (
        <div className="flex flex-1 flex-col items-center justify-center gap-2 py-8">
          <CheckCircle2 size={32} className="text-green opacity-70" />
          <p className="text-text-muted text-[13px]">Nenhum estouro neste período</p>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {leaks.map((al, i) => {
            const overage = al.spent - al.allocated;
            const ppImpact = detail.income > 0 ? (overage / detail.income) * 100 : null;
            const color = getCategoryColor(al.categoryColor, al.categoryName);
            return (
              <div
                key={`${al.areaName}-${al.subCategoryId}`}
                className="border-border bg-surface2 flex items-center justify-between gap-3 rounded-xl border p-3"
              >
                <div className="flex min-w-0 items-center gap-2.5">
                  <span className="text-text-muted font-mono w-4 shrink-0 text-[12px]">{i + 1}</span>
                  {al.subCategoryEmoji ? (
                    <span className="text-[15px]">{al.subCategoryEmoji}</span>
                  ) : (
                    <span className="h-2.5 w-2.5 shrink-0 rounded-full opacity-60" style={{ backgroundColor: color }} />
                  )}
                  <div className="min-w-0">
                    <p className="text-text truncate text-[13px]">{al.subCategoryName}</p>
                    <p className="text-text-muted text-[11px]">
                      {formatCurrency(al.spent / 100)} de {formatCurrency(al.allocated / 100)} planejados
                    </p>
                  </div>
                </div>
                <div className="shrink-0 text-right">
                  <p className="font-money text-red text-[13px]">{formatCurrency(overage / 100)} acima</p>
                  {ppImpact !== null && (
                    <p className="text-text-muted text-[11px]">
                      {ppImpact.toFixed(1).replace(".", ",")}pp da sua taxa
                    </p>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

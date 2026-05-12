"use client";

import { Pencil, Layers } from "lucide-react";
import { cn } from "@/lib/utils";
import { formatCurrency } from "@/lib/utils/formatCurrency";
import { getCategoryColor } from "@/lib/config/categoryColors";
import type { InstallmentItem } from "@/lib/types/recurrences.types";

type Props = {
  items: InstallmentItem[];
  totalMonthly: number;
  totalRemaining: number;
  onView: (item: InstallmentItem) => void;
  onEdit: (item: InstallmentItem) => void;
};

export function InstallmentList({ items, totalMonthly, totalRemaining, onView, onEdit }: Props) {
  if (items.length === 0) {
    return (
      <div className="border-border bg-surface flex flex-col items-center justify-center rounded-xl border py-12 text-center">
        <div className="bg-surface2 mb-3 flex h-10 w-10 items-center justify-center rounded-[10px]">
          <Layers size={18} className="text-text-muted" strokeWidth={1.5} />
        </div>
        <p className="text-text text-[14px] font-medium">Nenhum parcelamento</p>
        <p className="text-text-muted mt-0.5 text-[12px]">Adicione compras parceladas para acompanhar.</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center justify-between">
        <h3 className="font-display text-text text-[14px] font-semibold">
          Parcelamentos
          <span className="font-money text-blue ml-2 text-[12px]">{formatCurrency(totalMonthly / 100)}/mês</span>
        </h3>
        <span className="bg-blue/10 text-blue rounded-full px-2.5 py-0.5 text-[11px] font-semibold">
          {items.filter(i => i.remainingInstallments > 0).length} em aberto
        </span>
      </div>

      <div className="border-border overflow-hidden rounded-xl border">
        {items.map((item, i) => {
          const color = getCategoryColor(item.categoryColor, item.categoryName);
          const pct = (item.paidInstallments / item.totalInstallments) * 100;
          const done = item.remainingInstallments === 0;

          return (
            <div
              key={item.id}
              onClick={() => onView(item)}
              className={cn(
                "group relative cursor-pointer px-4 py-3.5 transition-colors hover:bg-surface2/40",
                i < items.length - 1 && "border-border border-b",
                done && "opacity-60",
              )}
            >
              {/* Top row: icon + name + value (slides) */}
              <div className="flex items-center gap-3">
                <div
                  className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[9px]"
                  style={{ backgroundColor: `${color}18` }}
                >
                  <Layers size={14} strokeWidth={1.75} style={{ color }} />
                </div>

                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <p className="text-text truncate text-[14px] font-medium">{item.description}</p>
                    {done && (
                      <span className="text-green border-green/25 bg-green/8 shrink-0 rounded-full border px-2 py-0.5 text-[11px] font-medium">
                        Quitado
                      </span>
                    )}
                  </div>
                  <div className="text-text-muted mt-0.5 text-[12px]">
                    {item.accountName} · {item.categoryName}
                  </div>
                </div>

                {/* Value — slides left on hover */}
                <div className="flex shrink-0 flex-col items-end gap-1 transition-transform duration-200 group-hover:-translate-x-8">
                  {done ? (
                    <span className="text-green font-money text-[13px] font-semibold">Quitado</span>
                  ) : (
                    <span className="font-money text-text font-600 text-[15px]">
                      {formatCurrency(item.value / 100)}
                    </span>
                  )}
                  <span className="text-text-muted text-[11px]">
                    {item.paidInstallments}/{item.totalInstallments} parcelas
                  </span>
                </div>

                {/* Edit action */}
                {!done && (
                  <div className="absolute right-4 flex items-center opacity-0 transition-opacity duration-200 group-hover:opacity-100">
                    <button
                      onClick={e => { e.stopPropagation(); onEdit(item); }}
                      title="Editar parcelamento"
                      className="text-text-sub hover:bg-surface2 hover:text-text flex h-7 w-7 items-center justify-center rounded-lg transition-colors"
                    >
                      <Pencil size={13} />
                    </button>
                  </div>
                )}
              </div>

              {/* Progress bar */}
              <div className="mt-2.5">
                <div className="bg-surface3 h-1.5 overflow-hidden rounded-full">
                  <div
                    className="h-full rounded-full transition-all duration-500"
                    style={{
                      width: `${pct}%`,
                      backgroundColor: done ? "#00C98D" : color,
                    }}
                  />
                </div>
                {!done && (
                  <div className="text-text-muted mt-1 flex justify-between text-[11px]">
                    <span>{formatCurrency(item.remainingAmount / 100)} restante</span>
                    <span>{pct.toFixed(0)}%</span>
                  </div>
                )}
              </div>
            </div>
          );
        })}

        {/* Footer total */}
        <div className="border-border bg-surface2 flex items-center justify-between border-t px-4 py-2.5">
          <span className="text-text-muted text-[11px]">
            Total mensal · {formatCurrency(totalRemaining / 100)} restante
          </span>
          <span className="font-money text-blue text-[13px] font-bold">{formatCurrency(totalMonthly / 100)}</span>
        </div>
      </div>
    </div>
  );
}

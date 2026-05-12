"use client";

import { Pencil, X, RefreshCw } from "lucide-react";
import { cn } from "@/lib/utils";
import { formatCurrency } from "@/lib/utils/formatCurrency";
import { getCategoryColor } from "@/lib/config/categoryColors";
import type { RecurringItem } from "@/lib/types/recurrences.types";

const RECURRENCE_LABELS: Record<string, string> = {
  Daily:        "Diário",
  WorkDay:      "Dia útil",
  Weekly:       "Semanal",
  Biweekly:     "Quinzenal",
  Monthly:      "Mensal",
  Quarterly:    "Trimestral",
  Semiannually: "Semestral",
  Annually:     "Anual",
};

type Props = {
  items: RecurringItem[];
  totalMonthly: number;
  onView: (item: RecurringItem) => void;
  onEdit: (item: RecurringItem) => void;
  onCancel: (item: RecurringItem) => void;
};

export function RecurringList({ items, totalMonthly, onView, onEdit, onCancel }: Props) {
  if (items.length === 0) {
    return (
      <div className="border-border bg-surface flex flex-col items-center justify-center rounded-xl border py-12 text-center">
        <div className="bg-surface2 mb-3 flex h-10 w-10 items-center justify-center rounded-[10px]">
          <RefreshCw size={18} className="text-text-muted" strokeWidth={1.5} />
        </div>
        <p className="text-text text-[14px] font-medium">Nenhuma assinatura</p>
        <p className="text-text-muted mt-0.5 text-[12px]">Adicione suas assinaturas recorrentes.</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center justify-between">
        <h3 className="font-display text-text text-[14px] font-semibold">
          Assinaturas
          <span className="font-money text-purple ml-2 text-[12px]">{formatCurrency(totalMonthly / 100)}/mês</span>
        </h3>
        <span className="bg-purple/10 text-purple rounded-full px-2.5 py-0.5 text-[11px] font-semibold">
          {items.filter(i => i.isActive).length} ativas
        </span>
      </div>

      <div className="border-border overflow-hidden rounded-xl border">
        {items.map((item, i) => {
          const color = getCategoryColor(item.categoryColor, item.categoryName);
          const startYear = new Date(item.startDate).getFullYear();
          const startMonthName = new Date(item.startDate).toLocaleDateString("pt-BR", { month: "short" });

          return (
            <div
              key={item.id}
              onClick={() => onView(item)}
              className={cn(
                "group relative flex cursor-pointer items-center gap-3 px-4 py-3.5 transition-colors hover:bg-surface2/40",
                i < items.length - 1 && "border-border border-b",
                !item.isActive && "opacity-50",
              )}
            >
              {/* Category dot */}
              <div
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[9px]"
                style={{ backgroundColor: `${color}18` }}
              >
                <RefreshCw size={14} strokeWidth={1.75} style={{ color }} />
              </div>

              {/* Info */}
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <p className="text-text truncate text-[14px] font-medium">{item.description}</p>
                  {!item.isActive && (
                    <span className="text-red border-red/25 bg-red/8 shrink-0 rounded-full border px-2 py-0.5 text-[11px] font-medium">
                      Cancelada
                    </span>
                  )}
                </div>
                <div className="text-text-muted mt-0.5 text-[12px]">
                  {item.categoryName} · {RECURRENCE_LABELS[item.recurrence]} · desde {startMonthName} {startYear}
                </div>
              </div>

              {/* Value — slides left on hover */}
              <div className="flex shrink-0 flex-col items-end gap-1 transition-transform duration-200 group-hover:-translate-x-16">
                <span className="font-money text-text font-600 text-[15px]">
                  {formatCurrency(item.value / 100)}
                </span>
                <span
                  className="rounded-full px-2 py-0.5 text-[11px] font-medium"
                  style={{ backgroundColor: `${color}20`, color }}
                >
                  {item.accountName}
                </span>
              </div>

              {/* Actions — appear on hover */}
              <div className="absolute right-4 flex items-center gap-1 opacity-0 transition-opacity duration-200 group-hover:opacity-100">
                <button
                  onClick={e => { e.stopPropagation(); onEdit(item); }}
                  title="Editar assinatura"
                  className="text-text-sub hover:bg-surface2 hover:text-text flex h-7 w-7 items-center justify-center rounded-lg transition-colors"
                >
                  <Pencil size={13} />
                </button>
                {item.isActive && (
                  <button
                    onClick={e => { e.stopPropagation(); onCancel(item); }}
                    title="Cancelar assinatura"
                    className="text-red/60 hover:bg-red/10 flex h-7 w-7 items-center justify-center rounded-lg transition-colors hover:text-red"
                  >
                    <X size={13} />
                  </button>
                )}
              </div>
            </div>
          );
        })}

        {/* Footer total */}
        <div className="border-border bg-surface2 flex items-center justify-between border-t px-4 py-2.5">
          <span className="text-text-muted text-[11px]">Total mensal</span>
          <span className="font-money text-purple text-[13px] font-bold">{formatCurrency(totalMonthly / 100)}</span>
        </div>
      </div>
    </div>
  );
}

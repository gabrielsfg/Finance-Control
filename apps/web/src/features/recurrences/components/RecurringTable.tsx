"use client";

import { Pencil, X, RefreshCw, RotateCcw } from "lucide-react";
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
  items:            RecurringItem[];
  totalMonthly:     number;
  totalAnnual:      number;
  onView:           (item: RecurringItem) => void;
  onEdit:           (item: RecurringItem) => void;
  onCancel:         (item: RecurringItem) => void;
  onReactivate:     (item: RecurringItem) => void;
};

const COLS = "grid-cols-[minmax(0,2fr)_140px_120px_110px_minmax(120px,1fr)_110px_88px]";

export function RecurringTable({
  items, totalMonthly, totalAnnual, onView, onEdit, onCancel, onReactivate,
}: Props) {
  if (items.length === 0) {
    return (
      <div className="border-border bg-surface flex flex-col items-center justify-center rounded-xl border py-16 text-center">
        <div className="bg-surface2 mb-3 flex h-12 w-12 items-center justify-center rounded-[10px]">
          <RefreshCw size={20} className="text-text-muted" strokeWidth={1.5} />
        </div>
        <p className="text-text text-[14px] font-medium">Nenhuma assinatura</p>
        <p className="text-text-muted mt-0.5 text-[12px]">Adicione suas assinaturas recorrentes.</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-baseline justify-between">
        <h3 className="font-display text-text text-[15px] font-semibold">Assinaturas</h3>
        <span className="text-text-muted text-[12px]">
          <span className="font-money text-purple">{formatCurrency(totalMonthly / 100)}</span>/mês ·{" "}
          <span className="font-money text-text-sub">{formatCurrency(totalAnnual / 100)}</span>/ano
        </span>
      </div>

      <div className="border-border bg-surface overflow-hidden rounded-xl border">
        {/* Header */}
        <div className={cn(
          "bg-surface2 border-border grid items-center gap-3 border-b px-5 py-2.5",
          COLS,
        )}>
          {["Serviço", "Categoria", "Valor/mês", "Recorrência", "Conta", "Status", ""].map(h => (
            <div key={h} className="text-text-muted text-[11px] font-semibold uppercase tracking-wider">
              {h}
            </div>
          ))}
        </div>

        {/* Rows */}
        {items.map((item, i) => {
          const color = getCategoryColor(item.categoryColor, item.categoryName);
          return (
            <div
              key={item.id}
              onClick={() => onView(item)}
              className={cn(
                "grid cursor-pointer items-center gap-3 px-5 py-3.5 transition-colors hover:bg-surface2/50",
                COLS,
                i < items.length - 1 && "border-border border-b",
                !item.isActive && "opacity-55",
              )}
            >
              {/* Service */}
              <div className="flex min-w-0 items-center gap-3">
                <div
                  className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[9px]"
                  style={{ backgroundColor: `${color}22`, border: `1px solid ${color}33` }}
                >
                  <RefreshCw size={14} strokeWidth={1.75} style={{ color }} />
                </div>
                <div className="min-w-0">
                  <p className="text-text truncate text-[13px] font-semibold">{item.description}</p>
                  <p className="text-text-muted truncate text-[11px]">
                    desde {new Date(item.startDate).toLocaleDateString("pt-BR", { month: "short", year: "numeric" })}
                  </p>
                </div>
              </div>

              {/* Category */}
              <span
                className="w-fit truncate rounded-full px-2.5 py-0.5 text-[11px] font-semibold"
                style={{ backgroundColor: `${color}1f`, color }}
                title={item.categoryName}
              >
                {item.categoryName}
              </span>

              {/* Monthly value */}
              <div className="font-money text-text text-[13px] font-semibold">
                {formatCurrency(item.value / 100)}
              </div>

              {/* Recurrence */}
              <div className="text-text-sub text-[12px]">
                {RECURRENCE_LABELS[item.recurrence] ?? item.recurrence}
              </div>

              {/* Account */}
              <div className="text-text-muted truncate text-[12px]" title={item.accountName}>
                {item.accountName}
              </div>

              {/* Status — fixed (not hover) */}
              <div>
                {item.isActive ? (
                  <span className="text-green border-green/25 bg-green/8 inline-flex rounded-full border px-2.5 py-0.5 text-[11px] font-semibold">
                    Ativa
                  </span>
                ) : (
                  <span className="text-red border-red/25 bg-red/8 inline-flex rounded-full border px-2.5 py-0.5 text-[11px] font-semibold">
                    Cancelada
                  </span>
                )}
              </div>

              {/* Actions — fixed (not hover) */}
              <div className="flex items-center justify-end gap-1">
                {item.isActive ? (
                  <>
                    <button
                      onClick={e => { e.stopPropagation(); onEdit(item); }}
                      title="Editar assinatura"
                      className="text-text-sub hover:bg-surface3 hover:text-text flex h-7 w-7 items-center justify-center rounded-lg transition-colors"
                    >
                      <Pencil size={13} />
                    </button>
                    <button
                      onClick={e => { e.stopPropagation(); onCancel(item); }}
                      title="Cancelar assinatura"
                      className="text-red/70 hover:bg-red/10 hover:text-red flex h-7 w-7 items-center justify-center rounded-lg transition-colors"
                    >
                      <X size={13} />
                    </button>
                  </>
                ) : (
                  <button
                    onClick={e => { e.stopPropagation(); onReactivate(item); }}
                    title="Reativar assinatura"
                    className="text-green/80 hover:bg-green/10 hover:text-green flex h-7 w-7 items-center justify-center rounded-lg transition-colors"
                  >
                    <RotateCcw size={13} />
                  </button>
                )}
              </div>
            </div>
          );
        })}

        {/* Footer total */}
        <div className="bg-surface2 border-border flex items-center justify-between border-t px-5 py-2.5">
          <span className="text-text-muted text-[11px]">Total mensal</span>
          <span className="font-money text-purple text-[13px] font-bold">
            {formatCurrency(totalMonthly / 100)}
          </span>
        </div>
      </div>
    </div>
  );
}

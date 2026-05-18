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
  expanded?: boolean;
  onView: (item: InstallmentItem) => void;
  onEdit: (item: InstallmentItem) => void;
};

function getEndMonth(item: InstallmentItem): string {
  const start = new Date(item.transactionDate);
  start.setMonth(start.getMonth() + item.totalInstallments - 1);
  return start.toLocaleDateString("pt-BR", { month: "short", year: "numeric" });
}

export function InstallmentList({ items, totalMonthly, totalRemaining, expanded = false, onView, onEdit }: Props) {
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

      {expanded ? (
        /* ── Expanded card grid layout (single-type filter) ── */
        <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
          {items.map(item => {
            const color = getCategoryColor(item.categoryColor, item.categoryName);
            const pct = (item.paidInstallments / item.totalInstallments) * 100;
            const done = item.remainingInstallments === 0;
            const endMonth = getEndMonth(item);
            const startDate = new Date(item.transactionDate).toLocaleDateString("pt-BR", { month: "short", year: "numeric" });

            return (
              <div
                key={item.id}
                onClick={() => onView(item)}
                className={cn(
                  "border-border bg-surface group cursor-pointer rounded-xl border p-4 transition-colors hover:bg-surface2/40",
                  done && "opacity-70",
                )}
                style={{ borderColor: done ? "rgb(0 201 141 / 0.27)" : `${color}33` }}
              >
                {/* Header: icon + name + badge */}
                <div className="mb-3.5 flex items-start justify-between gap-3">
                  <div className="flex min-w-0 items-center gap-3">
                    <div
                      className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[11px]"
                      style={{ backgroundColor: `${color}20` }}
                    >
                      <Layers size={16} strokeWidth={1.75} style={{ color }} />
                    </div>
                    <div className="min-w-0">
                      <p className="text-text truncate text-[14px] font-semibold">{item.description}</p>
                      <p className="text-text-muted mt-0.5 text-[11px]">{item.accountName}</p>
                    </div>
                  </div>
                  {done ? (
                    <span className="text-green border-green/25 bg-green/8 shrink-0 rounded-full border px-2.5 py-0.5 text-[11px] font-medium">
                      Quitado ✓
                    </span>
                  ) : (
                    <span
                      className="shrink-0 rounded-full px-2.5 py-0.5 text-[11px] font-medium"
                      style={{ backgroundColor: `${color}20`, color }}
                    >
                      {item.categoryName}
                    </span>
                  )}
                </div>

                {/* Progress */}
                <div className="mb-3.5">
                  <div className="mb-1.5 flex justify-between">
                    <span className="text-text-sub text-[12px]">
                      <span className="font-money font-semibold" style={{ color: done ? "#00C98D" : color }}>
                        {item.paidInstallments}
                      </span>
                      <span className="text-text-muted"> / {item.totalInstallments} parcelas</span>
                    </span>
                    <span className="font-money text-text-muted text-[12px]">{pct.toFixed(0)}%</span>
                  </div>
                  <div className="bg-surface3 h-[7px] overflow-hidden rounded-full">
                    <div
                      className="h-full rounded-full transition-all duration-500"
                      style={{ width: `${pct}%`, backgroundColor: done ? "#00C98D" : color }}
                    />
                  </div>
                </div>

                {/* Detail row */}
                <div className="border-border grid grid-cols-3 gap-2.5 border-t pt-3">
                  <div>
                    <p className="text-text-muted mb-1 text-[10px] uppercase tracking-wide">Parcela</p>
                    <p className={cn("font-money text-[13px] font-semibold", done ? "text-green" : "text-text")}>
                      {done ? "—" : formatCurrency(item.value / 100)}
                    </p>
                  </div>
                  <div>
                    <p className="text-text-muted mb-1 text-[10px] uppercase tracking-wide">Restante</p>
                    <p className={cn("font-money text-[13px]", done ? "text-green" : "text-red")}>
                      {done ? "—" : formatCurrency(item.remainingAmount / 100)}
                    </p>
                  </div>
                  <div>
                    <p className="text-text-muted mb-1 text-[10px] uppercase tracking-wide">Término</p>
                    <p className={cn("text-[12px]", done ? "text-green" : "text-text-sub")}>
                      {done ? "Quitado ✓" : endMonth}
                    </p>
                  </div>
                </div>

                {/* Footer */}
                <div className="mt-3 flex items-center justify-between">
                  <span className="text-text-muted text-[11px]">desde {startDate}</span>
                  {!done && (
                    <button
                      onClick={e => { e.stopPropagation(); onEdit(item); }}
                      title="Editar parcelamento"
                      className="text-text-sub hover:bg-surface2 hover:text-text flex h-7 w-7 items-center justify-center rounded-lg transition-colors"
                    >
                      <Pencil size={13} />
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* ── Compact list layout (All filter) ── */
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
                      <span className={cn("font-money font-600 text-[15px]", item.type === "Income" ? "text-green" : "text-text")}>
                        {item.type === "Income" ? "+" : ""}{formatCurrency(item.value / 100)}
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
      )}
    </div>
  );
}

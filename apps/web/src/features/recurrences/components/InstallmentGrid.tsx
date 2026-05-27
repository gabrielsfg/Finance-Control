"use client";

import { Pencil, Layers } from "lucide-react";
import { cn } from "@/lib/utils";
import { formatCurrency } from "@/lib/utils/formatCurrency";
import { getCategoryColor } from "@/lib/config/categoryColors";
import type { InstallmentItem } from "@/lib/types/recurrences.types";

type Props = {
  items:          InstallmentItem[];
  totalMonthly:   number;
  totalRemaining: number;
  onView:         (item: InstallmentItem) => void;
  onEdit:         (item: InstallmentItem) => void;
};

export function InstallmentGrid({
  items, totalMonthly, totalRemaining, onView, onEdit,
}: Props) {
  if (items.length === 0) {
    return (
      <div className="border-border bg-surface flex flex-col items-center justify-center rounded-xl border py-16 text-center">
        <div className="bg-surface2 mb-3 flex h-12 w-12 items-center justify-center rounded-[10px]">
          <Layers size={20} className="text-text-muted" strokeWidth={1.5} />
        </div>
        <p className="text-text text-[14px] font-medium">Nenhum parcelamento</p>
        <p className="text-text-muted mt-0.5 text-[12px]">Adicione compras parceladas para acompanhar.</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-baseline justify-between">
        <h3 className="font-display text-text text-[15px] font-semibold">Parcelamentos</h3>
        <span className="text-text-muted text-[12px]">
          <span className="font-money text-blue">{formatCurrency(totalMonthly / 100)}</span>/mês ·{" "}
          <span className="font-money text-text-sub">{formatCurrency(totalRemaining / 100)}</span> restante
        </span>
      </div>

      <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
        {items.map(item => {
          const color  = getCategoryColor(item.categoryColor, item.categoryName);
          const pct    = (item.paidInstallments / item.totalInstallments) * 100;
          const done   = item.remainingInstallments === 0;

          const endDate = (() => {
            const d = new Date(item.transactionDate);
            d.setMonth(d.getMonth() + item.totalInstallments - 1);
            return d.toLocaleDateString("pt-BR", { month: "short", year: "numeric" });
          })();

          return (
            <div
              key={item.id}
              onClick={() => onView(item)}
              className={cn(
                "bg-surface flex cursor-pointer flex-col gap-3.5 rounded-xl border p-4 transition-colors hover:bg-surface2/40",
                done ? "opacity-70" : "",
              )}
              style={{
                borderColor: done
                  ? "color-mix(in srgb, var(--green) 28%, transparent)"
                  : `${color}33`,
              }}
            >
              {/* Header: icon + name + status badge */}
              <div className="flex items-start justify-between gap-3">
                <div className="flex min-w-0 items-center gap-3">
                  <div
                    className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[10px]"
                    style={{ backgroundColor: `${color}22` }}
                  >
                    <Layers size={16} strokeWidth={1.75} style={{ color }} />
                  </div>
                  <div className="min-w-0">
                    <p className="font-display text-text truncate text-[14px] font-semibold">
                      {item.description}
                    </p>
                    <p className="text-text-muted truncate text-[11px]">
                      desde {new Date(item.transactionDate).toLocaleDateString("pt-BR", { month: "short", year: "numeric" })}
                    </p>
                  </div>
                </div>
                {done ? (
                  <span className="text-green border-green/25 bg-green/8 shrink-0 rounded-full border px-2.5 py-0.5 text-[11px] font-semibold">
                    Quitado
                  </span>
                ) : (
                  <span
                    className="shrink-0 rounded-full px-2.5 py-0.5 text-[11px] font-semibold"
                    style={{ backgroundColor: `${color}1f`, color }}
                  >
                    {item.categoryName}
                  </span>
                )}
              </div>

              {/* Progress */}
              <div className="flex flex-col gap-1.5">
                <div className="flex items-center justify-between text-[12px]">
                  <span className="text-text-sub">
                    <span className="font-money font-semibold" style={{ color: done ? "var(--green)" : color }}>
                      {item.paidInstallments}
                    </span>
                    <span className="text-text-muted"> / {item.totalInstallments} parcelas</span>
                  </span>
                  <span className="font-money text-text-muted text-[12px]">{pct.toFixed(0)}%</span>
                </div>
                <div className="bg-surface3 h-1.5 w-full overflow-hidden rounded-full">
                  <div
                    className="h-full rounded-full transition-all duration-500"
                    style={{ width: `${pct}%`, backgroundColor: done ? "var(--green)" : color }}
                  />
                </div>
              </div>

              {/* Breakdown row */}
              <div className="border-border grid grid-cols-3 gap-3 border-t pt-3">
                <BreakdownCell label="Parcela" value={formatCurrency(item.value / 100)} />
                <BreakdownCell
                  label="Restante"
                  value={done ? "—" : formatCurrency(item.remainingAmount / 100)}
                  valueClass={done ? "text-green" : "text-red"}
                />
                <BreakdownCell
                  label="Término"
                  value={done ? "Quitado" : endDate}
                  valueClass={done ? "text-green" : "text-text-sub"}
                  small
                />
              </div>

              {/* Footer */}
              <div className="flex items-center justify-between gap-2">
                <span className="text-text-muted truncate text-[11px]">
                  {item.accountName}
                  {item.paymentMethod ? ` · ${item.paymentMethod === "Credit" ? "Crédito" : "Débito"}` : ""}
                </span>
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
    </div>
  );
}

function BreakdownCell({
  label, value, valueClass, small,
}: {
  label:       string;
  value:       string;
  valueClass?: string;
  small?:      boolean;
}) {
  return (
    <div className="flex flex-col gap-1">
      <span className="text-text-muted text-[10px] uppercase tracking-wider">{label}</span>
      <span className={cn(
        small ? "text-[12px]" : "font-money text-[13px] font-semibold",
        valueClass ?? "text-text",
      )}>
        {value}
      </span>
    </div>
  );
}

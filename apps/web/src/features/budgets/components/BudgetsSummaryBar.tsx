"use client";

import { formatCurrency } from "@/lib/utils/formatCurrency";
import { cn } from "@/lib/utils";
import type { Budget } from "@/lib/types/budgets.types";

type Props = { budgets: Budget[] };

export const BudgetsSummaryBar = ({ budgets }: Props) => {
  const totalAllocated = budgets.reduce((s, b) => s + b.totalAllocated, 0);
  const totalSpent = budgets.reduce((s, b) => s + b.totalSpent, 0);
  const remaining = totalAllocated - totalSpent;
  const pct = totalAllocated > 0 ? Math.min((totalSpent / totalAllocated) * 100, 100) : 0;
  const isOver = totalSpent > totalAllocated;

  return (
    <div
      className="border-border flex flex-wrap items-center justify-between gap-6 rounded-[16px] border px-8 py-7"
      style={{ background: "linear-gradient(135deg, var(--surface) 0%, var(--surface2) 100%)" }}
    >
      <div>
        <p className="font-display font-700 text-text mb-1 text-[18px] tracking-tight">
          Total Orçado
        </p>
        <p className="font-money font-600 text-[36px] tracking-tight" style={{ color: isOver ? "var(--red)" : "var(--green)" }}>
          {formatCurrency(totalSpent / 100)}
        </p>
        <p className="text-text-muted mt-1 text-[13px]">de {formatCurrency(totalAllocated / 100)}</p>
      </div>

      <div className="flex gap-8 text-right">
        <div>
          <p className="text-text-muted text-[12px] uppercase tracking-[0.06em]">Restante</p>
          <p className={cn("font-money font-600 text-[20px]", remaining < 0 ? "text-red" : "text-green")}>
            {remaining < 0 ? "-" : ""}{formatCurrency(Math.abs(remaining) / 100)}
          </p>
        </div>
        <div>
          <p className="text-text-muted text-[12px] uppercase tracking-[0.06em]">Orçamentos</p>
          <p className="font-money font-600 text-text text-[20px]">{budgets.length}</p>
        </div>
        <div>
          <p className="text-text-muted text-[12px] uppercase tracking-[0.06em]">Uso geral</p>
          <p className={cn("font-money font-600 text-[20px]", isOver ? "text-red" : "text-green")}>
            {pct.toFixed(1)}%
          </p>
        </div>
      </div>
    </div>
  );
};

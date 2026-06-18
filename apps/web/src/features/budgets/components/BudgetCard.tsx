"use client";

import { useState } from "react";
import { Star, Pencil, Trash2, ChevronDown } from "lucide-react";
import { BudgetAreaBreakdown } from "@/features/budgets/components/BudgetAreaBreakdown";
import { Money } from "@/components/shared/Money";
import { formatCurrency } from "@/lib/utils/formatCurrency";
import { formatPercentNeutral } from "@/lib/utils/formatNumber";
import { cn } from "@/lib/utils";
import { useDeleteBudget } from "@/features/budgets/hooks/useBudgets";
import type { Budget } from "@/lib/types/budgets.types";

const RECURRENCE_LABELS: Record<string, string> = {
  Monthly: "Mensal",
  Weekly: "Semanal",
  Biweekly: "Quinzenal",
  Semiannually: "Semestral",
  Annually: "Anual",
};

const STATUS_PILL = "font-mono text-[10.5px] tracking-[0.06em] uppercase px-[9px] py-[3px] rounded-full shrink-0";

function StatusBadge({ pct, isActive }: { pct: number; isActive: boolean }) {
  if (!isActive) return null;
  if (pct > 100)
    return (
      <span className={STATUS_PILL} style={{ background: "color-mix(in srgb, var(--clay) 14%, transparent)", color: "var(--clay)" }}>
        Estourado
      </span>
    );
  if (pct > 80)
    return (
      <span className={STATUS_PILL} style={{ background: "color-mix(in srgb, var(--gold) 18%, transparent)", color: "var(--gold)" }}>
        Atenção
      </span>
    );
  return (
    <span className={STATUS_PILL} style={{ background: "color-mix(in srgb, var(--moss) 15%, transparent)", color: "var(--moss)" }}>
      No prazo
    </span>
  );
}

/** Thin labelled progress bar (track + fill), the in-card budget bar. */
function Bar({ value, max, color }: { value: number; max: number; color: string }) {
  const pct = max > 0 ? Math.min((value / max) * 100, 100) : 0;
  const over = value > max;
  return (
    <div
      className="h-[8px] w-full overflow-hidden rounded-full"
      style={{ background: `color-mix(in srgb, ${color} 20%, transparent)` }}
    >
      <div
        className="h-full rounded-full transition-[width] duration-300"
        style={{ width: `${pct}%`, background: over ? "var(--clay)" : color }}
      />
    </div>
  );
}

type Props = {
  budget: Budget;
  onEdit: (budget: Budget) => void;
  inactive?: boolean;
};

export const BudgetCard = ({ budget, onEdit, inactive = false }: Props) => {
  const deleteBudget = useDeleteBudget();
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [expanded, setExpanded] = useState(false);

  const allocs = budget.allocations ?? [];
  const expenseAllocs = allocs.filter((a) => a.allocationType === "Expense");
  const incomeAllocs  = allocs.filter((a) => a.allocationType === "Income");

  const totalExpenseAllocated = expenseAllocs.reduce((s, a) => s + a.allocated, 0);
  const totalExpenseSpent     = expenseAllocs.reduce((s, a) => s + a.spent, 0);
  const totalIncomeAllocated  = incomeAllocs.reduce((s, a) => s + a.allocated, 0);
  const totalIncomeSpent      = incomeAllocs.reduce((s, a) => s + a.spent, 0);

  const expensePct = totalExpenseAllocated > 0 ? (totalExpenseSpent / totalExpenseAllocated) * 100 : 0;
  const isOver = expensePct > 100;
  const expenseRemaining = totalExpenseAllocated - totalExpenseSpent;
  const areaCount = new Set(allocs.map((a) => a.areaName)).size;

  const hasExpense = totalExpenseAllocated > 0;
  const hasIncome  = totalIncomeAllocated  > 0;

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirmDelete) { setConfirmDelete(true); return; }
    deleteBudget.mutate(budget.id);
  };

  return (
    <div
      className={cn(
        "group rounded-[20px] border bg-[var(--surface)] transition-shadow hover:shadow-[var(--shadow-sm)]",
        budget.isActive ? "border-[color-mix(in_srgb,var(--brand-accent)_38%,var(--border-color))]" : "border-[var(--border-color)]",
        inactive && "opacity-60",
      )}
      style={{ boxShadow: "var(--shadow-sm)" }}
    >
      {/* Clickable body — toggles inline detail */}
      <button
        type="button"
        className="block w-full cursor-pointer p-[22px] text-left"
        onClick={() => setExpanded((v) => !v)}
        aria-expanded={expanded}
      >
        {/* Header */}
        <div className="mb-4 flex items-start gap-2">
          {budget.isActive && <Star size={13} className="mt-0.5 shrink-0 fill-[var(--gold)] text-[var(--gold)]" />}
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <p className="font-display text-[15px] font-bold tracking-[-0.01em] text-[var(--text)] truncate">{budget.name}</p>
              <StatusBadge pct={expensePct} isActive={budget.isActive} />
            </div>
            <p className="mt-0.5 font-mono text-[11px] tracking-[0.04em] text-[var(--text-sub)]">
              {RECURRENCE_LABELS[budget.recurrence] ?? budget.recurrence}
            </p>
          </div>
          <ChevronDown
            size={18}
            className={cn("mt-0.5 shrink-0 text-[var(--text-sub)] transition-transform duration-200", expanded && "rotate-180")}
          />
        </div>

        {/* Totals */}
        <div className="flex flex-col gap-3 sm:flex-row sm:gap-6">
          {hasExpense && (
            <div className="flex-1">
              <div className="mb-2 flex items-end justify-between">
                <div>
                  <Money cents={totalExpenseSpent} className="text-[20px]" />
                  <p className="mt-0.5 text-[12px] text-[var(--text-sub)]">
                    de {formatCurrency(totalExpenseAllocated / 100)} em despesas
                  </p>
                </div>
                <div className="text-right">
                  <p className={cn("font-mono text-[16px] font-semibold tabular-nums", isOver ? "text-[var(--clay)]" : "text-[var(--text-sub)]")}>
                    {formatPercentNeutral(expensePct)}%
                  </p>
                  <p className={cn("text-[11px]", expenseRemaining < 0 ? "text-[var(--clay)]" : "text-[var(--text-sub)]")}>
                    {expenseRemaining < 0 ? "Estourado" : `Restam ${formatCurrency(expenseRemaining / 100)}`}
                  </p>
                </div>
              </div>
              <Bar value={totalExpenseSpent} max={totalExpenseAllocated} color="var(--clay)" />
            </div>
          )}
          {hasIncome && (
            <div className="flex-1">
              <div className="mb-2 flex items-end justify-between">
                <div>
                  <Money cents={totalIncomeSpent} className="text-[20px]" />
                  <p className="mt-0.5 text-[12px] text-[var(--text-sub)]">
                    de {formatCurrency(totalIncomeAllocated / 100)} em receitas
                  </p>
                </div>
                <div className="text-right">
                  <p className="font-mono text-[16px] font-semibold tabular-nums text-[var(--moss)]">
                    {formatPercentNeutral(totalIncomeAllocated > 0 ? (totalIncomeSpent / totalIncomeAllocated) * 100 : 0)}%
                  </p>
                </div>
              </div>
              <Bar value={totalIncomeSpent} max={totalIncomeAllocated} color="var(--moss)" />
            </div>
          )}
        </div>

        <div className="mt-4 font-mono text-[11px] tracking-[0.04em] text-[var(--text-sub)]">
          {areaCount} área{areaCount !== 1 ? "s" : ""} · {allocs.length} subcategoria{allocs.length !== 1 ? "s" : ""}
        </div>
      </button>

      {/* Inline detail — areas & subcategories */}
      {expanded && allocs.length > 0 && (
        <div className="border-t border-[var(--border-color)] px-[22px] py-5">
          <p className="mb-3 font-mono text-[11px] uppercase tracking-[0.12em] text-[var(--text-sub)]">Áreas</p>
          <BudgetAreaBreakdown allocations={allocs} />
        </div>
      )}

      {/* Action bar */}
      <div
        className="flex items-center gap-2 border-t border-[var(--border-color)] px-4 py-3"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={(e) => { e.stopPropagation(); onEdit(budget); }}
          className="flex flex-1 items-center justify-center gap-1.5 rounded-[9px] bg-[var(--surface2)] px-3 py-1.5 text-[12px] font-medium text-[var(--text-sub)] transition-colors hover:text-[var(--text)]"
        >
          <Pencil size={13} />
          Editar
        </button>
        <button
          onClick={handleDelete}
          disabled={deleteBudget.isPending}
          title={confirmDelete ? "Clique novamente para confirmar" : "Excluir orçamento"}
          className={cn(
            "flex h-7 w-7 items-center justify-center rounded-[9px] transition-colors disabled:opacity-50",
            confirmDelete ? "bg-[color-mix(in_srgb,var(--clay)_12%,transparent)] text-[var(--clay)]" : "text-[var(--clay)] opacity-60 hover:opacity-100",
          )}
        >
          <Trash2 size={13} />
        </button>
      </div>
    </div>
  );
};

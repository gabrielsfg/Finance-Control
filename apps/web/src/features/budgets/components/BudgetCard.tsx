"use client";

import { useState } from "react";
import { Star, Pencil, Trash2, ChevronDown } from "lucide-react";
import { ProgressBar } from "@/components/shared/ProgressBar";
import { BudgetAreaBreakdown } from "@/features/budgets/components/BudgetAreaBreakdown";
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

function StatusBadge({ pct, isActive }: { pct: number; isActive: boolean }) {
  if (!isActive) return null;
  if (pct > 100) return (
    <span className="bg-red/12 text-red shrink-0 rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide">
      Estourado
    </span>
  );
  if (pct > 80) return (
    <span className="bg-orange/12 text-orange shrink-0 rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide">
      Atenção
    </span>
  );
  return (
    <span className="bg-green/15 text-green shrink-0 rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide">
      Normal
    </span>
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
        "border-border bg-surface group rounded-xl border transition-shadow hover:shadow-sm",
        budget.isActive && "ring-1 ring-green/30",
        inactive && "opacity-60",
      )}
    >
      {/* Clickable body — toggles inline detail */}
      <button
        type="button"
        className="block w-full cursor-pointer p-5 text-left"
        onClick={() => setExpanded((v) => !v)}
        aria-expanded={expanded}
      >
        {/* Header */}
        <div className="mb-4 flex items-start gap-2">
          {budget.isActive && (
            <Star size={13} className="fill-yellow text-yellow mt-0.5 shrink-0" />
          )}
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <p className="font-display font-600 text-text truncate text-[15px]">{budget.name}</p>
              <StatusBadge pct={expensePct} isActive={budget.isActive} />
            </div>
            <p className="text-text-muted mt-0.5 text-[12px]">
              {RECURRENCE_LABELS[budget.recurrence] ?? budget.recurrence}
            </p>
          </div>
          <ChevronDown
            size={18}
            className={cn(
              "text-text-muted mt-0.5 shrink-0 transition-transform duration-200",
              expanded && "rotate-180",
            )}
          />
        </div>

        {/* Totals */}
        <div className="flex flex-col gap-2.5 sm:flex-row sm:gap-6">
          {hasExpense && (
            <div className="flex-1">
              <div className="mb-1.5 flex items-end justify-between">
                <div>
                  <p className="font-money font-600 text-text text-[20px]">
                    {formatCurrency(totalExpenseSpent / 100)}
                  </p>
                  <p className="text-text-muted mt-0.5 text-[12px]">
                    de {formatCurrency(totalExpenseAllocated / 100)} em despesas
                  </p>
                </div>
                <div className="text-right">
                  <p className={cn("font-money font-600 text-[16px]", isOver ? "text-red" : "text-text-muted")}>
                    {formatPercentNeutral(expensePct)}%
                  </p>
                  <p className={cn("text-[11px]", expenseRemaining < 0 ? "text-red" : "text-text-muted")}>
                    {expenseRemaining < 0 ? "Estourado" : `Restam ${formatCurrency(expenseRemaining / 100)}`}
                  </p>
                </div>
              </div>
              <ProgressBar value={totalExpenseSpent} max={totalExpenseAllocated} height={6} color="var(--red)" />
            </div>
          )}
          {hasIncome && (
            <div className="flex-1">
              <div className="mb-1.5 flex items-end justify-between">
                <div>
                  <p className="font-money font-600 text-text text-[20px]">
                    {formatCurrency(totalIncomeSpent / 100)}
                  </p>
                  <p className="text-text-muted mt-0.5 text-[12px]">
                    de {formatCurrency(totalIncomeAllocated / 100)} em receitas
                  </p>
                </div>
                <div className="text-right">
                  <p className="font-money font-600 text-green text-[16px]">
                    {formatPercentNeutral(totalIncomeAllocated > 0 ? (totalIncomeSpent / totalIncomeAllocated) * 100 : 0)}%
                  </p>
                </div>
              </div>
              <ProgressBar value={totalIncomeSpent} max={totalIncomeAllocated} height={6} color="var(--green)" />
            </div>
          )}
        </div>

        <div className="mt-4">
          <span className="text-text-muted text-[12px]">
            {areaCount} área{areaCount !== 1 ? "s" : ""} · {allocs.length} subcategoria{allocs.length !== 1 ? "s" : ""}
          </span>
        </div>
      </button>

      {/* Inline detail — areas & subcategories */}
      {expanded && allocs.length > 0 && (
        <div className="border-border border-t px-5 py-5">
          <p className="text-text-sub mb-3 text-[12px] font-semibold uppercase tracking-[0.06em]">Áreas</p>
          <BudgetAreaBreakdown allocations={allocs} />
        </div>
      )}

      {/* Action bar */}
      <div
        className="border-border flex items-center gap-2 border-t px-4 py-3"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={(e) => { e.stopPropagation(); onEdit(budget); }}
          className="flex flex-1 items-center justify-center gap-1.5 rounded-lg bg-surface2 px-3 py-1.5 text-[12px] font-medium text-text-sub transition-colors hover:bg-surface2/80"
        >
          <Pencil size={13} />
          Editar
        </button>
        <button
          onClick={handleDelete}
          disabled={deleteBudget.isPending}
          title={confirmDelete ? "Clique novamente para confirmar" : "Excluir orçamento"}
          className={cn(
            "flex h-7 w-7 items-center justify-center rounded-lg transition-colors disabled:opacity-50",
            confirmDelete
              ? "bg-red/10 text-red"
              : "text-red/60 hover:bg-red/10 hover:text-red",
          )}
        >
          <Trash2 size={13} />
        </button>
      </div>
    </div>
  );
};

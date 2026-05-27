"use client";

import { useState } from "react";
import { X, Pencil, Star, ChevronDown, ChevronUp } from "lucide-react";
import { ProgressBar } from "@/components/shared/ProgressBar";
import { Button } from "@/components/ui/button";
import { formatCurrency } from "@/lib/utils/formatCurrency";
import { formatPercentNeutral } from "@/lib/utils/formatNumber";
import { getCategoryColor } from "@/lib/config/categoryColors";
import { cn } from "@/lib/utils";
import { useActivateBudget } from "@/features/budgets/hooks/useBudgets";
import type { Budget, BudgetAllocation } from "@/lib/types/budgets.types";

const RECURRENCE_LABELS: Record<string, string> = {
  Monthly: "Mensal",
  Weekly: "Semanal",
  Biweekly: "Quinzenal",
  Semiannually: "Semestral",
  Annually: "Anual",
};

type AreaGroup = {
  areaName: string;
  areaColor: string;
  expenseAllocated: number;
  expenseSpent: number;
  incomeAllocated: number;
  incomeSpent: number;
  allocations: BudgetAllocation[];
};

function groupByArea(allocations: BudgetAllocation[]): AreaGroup[] {
  const map = new Map<string, AreaGroup>();
  for (const alloc of allocations) {
    const key = alloc.areaName;
    if (!map.has(key)) {
      map.set(key, {
        areaName: alloc.areaName,
        areaColor: getCategoryColor(alloc.categoryColor, alloc.categoryName),
        expenseAllocated: 0,
        expenseSpent: 0,
        incomeAllocated: 0,
        incomeSpent: 0,
        allocations: [],
      });
    }
    const g = map.get(key)!;
    if (alloc.allocationType === "Expense") {
      g.expenseAllocated += alloc.allocated;
      g.expenseSpent += alloc.spent;
    } else {
      g.incomeAllocated += alloc.allocated;
      g.incomeSpent += alloc.spent;
    }
    g.allocations.push(alloc);
  }
  return Array.from(map.values());
}

function AreaRow({ group }: { group: AreaGroup }) {
  const [open, setOpen] = useState(false);

  const hasExpense = group.expenseAllocated > 0;
  const hasIncome  = group.incomeAllocated  > 0;
  const expensePct  = hasExpense ? (group.expenseSpent / group.expenseAllocated) * 100 : 0;
  const incomePct   = hasIncome  ? (group.incomeSpent  / group.incomeAllocated)  * 100 : 0;
  const expenseOver = group.expenseSpent > group.expenseAllocated;
  const expenseRemaining = group.expenseAllocated - group.expenseSpent;

  return (
    <div className="border-border rounded-xl border">
      <button
        onClick={() => setOpen((v) => !v)}
        className="hover:bg-surface2/60 flex w-full items-center gap-3 rounded-xl p-4 transition-colors"
      >
        <div className="h-3 w-3 shrink-0 rounded-[3px]" style={{ backgroundColor: group.areaColor }} />
        <div className="min-w-0 flex-1 text-left">
          <div className="flex items-center justify-between gap-4 mb-2">
            <span className="font-display font-600 text-text text-[14px]">{group.areaName}</span>
            <span className="text-text-muted text-[11px] shrink-0">
              {group.allocations.length} subcategoria{group.allocations.length !== 1 ? "s" : ""}
            </span>
          </div>
          {hasExpense && (
            <div className="mb-1.5">
              <div className="flex items-center justify-between mb-1">
                <span className="text-text-muted text-[11px]">
                  Despesas · {formatCurrency(group.expenseSpent / 100)}
                  <span className="text-text-muted/60"> / {formatCurrency(group.expenseAllocated / 100)}</span>
                </span>
                <span className={cn("text-[11px]", expenseOver ? "text-red" : "text-text-muted")}>
                  {expenseOver
                    ? `+${formatCurrency(Math.abs(expenseRemaining) / 100)}`
                    : `${formatPercentNeutral(expensePct)}%`}
                </span>
              </div>
              <ProgressBar value={group.expenseSpent} max={group.expenseAllocated} height={4} color="var(--red)" />
            </div>
          )}
          {hasIncome && (
            <div>
              <div className="flex items-center justify-between mb-1">
                <span className="text-text-muted text-[11px]">
                  Receitas · {formatCurrency(group.incomeSpent / 100)}
                  <span className="text-text-muted/60"> / {formatCurrency(group.incomeAllocated / 100)}</span>
                </span>
                <span className="text-green text-[11px]">{formatPercentNeutral(incomePct)}%</span>
              </div>
              <ProgressBar value={group.incomeSpent} max={group.incomeAllocated} height={4} color="var(--green)" />
            </div>
          )}
        </div>
        {open
          ? <ChevronUp size={14} className="text-text-muted shrink-0" />
          : <ChevronDown size={14} className="text-text-muted shrink-0" />}
      </button>

      {open && (
        <div className="border-border flex flex-col gap-3 border-t px-4 pb-4 pt-3">
          {group.allocations.map((alloc) => {
            const color = getCategoryColor(alloc.categoryColor, alloc.categoryName);
            const over = alloc.spentPercentage > 100;
            return (
              <div key={alloc.id} className="border-l-2 pl-4" style={{ borderColor: `${color}60` }}>
                <div className="mb-1.5 flex items-center justify-between">
                  <div className="flex min-w-0 items-center gap-2">
                    {alloc.subCategoryEmoji && (
                      <span className="shrink-0 text-[13px] leading-none">{alloc.subCategoryEmoji}</span>
                    )}
                    <span className="text-text truncate text-[13px]">{alloc.subCategoryName}</span>
                    <span className="text-text-muted shrink-0 text-[11px]">· {alloc.categoryName}</span>
                  </div>
                  <div className="ml-2 flex shrink-0 items-center gap-2">
                    <span className={cn("font-mono text-[12px]", over ? "text-red" : "text-text-muted")}>
                      {formatCurrency(alloc.spent / 100)} / {formatCurrency(alloc.allocated / 100)}
                    </span>
                  </div>
                </div>
                <ProgressBar value={alloc.spent} max={alloc.allocated} height={3} color={color} />
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

type Props = {
  budget: Budget | null;
  onClose: () => void;
  onEdit: (budget: Budget) => void;
};

export function BudgetDetailDrawer({ budget, onClose, onEdit }: Props) {
  const activate = useActivateBudget();

  const open = !!budget;
  const areaGroups = budget ? groupByArea(budget.allocations ?? []) : [];

  const allocs = budget?.allocations ?? [];
  const totalExpenseAllocated = allocs.filter((a) => a.allocationType === "Expense").reduce((s, a) => s + a.allocated, 0);
  const totalExpenseSpent     = allocs.filter((a) => a.allocationType === "Expense").reduce((s, a) => s + a.spent, 0);
  const totalIncomeAllocated  = allocs.filter((a) => a.allocationType === "Income").reduce((s, a) => s + a.allocated, 0);
  const totalIncomeSpent      = allocs.filter((a) => a.allocationType === "Income").reduce((s, a) => s + a.spent, 0);
  const expensePct     = totalExpenseAllocated > 0 ? (totalExpenseSpent / totalExpenseAllocated) * 100 : 0;
  const incomePct      = totalIncomeAllocated  > 0 ? (totalIncomeSpent  / totalIncomeAllocated)  * 100 : 0;
  const expenseOver    = totalExpenseSpent > totalExpenseAllocated;
  const expenseRemaining = totalExpenseAllocated - totalExpenseSpent;
  const hasExpense = totalExpenseAllocated > 0;
  const hasIncome  = totalIncomeAllocated  > 0;

  const handleClose = () => onClose();

  return (
    <>
      {/* Backdrop */}
      <div
        className={cn(
          "fixed inset-0 z-40 transition-all duration-300",
          open ? "pointer-events-auto bg-black/40 backdrop-blur-sm" : "pointer-events-none opacity-0",
        )}
        onClick={handleClose}
        aria-hidden="true"
      />

      {/* Panel */}
      <div
        className={cn(
          "bg-surface border-border fixed inset-y-0 right-0 z-50 flex w-full max-w-[480px] flex-col border-l shadow-2xl transition-transform duration-300 ease-out",
          open ? "translate-x-0" : "translate-x-full",
        )}
      >
        {/* Header */}
        <div className="border-border flex items-center justify-between border-b px-6 py-5">
          <div className="flex min-w-0 items-center gap-2.5">
            {budget?.isActive && <Star size={14} className="fill-yellow text-yellow shrink-0" />}
            <h2 className="font-display font-600 text-text truncate text-[17px]">
              {budget?.name ?? "Orçamento"}
            </h2>
          </div>
          <button
            onClick={handleClose}
            className="text-text-muted hover:bg-surface2 hover:text-text flex h-8 w-8 items-center justify-center rounded-lg transition-colors"
          >
            <X size={16} />
          </button>
        </div>

        {/* Body */}
        {budget && (
          <div className="flex flex-1 flex-col gap-5 overflow-y-auto px-6 py-6">
            {/* KPI hero */}
            <div className="border-border bg-surface2 rounded-xl border p-5 flex flex-col gap-4">
              {hasExpense && (
                <div>
                  <div className="mb-2 flex items-end justify-between">
                    <div>
                      <p className="text-text-muted mb-0.5 text-[11px] uppercase tracking-[0.05em]">Despesas</p>
                      <p className="font-money font-600 text-text text-[24px] tracking-tight">
                        {formatCurrency(totalExpenseSpent / 100)}
                      </p>
                      <p className="text-text-muted mt-0.5 text-[12px]">
                        de {formatCurrency(totalExpenseAllocated / 100)}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className={cn("font-money font-600 text-[20px]", expenseOver ? "text-red" : "text-text-muted")}>
                        {formatPercentNeutral(expensePct)}%
                      </p>
                      <p className={cn("text-[11px]", expenseRemaining < 0 ? "text-red" : "text-text-muted")}>
                        {expenseRemaining < 0
                          ? `Estourado ${formatCurrency(Math.abs(expenseRemaining) / 100)}`
                          : `Restam ${formatCurrency(expenseRemaining / 100)}`}
                      </p>
                    </div>
                  </div>
                  <ProgressBar value={totalExpenseSpent} max={totalExpenseAllocated} height={7} color="var(--red)" />
                </div>
              )}
              {hasIncome && (
                <div>
                  <div className="mb-2 flex items-end justify-between">
                    <div>
                      <p className="text-text-muted mb-0.5 text-[11px] uppercase tracking-[0.05em]">Receitas</p>
                      <p className="font-money font-600 text-text text-[24px] tracking-tight">
                        {formatCurrency(totalIncomeSpent / 100)}
                      </p>
                      <p className="text-text-muted mt-0.5 text-[12px]">
                        de {formatCurrency(totalIncomeAllocated / 100)}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-money font-600 text-green text-[20px]">
                        {formatPercentNeutral(incomePct)}%
                      </p>
                    </div>
                  </div>
                  <ProgressBar value={totalIncomeSpent} max={totalIncomeAllocated} height={7} color="var(--green)" />
                </div>
              )}
            </div>

            {/* Meta */}
            <div className="border-border bg-surface2 divide-border flex flex-col divide-y rounded-xl border">
              <div className="flex items-center justify-between px-4 py-3">
                <span className="text-text-muted text-[13px]">Recorrência</span>
                <span className="text-text text-[13px] font-medium">
                  {RECURRENCE_LABELS[budget.recurrence] ?? budget.recurrence}
                </span>
              </div>
              <div className="flex items-center justify-between px-4 py-3">
                <span className="text-text-muted text-[13px]">Status</span>
                <span className={cn("text-[13px] font-medium", budget.isActive ? "text-green" : "text-text-muted")}>
                  {budget.isActive ? "Ativo" : "Inativo"}
                </span>
              </div>
              <div className="flex items-center justify-between px-4 py-3">
                <span className="text-text-muted text-[13px]">Áreas</span>
                <span className="text-text text-[13px] font-medium">{areaGroups.length}</span>
              </div>
              <div className="flex items-center justify-between px-4 py-3">
                <span className="text-text-muted text-[13px]">Subcategorias</span>
                <span className="text-text text-[13px] font-medium">{budget.allocations.length}</span>
              </div>
            </div>

            {/* Areas */}
            {areaGroups.length > 0 && (
              <div className="flex flex-col gap-3">
                <p className="text-text-sub text-[12px] font-semibold uppercase tracking-[0.06em]">Áreas</p>
                {areaGroups.map((g) => (
                  <AreaRow key={g.areaName} group={g} />
                ))}
              </div>
            )}

            {/* Activate if inactive */}
            {!budget.isActive && (
              <button
                onClick={() => activate.mutate(budget.id)}
                disabled={activate.isPending}
                className="border-border text-text-sub hover:bg-surface2 hover:text-text flex w-full items-center justify-center gap-2 rounded-xl border py-2.5 text-[13px] font-medium transition-colors disabled:opacity-50"
              >
                <Star size={14} />
                Tornar ativo
              </button>
            )}
          </div>
        )}

        {/* Footer */}
        <div className="border-border shrink-0 border-t px-6 py-4">
          <Button
            className="w-full"
            onClick={() => { onEdit(budget!); handleClose(); }}
          >
            <Pencil size={15} />
            Editar orçamento
          </Button>
        </div>
      </div>
    </>
  );
}

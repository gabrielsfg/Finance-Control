"use client";

import { useState } from "react";
import { ChevronDown, ChevronUp } from "lucide-react";
import { ProgressBar } from "@/components/shared/ProgressBar";
import { formatCurrency } from "@/lib/utils/formatCurrency";
import { formatPercentNeutral } from "@/lib/utils/formatNumber";
import { getCategoryColor } from "@/lib/config/categoryColors";
import { cn } from "@/lib/utils";
import type { BudgetAllocation } from "@/lib/types/budgets.types";

export type AreaGroup = {
  areaName: string;
  areaColor: string;
  expenseAllocated: number;
  expenseSpent: number;
  incomeAllocated: number;
  incomeSpent: number;
  allocations: BudgetAllocation[];
};

export function groupByArea(allocations: BudgetAllocation[]): AreaGroup[] {
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
  allocations: BudgetAllocation[];
};

export function BudgetAreaBreakdown({ allocations }: Props) {
  const areaGroups = groupByArea(allocations);
  if (areaGroups.length === 0) return null;

  return (
    <div className="flex flex-col gap-3">
      {areaGroups.map((g) => (
        <AreaRow key={g.areaName} group={g} />
      ))}
    </div>
  );
}

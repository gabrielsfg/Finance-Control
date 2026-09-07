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
  /** The synthetic area holding spend with no allocation. Never has a target. */
  isUnbudgeted: boolean;
};

/** A row with no allocation has no id of its own — see `isUnbudgeted` on the type. */
const allocationKey = (a: BudgetAllocation) =>
  a.isUnbudgeted ? `u-${a.subCategoryId}-${a.allocationType}` : `a-${a.id}`;

export function groupByArea(allocations: BudgetAllocation[]): AreaGroup[] {
  const map = new Map<string, AreaGroup>();
  for (const alloc of allocations) {
    const key = alloc.areaName;
    if (!map.has(key)) {
      map.set(key, {
        areaName: alloc.areaName,
        // The unbudgeted area holds unrelated categories, so the first one's colour would
        // be arbitrary. It is overspend by definition, so it takes the overspend colour.
        areaColor: alloc.isUnbudgeted
          ? "var(--clay)"
          : getCategoryColor(alloc.categoryColor, alloc.categoryName),
        expenseAllocated: 0,
        expenseSpent: 0,
        incomeAllocated: 0,
        incomeSpent: 0,
        allocations: [],
        isUnbudgeted: alloc.isUnbudgeted,
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
  // Planned areas first: the unbudgeted one is a consequence of the period, not part of
  // the plan being reviewed.
  return Array.from(map.values()).sort(
    (a, b) => Number(a.isUnbudgeted) - Number(b.isUnbudgeted),
  );
}

function AreaRow({ group }: { group: AreaGroup }) {
  const [open, setOpen] = useState(false);

  // A target is not what makes a block worth showing — spend is. The unbudgeted area has
  // no target at all, and gating on `allocated > 0` is what used to hide it entirely.
  const hasExpense = group.expenseAllocated > 0 || group.expenseSpent > 0;
  const hasIncome  = group.incomeAllocated  > 0 || group.incomeSpent  > 0;
  const hasExpenseTarget = group.expenseAllocated > 0;
  const hasIncomeTarget  = group.incomeAllocated  > 0;
  const expensePct  = hasExpenseTarget ? (group.expenseSpent / group.expenseAllocated) * 100 : 0;
  const incomePct   = hasIncomeTarget  ? (group.incomeSpent  / group.incomeAllocated)  * 100 : 0;
  const expenseOver = group.expenseSpent > group.expenseAllocated;
  const expenseRemaining = group.expenseAllocated - group.expenseSpent;

  return (
    <div className="rounded-[13px] border border-[var(--border-color)]">
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center gap-3 rounded-[13px] p-4 transition-colors hover:bg-[var(--surface2)]"
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
                  {hasExpenseTarget && (
                    <span className="text-text-muted/60"> / {formatCurrency(group.expenseAllocated / 100)}</span>
                  )}
                </span>
                <span className={cn("text-[11px]", expenseOver ? "text-red" : "text-text-muted")}>
                  {!hasExpenseTarget
                    ? "sem meta"
                    : expenseOver
                      ? `+${formatCurrency(Math.abs(expenseRemaining) / 100)}`
                      : `${formatPercentNeutral(expensePct)}%`}
                </span>
              </div>
              {/* No target means nothing to be a fraction of, so the bar reads as fully
                  consumed rather than as 0%. */}
              <ProgressBar
                value={group.expenseSpent}
                max={hasExpenseTarget ? group.expenseAllocated : group.expenseSpent}
                height={6}
                color={hasExpenseTarget ? group.areaColor : "var(--clay)"}
                tinted
              />
            </div>
          )}
          {hasIncome && (
            <div>
              <div className="flex items-center justify-between mb-1">
                <span className="text-text-muted text-[11px]">
                  Receitas · {formatCurrency(group.incomeSpent / 100)}
                  {hasIncomeTarget && (
                    <span className="text-text-muted/60"> / {formatCurrency(group.incomeAllocated / 100)}</span>
                  )}
                </span>
                <span className={cn("text-[11px]", hasIncomeTarget ? "text-green" : "text-text-muted")}>
                  {hasIncomeTarget ? `${formatPercentNeutral(incomePct)}%` : "sem meta"}
                </span>
              </div>
              <ProgressBar
                value={group.incomeSpent}
                max={hasIncomeTarget ? group.incomeAllocated : group.incomeSpent}
                height={6}
                color={hasIncomeTarget ? group.areaColor : "var(--moss)"}
                tinted
                overflowColor={group.areaColor}
              />
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
            const hasTarget = alloc.allocated > 0;
            const over = hasTarget ? alloc.spentPercentage > 100 : alloc.allocationType === "Expense";
            return (
              <div key={allocationKey(alloc)} className="border-l-2 pl-4" style={{ borderColor: `${color}60` }}>
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
                      {formatCurrency(alloc.spent / 100)}
                      {hasTarget && ` / ${formatCurrency(alloc.allocated / 100)}`}
                    </span>
                  </div>
                </div>
                <ProgressBar
                  value={alloc.spent}
                  max={hasTarget ? alloc.allocated : alloc.spent}
                  height={5}
                  color={hasTarget ? color : alloc.allocationType === "Income" ? "var(--moss)" : "var(--clay)"}
                  tinted
                  overflowColor={alloc.allocationType === "Income" ? color : "var(--clay)"}
                />
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

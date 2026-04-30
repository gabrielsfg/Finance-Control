"use client";

import { useState } from "react";
import { ChevronDown, ChevronUp } from "lucide-react";
import { ProgressBar } from "@/components/shared/ProgressBar";
import { SectionHeader } from "@/components/shared/SectionHeader";
import { formatCurrency } from "@/lib/utils/formatCurrency";
import { formatPercentNeutral } from "@/lib/utils/formatNumber";
import { getCategoryColor } from "@/lib/config/categoryColors";
import { cn } from "@/lib/utils";
import type { Budget, BudgetAllocation } from "@/lib/types/budgets.types";

const RECURRENCE_LABELS: Record<string, string> = {
  Monthly: "Mensal",
  Weekly: "Semanal",
  Biweekly: "Quinzenal",
  Quarterly: "Trimestral",
};

type AreaGroup = {
  areaName: string;
  areaColor: string;
  totalAllocated: number;
  totalSpent: number;
  allocations: BudgetAllocation[];
};

function groupByArea(allocations: BudgetAllocation[]): AreaGroup[] {
  const map = new Map<string, AreaGroup>();
  for (const alloc of allocations) {
    const key = alloc.areaName;
    if (!map.has(key)) {
      map.set(key, {
        areaName: alloc.areaName,
        areaColor: getCategoryColor(alloc.areaColor, alloc.areaName),
        totalAllocated: 0,
        totalSpent: 0,
        allocations: [],
      });
    }
    const group = map.get(key)!;
    group.totalAllocated += alloc.allocated;
    group.totalSpent += alloc.spent;
    group.allocations.push(alloc);
  }
  return Array.from(map.values());
}

type AreaRowProps = { group: AreaGroup };

const AreaRow = ({ group }: AreaRowProps) => {
  const [open, setOpen] = useState(false);
  const pct = group.totalAllocated > 0 ? (group.totalSpent / group.totalAllocated) * 100 : 0;
  const isOver = group.totalSpent > group.totalAllocated;
  const remaining = group.totalAllocated - group.totalSpent;

  return (
    <div className="border-border rounded-xl border">
      {/* Area header — clickable */}
      <button
        onClick={() => setOpen((v) => !v)}
        className="hover:bg-surface2/60 flex w-full items-center gap-3 rounded-xl p-4 transition-colors"
      >
        <div className="h-3 w-3 shrink-0 rounded-[3px]" style={{ backgroundColor: group.areaColor }} />
        <div className="min-w-0 flex-1 text-left">
          <div className="flex items-center justify-between gap-4">
            <span className="font-display font-600 text-text text-[14px]">{group.areaName}</span>
            <div className="flex items-center gap-3 shrink-0">
              <span className="font-money text-text text-[13px]">
                {formatCurrency(group.totalSpent / 100)}
                <span className="text-text-muted"> / {formatCurrency(group.totalAllocated / 100)}</span>
              </span>
              <span className={cn("font-mono text-[12px] w-10 text-right", isOver ? "text-red" : "text-text-muted")}>
                {formatPercentNeutral(pct)}%
              </span>
            </div>
          </div>
          <div className="mt-2">
            <ProgressBar value={group.totalSpent} max={group.totalAllocated} height={4} color={group.areaColor} />
          </div>
          <div className="mt-1 flex items-center justify-between">
            <span className="text-text-muted text-[11px]">{group.allocations.length} subcategoria{group.allocations.length !== 1 ? "s" : ""}</span>
            <span className={cn("text-[11px]", remaining < 0 ? "text-red" : "text-text-muted")}>
              {remaining < 0 ? `Estourado ${formatCurrency(Math.abs(remaining) / 100)}` : `Restam ${formatCurrency(remaining / 100)}`}
            </span>
          </div>
        </div>
        {open ? <ChevronUp size={14} className="text-text-muted shrink-0" /> : <ChevronDown size={14} className="text-text-muted shrink-0" />}
      </button>

      {/* Subcategories */}
      {open && (
        <div className="border-border border-t px-4 pb-4 pt-3 flex flex-col gap-3">
          {group.allocations.map((alloc) => {
            const color = getCategoryColor(alloc.categoryColor, alloc.categoryName);
            const over = alloc.spentPercentage > 100;
            return (
              <div key={alloc.id} className="pl-4 border-l-2" style={{ borderColor: `${color}60` }}>
                <div className="flex items-center justify-between mb-1.5">
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="text-text text-[13px] truncate">{alloc.subCategoryName}</span>
                    <span className="text-text-muted text-[11px] shrink-0">· {alloc.categoryName}</span>
                  </div>
                  <div className="flex items-center gap-2 shrink-0 ml-2">
                    <span className={cn("font-mono text-[12px]", over ? "text-red" : "text-text-muted")}>
                      {formatCurrency(alloc.spent / 100)} / {formatCurrency(alloc.allocated / 100)}
                    </span>
                    <span className={cn("font-mono text-[11px] w-10 text-right", over ? "text-red" : "text-text-muted")}>
                      {formatPercentNeutral(alloc.spentPercentage)}%
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
};

type Props = { budget: Budget };

export const BudgetCard = ({ budget }: Props) => {
  const [expanded, setExpanded] = useState(false);
  const isOver = budget.spentPercentage > 100;
  const remaining = budget.totalAllocated - budget.totalSpent;
  const areaGroups = groupByArea(budget.allocations);

  return (
    <div className="border-border bg-surface rounded-xl border p-5">
      <SectionHeader
        title={budget.name}
        subtitle={RECURRENCE_LABELS[budget.recurrence]}
        action={() => setExpanded((v) => !v)}
        actionLabel={expanded ? "Recolher" : "Ver áreas"}
      />

      {/* Totals */}
      <div className="mb-3 flex items-end justify-between">
        <div>
          <p className="font-money font-600 text-text text-[22px]">
            {formatCurrency(budget.totalSpent / 100)}
          </p>
          <p className="text-text-muted mt-0.5 text-[13px]">
            de {formatCurrency(budget.totalAllocated / 100)}
          </p>
        </div>
        <div className="text-right">
          <p className={cn("font-money font-600 text-[18px]", isOver ? "text-red" : "text-green")}>
            {formatPercentNeutral(budget.spentPercentage)}%
          </p>
          <p className={cn("text-[12px]", remaining < 0 ? "text-red" : "text-text-muted")}>
            {remaining < 0 ? "Estourado" : `Restam ${formatCurrency(remaining / 100)}`}
          </p>
        </div>
      </div>

      <ProgressBar value={budget.totalSpent} max={budget.totalAllocated} height={8} />

      {/* Area groups */}
      {expanded && (
        <div className="mt-5 flex flex-col gap-3">
          {areaGroups.map((group) => (
            <AreaRow key={group.areaName} group={group} />
          ))}
        </div>
      )}

      <button
        onClick={() => setExpanded((v) => !v)}
        className="text-text-muted hover:text-text-sub mt-4 flex w-full items-center justify-center gap-1 text-[12px] transition-colors"
      >
        {expanded ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
        {expanded ? "Recolher" : `${areaGroups.length} áreas · ${budget.allocations.length} subcategorias`}
      </button>
    </div>
  );
};

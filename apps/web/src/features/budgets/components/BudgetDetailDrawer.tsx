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
        areaColor: getCategoryColor(alloc.categoryColor, alloc.categoryName),
        totalAllocated: 0,
        totalSpent: 0,
        allocations: [],
      });
    }
    const g = map.get(key)!;
    g.totalAllocated += alloc.allocated;
    g.totalSpent += alloc.spent;
    g.allocations.push(alloc);
  }
  return Array.from(map.values());
}

function AreaRow({ group }: { group: AreaGroup }) {
  const [open, setOpen] = useState(false);
  const pct = group.totalAllocated > 0 ? (group.totalSpent / group.totalAllocated) * 100 : 0;
  const isOver = group.totalSpent > group.totalAllocated;
  const remaining = group.totalAllocated - group.totalSpent;

  return (
    <div className="border-border rounded-xl border">
      <button
        onClick={() => setOpen((v) => !v)}
        className="hover:bg-surface2/60 flex w-full items-center gap-3 rounded-xl p-4 transition-colors"
      >
        <div className="h-3 w-3 shrink-0 rounded-[3px]" style={{ backgroundColor: group.areaColor }} />
        <div className="min-w-0 flex-1 text-left">
          <div className="flex items-center justify-between gap-4">
            <span className="font-display font-600 text-text text-[14px]">{group.areaName}</span>
            <span className="font-money text-text shrink-0 text-[13px]">
              {formatCurrency(group.totalSpent / 100)}
              <span className="text-text-muted"> / {formatCurrency(group.totalAllocated / 100)}</span>
            </span>
          </div>
          <div className="mt-2">
            <ProgressBar value={group.totalSpent} max={group.totalAllocated} height={4} color={group.areaColor} />
          </div>
          <div className="mt-1 flex items-center justify-between">
            <span className="text-text-muted text-[11px]">
              {group.allocations.length} subcategoria{group.allocations.length !== 1 ? "s" : ""}
            </span>
            <span className={cn("text-[11px]", remaining < 0 ? "text-red" : "text-text-muted")}>
              {remaining < 0
                ? `Estourado ${formatCurrency(Math.abs(remaining) / 100)}`
                : `${formatPercentNeutral(pct)}%`}
            </span>
          </div>
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
  const isOver = !!budget && budget.spentPercentage > 100;
  const remaining = budget ? budget.totalAllocated - budget.totalSpent : 0;

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
            <div className="border-border bg-surface2 rounded-xl border p-5">
              <div className="mb-3 flex items-end justify-between">
                <div>
                  <p className="text-text-muted mb-0.5 text-[11px] uppercase tracking-[0.05em]">Gasto atual</p>
                  <p className="font-money font-600 text-text text-[26px] tracking-tight">
                    {formatCurrency(budget.totalSpent / 100)}
                  </p>
                  <p className="text-text-muted mt-0.5 text-[13px]">
                    de {formatCurrency(budget.totalAllocated / 100)}
                  </p>
                </div>
                <div className="text-right">
                  <p className={cn("font-money font-600 text-[22px]", isOver ? "text-red" : "text-green")}>
                    {formatPercentNeutral(budget.spentPercentage)}%
                  </p>
                  <p className={cn("text-[12px]", remaining < 0 ? "text-red" : "text-text-muted")}>
                    {remaining < 0
                      ? `Estourado ${formatCurrency(Math.abs(remaining) / 100)}`
                      : `Restam ${formatCurrency(remaining / 100)}`}
                  </p>
                </div>
              </div>
              <ProgressBar value={budget.totalSpent} max={budget.totalAllocated} height={8} />
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

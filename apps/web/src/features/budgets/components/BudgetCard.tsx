"use client";

import { useState } from "react";
import { Star, Pencil, Trash2 } from "lucide-react";
import { ProgressBar } from "@/components/shared/ProgressBar";
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
  onClick: () => void;
  onEdit: (budget: Budget) => void;
  inactive?: boolean;
};

export const BudgetCard = ({ budget, onClick, onEdit, inactive = false }: Props) => {
  const deleteBudget = useDeleteBudget();
  const [confirmDelete, setConfirmDelete] = useState(false);

  const isOver = budget.spentPercentage > 100;
  const remaining = budget.totalAllocated - budget.totalSpent;
  const areaCount = new Set((budget.allocations ?? []).map((a) => a.areaName)).size;

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
      {/* Clickable body */}
      <div className="cursor-pointer p-5" onClick={onClick}>
        {/* Header */}
        <div className="mb-4 flex items-start gap-2">
          {budget.isActive && (
            <Star size={13} className="fill-yellow text-yellow mt-0.5 shrink-0" title="Orçamento ativo" />
          )}
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <p className="font-display font-600 text-text truncate text-[15px]">{budget.name}</p>
              <StatusBadge pct={budget.spentPercentage} isActive={budget.isActive} />
            </div>
            <p className="text-text-muted mt-0.5 text-[12px]">
              {RECURRENCE_LABELS[budget.recurrence] ?? budget.recurrence}
            </p>
          </div>
        </div>

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

        <div className="mt-4">
          <span className="text-text-muted text-[12px]">
            {areaCount} área{areaCount !== 1 ? "s" : ""} · {(budget.allocations ?? []).length} subcategoria{(budget.allocations ?? []).length !== 1 ? "s" : ""}
          </span>
        </div>
      </div>

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

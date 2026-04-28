import { SectionHeader } from "@/components/shared/SectionHeader";
import { ProgressBar } from "@/components/shared/ProgressBar";
import { formatCurrency } from "@/lib/utils/formatCurrency";
import { formatPercentNeutral } from "@/lib/utils/formatNumber";
import { cn } from "@/lib/utils";
import type { BudgetSummary } from "@/lib/types/dashboard.types";

export const BudgetSummaryCard = ({ budget }: { budget: BudgetSummary }) => {
  const isOverBudget = budget.spentPercentage > 100;

  return (
    <div className="rounded-xl border border-border bg-surface p-4">
      <SectionHeader title="Orçamento do Mês" />
      <div className="mb-3 flex items-end justify-between">
        <div>
          <p className="font-money text-[20px] font-600 text-text">
            {formatCurrency(budget.totalSpent / 100)}
          </p>
          <p className="mt-0.5 text-[11px] text-text-muted">
            de {formatCurrency(budget.totalExpected / 100)}
          </p>
        </div>
        <p className={cn("font-money text-[14px] font-600", isOverBudget ? "text-red" : "text-green")}>
          {formatPercentNeutral(budget.spentPercentage)}%
        </p>
      </div>
      <ProgressBar value={budget.totalSpent} max={budget.totalExpected} height={8} />
      {isOverBudget && (
        <p className="mt-2 text-[11px] text-red">Orçamento estourado este mês</p>
      )}
    </div>
  );
};

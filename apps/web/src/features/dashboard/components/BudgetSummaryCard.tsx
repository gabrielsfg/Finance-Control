import { SectionHeader } from "@/components/shared/SectionHeader";
import { ProgressBar } from "@/components/shared/ProgressBar";
import { formatCurrency } from "@/lib/utils/formatCurrency";
import { formatPercentNeutral } from "@/lib/utils/formatNumber";
import { cn } from "@/lib/utils";
import type { BudgetSummary } from "@/lib/types/dashboard.types";

export const BudgetSummaryCard = ({ budget }: { budget: BudgetSummary }) => {
  const isOverBudget = budget.spentPercentage > 100;

  return (
    <div className="border-border bg-surface rounded-xl border p-4">
      <SectionHeader title="Orçamento do Mês" />
      <div className="mb-3 flex items-end justify-between">
        <div>
          <p className="font-money font-600 text-text text-[20px]">
            {formatCurrency(budget.totalSpent / 100)}
          </p>
          <p className="text-text-muted mt-0.5 text-[11px]">
            de {formatCurrency(budget.totalExpected / 100)}
          </p>
        </div>
        <p
          className={cn(
            "font-money font-600 text-[14px]",
            isOverBudget ? "text-red" : "text-green",
          )}
        >
          {formatPercentNeutral(budget.spentPercentage)}%
        </p>
      </div>
      <ProgressBar value={budget.totalSpent} max={budget.totalExpected} height={8} />
      {isOverBudget && <p className="text-red mt-2 text-[11px]">Orçamento estourado este mês</p>}
    </div>
  );
};

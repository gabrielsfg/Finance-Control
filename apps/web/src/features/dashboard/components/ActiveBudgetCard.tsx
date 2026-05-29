"use client";

import { useRouter } from "next/navigation";
import { Target, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ProgressBar } from "@/components/shared/ProgressBar";
import { SectionHeader } from "@/components/shared/SectionHeader";
import { formatCurrency } from "@/lib/utils/formatCurrency";
import { formatPercentNeutral } from "@/lib/utils/formatNumber";
import { cn } from "@/lib/utils";
import { getCategoryColor } from "@/lib/config/categoryColors";
import type { BudgetSummary } from "@/lib/types/dashboard.types";

type Props = {
  budget: BudgetSummary | null;
};

export const ActiveBudgetCard = ({ budget }: Props) => {
  const router = useRouter();

  if (!budget) {
    return (
      <div className="border-border bg-surface flex flex-col rounded-xl border p-5">
        <SectionHeader title="Orçamento Ativo" />
        <div className="flex flex-1 flex-col items-center justify-center py-4 text-center">
          <div className="bg-surface2 mb-3 flex h-10 w-10 items-center justify-center rounded-[10px]">
            <Target size={18} className="text-text-muted" strokeWidth={1.5} />
          </div>
          <p className="font-500 text-text-sub text-[14px]">Nenhum orçamento criado</p>
          <p className="text-text-muted mt-1 text-[13px]">
            Crie um orçamento para acompanhar seus gastos mensais.
          </p>
          <Button size="sm" className="mt-4" onClick={() => router.push("/budgets")}>
            Criar orçamento
          </Button>
        </div>
      </div>
    );
  }

  if (!budget.hasAllocations) {
    return (
      <div className="border-border bg-surface flex flex-col rounded-xl border p-5">
        <SectionHeader title="Orçamento Ativo" />
        <div className="flex flex-1 flex-col items-center justify-center py-4 text-center">
          <div className="bg-orange/10 mb-3 flex h-10 w-10 items-center justify-center rounded-[10px]">
            <AlertCircle size={18} className="text-orange" strokeWidth={1.5} />
          </div>
          <p className="font-500 text-text-sub text-[14px]">Sem valor alocado</p>
          <p className="text-text-muted mt-1 text-[13px]">
            Seu orçamento existe mas não tem valores definidos por categoria.
          </p>
          <Button size="sm" variant="outline" className="mt-4" onClick={() => router.push("/budgets")}>
            Alocar valores
          </Button>
        </div>
      </div>
    );
  }

  const isOverBudget = budget.spentPercentage > 100;

  return (
    <div className="border-border bg-surface flex flex-col rounded-xl border p-5">
      <SectionHeader
        title="Orçamento Ativo"
        action={() => router.push("/budgets")}
        actionLabel="Ver detalhes"
      />

      {/* Total */}
      <div className="mb-3 flex items-end justify-between">
        <div>
          <p className="font-money font-600 text-text text-[18px]">
            {formatCurrency(budget.totalSpent / 100)}
          </p>
          <p className="text-text-muted mt-0.5 text-[12px]">
            de {formatCurrency(budget.totalExpected / 100)}
          </p>
        </div>
        <p className={cn("font-money font-600 text-[13px]", isOverBudget ? "text-red" : "text-green")}>
          {formatPercentNeutral(budget.spentPercentage)}%
        </p>
      </div>
      <ProgressBar value={budget.totalSpent} max={budget.totalExpected} height={6} />
      {isOverBudget && (
        <p className="text-red mt-1.5 text-[12px]">Orçamento estourado este mês</p>
      )}

      {/* Top subcategories */}
      <div className="mt-4 flex flex-col gap-3">
        {budget.topSubCategories.map((sub) => {
          const color = getCategoryColor(sub.categoryColor, sub.categoryName);
          const over = sub.spentPercentage > 100;
          return (
            <div key={sub.subCategoryName}>
              <div className="mb-1.5 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {sub.subCategoryEmoji
                    ? <span className="text-[13px] leading-none">{sub.subCategoryEmoji}</span>
                    : <div className="h-2 w-2 rounded-[2px]" style={{ backgroundColor: color }} />
                  }
                  <span className="text-text-sub text-[13px]">{sub.subCategoryName}</span>
                </div>
                <span
                  className={cn(
                    "font-mono text-[12px]",
                    over ? "text-red" : "text-text-muted",
                  )}
                >
                  {formatCurrency(sub.spent / 100)} / {formatCurrency(sub.allocated / 100)}
                </span>
              </div>
              <ProgressBar value={sub.spent} max={sub.allocated} height={4} color={color} />
            </div>
          );
        })}
      </div>
    </div>
  );
};

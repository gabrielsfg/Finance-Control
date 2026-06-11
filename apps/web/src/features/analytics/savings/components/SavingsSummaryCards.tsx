"use client";

import { TrendingUp, TrendingDown, PiggyBank, Percent } from "lucide-react";
import { StatCard } from "@/components/shared/StatCard";
import { formatCurrency, formatPercentNeutral } from "@/lib/utils/index";
import type { SavingsDetailResponse } from "@/lib/types/analytics.types";

type Props = { detail: SavingsDetailResponse };

export function SavingsSummaryCards({ detail }: Props) {
  const savedSubText =
    detail.invested > 0
      ? `${formatCurrency(detail.invested / 100)} investido`
      : detail.goalContributions > 0
        ? `${formatCurrency(detail.goalContributions / 100)} guardado em metas`
        : undefined;

  return (
    <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
      <StatCard
        label="Recebido"
        value={detail.income / 100}
        subText={`Planejado: ${formatCurrency(detail.plannedIncome / 100)}`}
        icon={TrendingUp}
        iconColor="var(--green)"
      />
      <StatCard
        label="Gasto"
        value={detail.expense / 100}
        subText={`Planejado: ${formatCurrency(detail.plannedExpense / 100)}`}
        icon={TrendingDown}
        iconColor="var(--red)"
      />
      <StatCard
        label="Economizado"
        value={detail.savings / 100}
        subText={savedSubText}
        icon={PiggyBank}
        iconColor="var(--purple)"
      />
      <StatCard
        label="Taxa de Economia"
        value={detail.savingsRate ?? 0}
        format="percent"
        subText={
          detail.savingsRate === null
            ? "Sem receitas no período"
            : detail.plannedRate !== null
              ? `Meta do orçamento: ${formatPercentNeutral(detail.plannedRate, 1)}`
              : undefined
        }
        icon={Percent}
        iconColor="var(--blue)"
      />
    </div>
  );
}

"use client";

import { useState } from "react";
import Link from "next/link";
import { Loader2 } from "lucide-react";
import { AnalyticsHeader } from "./components/AnalyticsHeader";
import { PillSelect } from "@/components/shared/PillSelect";
import { useBudgets } from "@/features/budgets/hooks/useBudgets";
import { useSavingsPeriods, useSavingsDetail } from "./hooks/useAnalytics";
import { periodLabel } from "./savings/savingsPeriod";
import { SavingsSummaryCards } from "./savings/components/SavingsSummaryCards";
import { SavingsPlannedVsActualChart } from "./savings/components/SavingsPlannedVsActualChart";
import { SavingsRateHistoryChart } from "./savings/components/SavingsRateHistoryChart";
import { SavingsAdherenceCard } from "./savings/components/SavingsAdherenceCard";
import { SavingsLeaksCard } from "./savings/components/SavingsLeaksCard";
import { SavingsDestinationCard } from "./savings/components/SavingsDestinationCard";
import { SavingsAreaImpactCard } from "./savings/components/SavingsAreaImpactCard";

export function AnalyticsSavingsPage() {
  const { data: budgets = [], isLoading: budgetsLoading } = useBudgets();
  const [selectedBudgetId, setSelectedBudgetId] = useState<number | null>(null);
  const [selectedPeriodStart, setSelectedPeriodStart] = useState<string | null>(null);

  const budget =
    budgets.find((b) => b.id === selectedBudgetId) ??
    budgets.find((b) => b.isActive) ??
    budgets[0];

  const periodsQuery = useSavingsPeriods(budget?.id);
  const periods = periodsQuery.data?.periods ?? [];

  const currentPeriod = periods.find((p) => p.isCurrent) ?? periods[periods.length - 1];
  const effectivePeriodStart =
    selectedPeriodStart && periods.some((p) => p.periodStart === selectedPeriodStart)
      ? selectedPeriodStart
      : currentPeriod?.periodStart;

  const detailQuery = useSavingsDetail(budget?.id, effectivePeriodStart);

  if (budgetsLoading || periodsQuery.isLoading || detailQuery.isLoading) {
    return (
      <div className="flex h-full items-center justify-center">
        <Loader2 size={24} className="text-green animate-spin" />
      </div>
    );
  }

  if (budgets.length === 0) {
    return (
      <div className="flex flex-col gap-5">
        <AnalyticsHeader title="Economia" />
        <div className="border-border bg-surface flex h-64 flex-col items-center justify-center gap-2 rounded-2xl border">
          <p className="text-text-sub text-[14px]">
            Crie um orçamento para acompanhar quanto você economiza em cada período.
          </p>
          <Link href="/budgets" className="text-green text-[13px] hover:underline">
            Ir para Orçamentos
          </Link>
        </div>
      </div>
    );
  }

  if (periodsQuery.isError || detailQuery.isError || !periodsQuery.data || !detailQuery.data) {
    return (
      <div className="flex h-full items-center justify-center">
        <p className="text-text-sub text-[14px]">Erro ao carregar economia. Tente novamente.</p>
      </div>
    );
  }

  const summary = periodsQuery.data;
  const detail = detailQuery.data;

  const budgetOptions = [...budgets]
    .sort((a, b) => Number(b.isActive) - Number(a.isActive))
    .map((b) => ({ value: String(b.id), label: b.name }));

  const periodOptions = [...periods].reverse().map((p) => ({
    value: p.periodStart,
    label: `${periodLabel(p.periodStart, p.periodEnd)}${p.isCurrent ? " · atual" : ""}`,
  }));

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <AnalyticsHeader title="Economia" />
        <div className="flex items-center gap-2">
          {budgets.length > 1 && budget && (
            <PillSelect
              options={budgetOptions}
              value={String(budget.id)}
              onChange={(value) => {
                setSelectedBudgetId(Number(value));
                setSelectedPeriodStart(null);
              }}
            />
          )}
          {periodOptions.length > 0 && effectivePeriodStart && (
            <PillSelect
              options={periodOptions}
              value={effectivePeriodStart}
              onChange={setSelectedPeriodStart}
            />
          )}
        </div>
      </div>

      <SavingsSummaryCards detail={detail} />

      <div className="stagger grid grid-cols-1 gap-4 lg:grid-cols-2">
        <SavingsPlannedVsActualChart periods={periods} plannedSavings={summary.plannedSavings} />
        <SavingsRateHistoryChart
          periods={periods}
          plannedRate={summary.plannedRate}
          positiveStreak={summary.positiveStreak}
        />
      </div>

      <div className="stagger grid grid-cols-1 gap-4 lg:grid-cols-2">
        <SavingsAdherenceCard detail={detail} />
        <SavingsLeaksCard detail={detail} />
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-[380px_1fr]">
        <SavingsDestinationCard detail={detail} />
        <SavingsAreaImpactCard areas={detail.areas} />
      </div>
    </div>
  );
}

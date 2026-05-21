"use client";

import { Loader2 } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { DashboardStatsRow } from "@/features/dashboard/components/DashboardStatsRow";
import { RecentTransactions } from "@/features/dashboard/components/RecentTransactions";
import { MonthlyEvolutionChart } from "@/features/dashboard/components/MonthlyEvolutionChart";
import { SpendingPredictionChart } from "@/features/dashboard/components/SpendingPredictionChart";
import { CategoryDonutChart } from "@/features/dashboard/components/CategoryDonutChart";
import { AiInsightCard } from "@/features/dashboard/components/AiInsightCard";
import { ActiveBudgetCard } from "@/features/dashboard/components/ActiveBudgetCard";
import { UpcomingBillsCard } from "@/features/dashboard/components/UpcomingBillsCard";
import { useDashboard } from "@/features/dashboard/hooks/useDashboard";
import { useActiveBudget } from "@/features/budgets/hooks/useActiveBudget";
import { parseLocalDate } from "@/lib/utils/budgetPeriod";

function isoDate(d: Date): string {
  return d.toISOString().split("T")[0];
}

function getCurrentMonthRange() {
  const now = new Date();
  const start = new Date(now.getFullYear(), now.getMonth(), 1);
  const end = new Date(now.getFullYear(), now.getMonth() + 1, 0);
  return { startDate: isoDate(start), finishDate: isoDate(end) };
}

/** endDate from the budget is exclusive (first day of next period); dashboard API is inclusive */
function toInclusiveEnd(exclusiveEndIso: string): string {
  const d = new Date(exclusiveEndIso);
  d.setDate(d.getDate() - 1);
  return isoDate(d);
}

export function DashboardPage() {
  const { data: activeBudget, isLoading: budgetLoading } = useActiveBudget();

  const range = activeBudget
    ? { startDate: activeBudget.startDate, finishDate: toInclusiveEnd(activeBudget.endDate) }
    : getCurrentMonthRange();

  const periodLabel = activeBudget
    ? `${format(parseLocalDate(activeBudget.startDate), "d MMM", { locale: ptBR })} – ${format(parseLocalDate(activeBudget.endDate), "d MMM yyyy", { locale: ptBR })}`
    : format(new Date(), "MMMM yyyy", { locale: ptBR });

  const { data, isLoading, isError } = useDashboard({ ...range, budgetId: activeBudget?.budget.id });

  if (isLoading || budgetLoading) {
    return (
      <div className="flex h-full items-center justify-center">
        <Loader2 size={24} className="text-green animate-spin" />
      </div>
    );
  }

  if (isError || !data) {
    return (
      <div className="flex h-full items-center justify-center">
        <p className="text-text-sub text-[14px]">Erro ao carregar dados. Tente novamente.</p>
      </div>
    );
  }

  const { balanceSummary, recentTransactions, budgetSummary, topCategories, spendingPrediction } = data;

  return (
    <div className="flex flex-col gap-5">
      <div>
        <h1 className="font-display font-700 text-text text-[22px] tracking-tight">Dashboard</h1>
        <p className="text-text-muted mt-0.5 text-[13px] capitalize">{periodLabel}</p>
      </div>

      <DashboardStatsRow balanceSummary={balanceSummary} currentMonth={periodLabel} />

      <SpendingPredictionChart data={spendingPrediction ?? []} />

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-[1fr_340px] lg:min-h-[360px]">
        <MonthlyEvolutionChart />
        <CategoryDonutChart categories={topCategories} />
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-[1fr_340px]">
        <RecentTransactions transactions={recentTransactions} />
        <div className="flex flex-col gap-4">
          <AiInsightCard />
          <ActiveBudgetCard budget={budgetSummary ?? null} />
        </div>
      </div>

      <UpcomingBillsCard />
    </div>
  );
}

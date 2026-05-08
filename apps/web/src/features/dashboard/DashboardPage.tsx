"use client";

import { Loader2 } from "lucide-react";
import { DashboardStatsRow } from "@/features/dashboard/components/DashboardStatsRow";
import { RecentTransactions } from "@/features/dashboard/components/RecentTransactions";
import { MonthlyEvolutionChart } from "@/features/dashboard/components/MonthlyEvolutionChart";
import { CategoryDonutChart } from "@/features/dashboard/components/CategoryDonutChart";
import { AiInsightCard } from "@/features/dashboard/components/AiInsightCard";
import { ActiveBudgetCard } from "@/features/dashboard/components/ActiveBudgetCard";
import { UpcomingBillsCard } from "@/features/dashboard/components/UpcomingBillsCard";
import { useDashboard } from "@/features/dashboard/hooks/useDashboard";
import { formatDateMonth } from "@/lib/utils/formatDate";

export function DashboardPage() {
  const { data, isLoading, isError } = useDashboard();
  const currentMonth = formatDateMonth(new Date());

  if (isLoading) {
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

  const { balanceSummary, recentTransactions, budgetSummary, topCategories } = data;

  return (
    <div className="flex flex-col gap-5">
      <div>
        <h1 className="font-display font-700 text-text text-[22px] tracking-tight">Dashboard</h1>
        <p className="text-text-muted mt-0.5 text-[13px] capitalize">{currentMonth}</p>
      </div>

      <DashboardStatsRow balanceSummary={balanceSummary} currentMonth={currentMonth} />

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

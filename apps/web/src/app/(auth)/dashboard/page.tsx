"use client";

import { ArrowUp, ArrowDown, Target, Loader2 } from "lucide-react";
import { StatCard } from "@/components/shared/StatCard";
import { RecentTransactions } from "@/features/dashboard/components/RecentTransactions";
import { MonthlyEvolutionChart } from "@/features/dashboard/components/MonthlyEvolutionChart";
import { CategoryDonutChart } from "@/features/dashboard/components/CategoryDonutChart";
import { AiInsightCard } from "@/features/dashboard/components/AiInsightCard";
import { ActiveBudgetCard } from "@/features/dashboard/components/ActiveBudgetCard";
import { useDashboard } from "@/features/dashboard/hooks/useDashboard";
import { formatCurrency } from "@/lib/utils/formatCurrency";
import { formatPercent } from "@/lib/utils/formatNumber";
import { formatDateMonth } from "@/lib/utils/formatDate";

export default function DashboardPage() {
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
  const savingsRate =
    balanceSummary.totalIncome > 0
      ? (balanceSummary.balance / balanceSummary.totalIncome) * 100
      : 0;

  return (
    <div className="flex flex-col gap-5">
      {/* Header */}
      <div>
        <h1 className="font-display font-700 text-text text-[22px] tracking-tight">Dashboard</h1>
        <p className="text-text-muted mt-0.5 text-[13px] capitalize">{currentMonth}</p>
      </div>

      {/* Net Worth Hero */}
      <div
        className="border-border flex items-center justify-between rounded-[16px] border px-8 py-7"
        style={{
          background: "linear-gradient(135deg, var(--surface) 0%, var(--surface2) 100%)",
        }}
      >
        <div>
          <p className="font-display font-600 text-text mb-2 text-[15px] tracking-tight">
            Patrimônio Líquido
          </p>
          <p
            className="font-money font-600 text-[40px] tracking-tight"
            style={{ color: balanceSummary.balance >= 0 ? "var(--green)" : "var(--red)" }}
          >
            {formatCurrency(
              (balanceSummary.totalIncome - balanceSummary.totalExpenses) / 100,
            )}
          </p>
          <div className="mt-2 flex items-center gap-2">
            <span className="bg-green/12 text-green rounded-full px-2.5 py-0.5 font-mono text-[13px]">
              {formatPercent(savingsRate)} de poupança
            </span>
          </div>
        </div>
        <div className="hidden text-right sm:block">
          <p className="font-display font-600 text-text text-[13px]">Receitas</p>
          <p className="font-money font-600 text-green text-[16px]">
            +{formatCurrency(balanceSummary.totalIncome / 100)}
          </p>
          <p className="font-display font-600 text-text mt-2 text-[13px]">Despesas</p>
          <p className="font-money font-600 text-red text-[16px]">
            -{formatCurrency(balanceSummary.totalExpenses / 100)}
          </p>
        </div>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <StatCard
          label={`Receitas — ${currentMonth}`}
          value={balanceSummary.totalIncome / 100}
          change={balanceSummary.incomeChange}
          icon={ArrowUp}
          iconColor="#00C98D"
        />
        <StatCard
          label={`Despesas — ${currentMonth}`}
          value={balanceSummary.totalExpenses / 100}
          change={balanceSummary.expenseChange}
          lowerIsBetter
          icon={ArrowDown}
          iconColor="#F25F5C"
        />
        <StatCard
          label={`Saldo — ${currentMonth}`}
          value={balanceSummary.balance / 100}
          change={balanceSummary.balanceChange}
          icon={Target}
          iconColor="#7C6FE0"
        />
      </div>

      {/* Charts Row — mesmo grid row = mesma altura automaticamente */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-[1fr_340px] lg:min-h-[360px]">
        <MonthlyEvolutionChart />
        {topCategories.length > 0 && <CategoryDonutChart categories={topCategories} />}
      </div>

      {/* Bottom Row */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-[1fr_340px]">
        <RecentTransactions transactions={recentTransactions} />
        <div className="flex flex-col gap-4">
          <AiInsightCard />
          <ActiveBudgetCard budget={budgetSummary ?? null} />
        </div>
      </div>
    </div>
  );
}

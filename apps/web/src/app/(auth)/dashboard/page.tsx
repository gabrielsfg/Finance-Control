"use client";

import { ArrowUp, ArrowDown, Target, Loader2 } from "lucide-react";
import { StatCard } from "@/components/shared/StatCard";
import { RecentTransactions } from "@/features/dashboard/components/RecentTransactions";
import { BudgetSummaryCard } from "@/features/dashboard/components/BudgetSummaryCard";
import { TopCategoriesCard } from "@/features/dashboard/components/TopCategoriesCard";
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
          <p className="text-text-muted mb-2 text-[12px] tracking-[0.06em] uppercase">
            Saldo do Mês
          </p>
          <p
            className="font-money font-600 text-[40px] tracking-tight"
            style={{ color: balanceSummary.balance >= 0 ? "var(--green)" : "var(--red)" }}
          >
            {formatCurrency(balanceSummary.balance / 100)}
          </p>
          <div className="mt-2 flex items-center gap-2">
            <span className="bg-green/12 text-green rounded-full px-2.5 py-0.5 font-mono text-[12px]">
              {formatPercent(savingsRate)} de poupança
            </span>
          </div>
        </div>
        <div className="hidden text-right sm:block">
          <p className="text-text-muted text-[12px]">Receitas</p>
          <p className="font-money font-600 text-green text-[16px]">
            +{formatCurrency(balanceSummary.totalIncome / 100)}
          </p>
          <p className="text-text-muted mt-2 text-[12px]">Despesas</p>
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
          icon={ArrowUp}
          iconColor="#00C98D"
        />
        <StatCard
          label={`Despesas — ${currentMonth}`}
          value={balanceSummary.totalExpenses / 100}
          icon={ArrowDown}
          iconColor="#F25F5C"
        />
        <StatCard
          label={`Saldo — ${currentMonth}`}
          value={balanceSummary.balance / 100}
          icon={Target}
          iconColor="#7C6FE0"
        />
      </div>

      {/* Bottom Row */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-[1fr_340px]">
        <RecentTransactions transactions={recentTransactions} />

        <div className="flex flex-col gap-4">
          {budgetSummary && <BudgetSummaryCard budget={budgetSummary} />}
          {topCategories.length > 0 && <TopCategoriesCard categories={topCategories} />}
        </div>
      </div>
    </div>
  );
}

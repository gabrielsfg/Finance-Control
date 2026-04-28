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
        <Loader2 size={24} className="animate-spin text-green" />
      </div>
    );
  }

  if (isError || !data) {
    return (
      <div className="flex h-full items-center justify-center">
        <p className="text-[14px] text-text-sub">Erro ao carregar dados. Tente novamente.</p>
      </div>
    );
  }

  const { balanceSummary, recentTransactions, budgetSummary, topCategories } = data;
  const savingsRate =
    balanceSummary.totalIncome > 0
      ? ((balanceSummary.balance / balanceSummary.totalIncome) * 100)
      : 0;

  return (
    <div className="flex flex-col gap-5">
      {/* Header */}
      <div>
        <h1 className="font-display text-[22px] font-700 tracking-tight text-text">Dashboard</h1>
        <p className="mt-0.5 text-[13px] text-text-muted capitalize">{currentMonth}</p>
      </div>

      {/* Net Worth Hero */}
      <div
        className="flex items-center justify-between rounded-[16px] border border-border px-8 py-7"
        style={{
          background: "linear-gradient(135deg, var(--surface) 0%, var(--surface2) 100%)",
        }}
      >
        <div>
          <p className="mb-2 text-[12px] uppercase tracking-[0.06em] text-text-muted">
            Saldo do Mês
          </p>
          <p
            className="font-money text-[40px] font-600 tracking-tight"
            style={{ color: balanceSummary.balance >= 0 ? "var(--green)" : "var(--red)" }}
          >
            {formatCurrency(balanceSummary.balance / 100)}
          </p>
          <div className="mt-2 flex items-center gap-2">
            <span className="rounded-full bg-green/12 px-2.5 py-0.5 font-mono text-[12px] text-green">
              {formatPercent(savingsRate)} de poupança
            </span>
          </div>
        </div>
        <div className="hidden text-right sm:block">
          <p className="text-[12px] text-text-muted">Receitas</p>
          <p className="font-money text-[16px] font-600 text-green">
            +{formatCurrency(balanceSummary.totalIncome / 100)}
          </p>
          <p className="mt-2 text-[12px] text-text-muted">Despesas</p>
          <p className="font-money text-[16px] font-600 text-red">
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

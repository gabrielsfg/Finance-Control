"use client";

import { ArrowUp, ArrowDown, Target } from "lucide-react";
import { StatCard } from "@/components/shared/StatCard";
import { SavingsRateCard } from "@/features/dashboard/components/SavingsRateCard";
import type { BalanceSummary } from "@/lib/types/dashboard.types";

type Props = {
  balanceSummary: BalanceSummary;
  currentMonth: string;
  savingsRate: number;
};

export const DashboardStatsRow = ({ balanceSummary, currentMonth, savingsRate }: Props) => (
  <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
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
      showNegative
      icon={ArrowDown}
      iconColor="#F25F5C"
    />
    <StatCard
      label={`Saldo — ${currentMonth}`}
      value={Math.abs(balanceSummary.balance / 100)}
      change={balanceSummary.balanceChange}
      showNegative={balanceSummary.balance < 0}
      icon={Target}
      iconColor="#7C6FE0"
    />
    <SavingsRateCard savingsRate={savingsRate} />
  </div>
);

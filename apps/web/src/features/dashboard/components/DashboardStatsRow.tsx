"use client";

import { ArrowUp, ArrowDown, Target } from "lucide-react";
import { StatCard } from "@/components/shared/StatCard";
import type { BalanceSummary } from "@/lib/types/dashboard.types";

type Props = {
  balanceSummary: BalanceSummary;
  currentMonth: string;
};

export const DashboardStatsRow = ({ balanceSummary, currentMonth }: Props) => (
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
  </div>
);

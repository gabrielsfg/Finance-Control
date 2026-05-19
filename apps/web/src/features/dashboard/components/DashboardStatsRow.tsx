"use client";

import { ArrowUp, ArrowDown, Wallet2, TrendingUp } from "lucide-react";
import { StatCard } from "@/components/shared/StatCard";
import type { BalanceSummary } from "@/lib/types/dashboard.types";

type Props = {
  balanceSummary: BalanceSummary;
  currentMonth: string;
};

export const DashboardStatsRow = ({ balanceSummary, currentMonth }: Props) => {
  const netWorth = (balanceSummary.netWorth ?? 0) / 100;

  return (
    <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
      <StatCard
        label="Patrimônio Líquido"
        value={netWorth}
        change={balanceSummary.netWorthChange}
        previousValue={balanceSummary.previousNetWorth !== undefined ? balanceSummary.previousNetWorth / 100 : undefined}
        icon={TrendingUp}
        iconColor="#4A9EFF"
      />
      <StatCard
        label={`Receitas — ${currentMonth}`}
        value={balanceSummary.totalIncome / 100}
        change={balanceSummary.incomeChange}
        previousValue={balanceSummary.previousIncome !== undefined ? balanceSummary.previousIncome / 100 : undefined}
        icon={ArrowUp}
        iconColor="#00C98D"
      />
      <StatCard
        label={`Despesas — ${currentMonth}`}
        value={-(balanceSummary.totalExpenses / 100)}
        change={balanceSummary.expenseChange}
        previousValue={balanceSummary.previousExpenses !== undefined ? balanceSummary.previousExpenses / 100 : undefined}
        lowerIsBetter
        icon={ArrowDown}
        iconColor="#F25F5C"
      />
      <StatCard
        label={`Saldo — ${currentMonth}`}
        value={balanceSummary.balance / 100}
        change={balanceSummary.balanceChange}
        previousValue={balanceSummary.previousBalance !== undefined ? balanceSummary.previousBalance / 100 : undefined}
        icon={Wallet2}
        iconColor="#7C6FE0"
      />
    </div>
  );
};

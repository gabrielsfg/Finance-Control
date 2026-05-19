"use client";

import { ArrowUpRight, ArrowDownRight, Wallet } from "lucide-react";
import { StatCard } from "@/components/shared/StatCard";

type Props = {
  totalIncome: number;
  totalExpense: number;
  balance: number;
  previousTotalIncome?: number;
  previousTotalExpense?: number;
  previousBalance?: number;
};

function pctChange(current: number, previous: number | undefined): number | undefined {
  if (previous === undefined || previous === 0) return undefined;
  return ((current - previous) / Math.abs(previous)) * 100;
}

export const TransactionsSummary = ({
  totalIncome,
  totalExpense,
  balance,
  previousTotalIncome,
  previousTotalExpense,
  previousBalance,
}: Props) => (
  <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
    <StatCard
      label="Receitas"
      value={totalIncome / 100}
      icon={ArrowUpRight}
      iconColor="#00C98D"
      change={pctChange(totalIncome, previousTotalIncome)}
      previousValue={previousTotalIncome !== undefined ? previousTotalIncome / 100 : undefined}
    />
    <StatCard
      label="Despesas"
      value={-(totalExpense / 100)}
      icon={ArrowDownRight}
      iconColor="#F25F5C"
      change={pctChange(totalExpense, previousTotalExpense)}
      previousValue={previousTotalExpense !== undefined ? previousTotalExpense / 100 : undefined}
      lowerIsBetter
    />
    <StatCard
      label="Saldo"
      value={balance / 100}
      icon={Wallet}
      iconColor="#4A9EFF"
      change={pctChange(balance, previousBalance)}
      previousValue={previousBalance !== undefined ? previousBalance / 100 : undefined}
    />
  </div>
);

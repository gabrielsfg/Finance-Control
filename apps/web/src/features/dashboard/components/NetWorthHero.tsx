"use client";

import { TrendingUp, TrendingDown } from "lucide-react";
import { formatCurrency } from "@/lib/utils/formatCurrency";
import { formatPercent } from "@/lib/utils/formatNumber";
import type { BalanceSummary } from "@/lib/types/dashboard.types";

type Props = {
  balanceSummary: BalanceSummary;
  savingsRate: number;
};

const FX_PAIRS = [
  { pair: "USD/BRL", rate: 5.72, change: +0.34 },
  { pair: "EUR/BRL", rate: 6.41, change: -0.12 },
];

export const NetWorthHero = ({ balanceSummary, savingsRate }: Props) => {
  const netWorth = (balanceSummary.totalIncome - balanceSummary.totalExpenses) / 100;

  return (
    <div
      className="border-border flex items-center justify-between rounded-[16px] border px-8 py-7"
      style={{
        background: "linear-gradient(135deg, var(--surface) 0%, var(--surface2) 100%)",
      }}
    >
      <div>
        <p className="font-display font-700 text-text mb-2 text-[18px] tracking-tight">
          Patrimônio Líquido
        </p>
        <p
          className="font-money font-600 text-[40px] tracking-tight"
          style={{ color: netWorth >= 0 ? "var(--green)" : "var(--red)" }}
        >
          {formatCurrency(netWorth)}
        </p>
        <div className="mt-2 flex items-center gap-2">
          <span className="bg-green/12 text-green rounded-full px-2.5 py-0.5 font-mono text-[13px]">
            {formatPercent(savingsRate)}
          </span>
          <span className="text-text-muted font-mono text-[13px]">vs. mês anterior</span>
        </div>
      </div>

      <div className="hidden items-center gap-6 sm:flex">
        {/* FX inline */}
        <div className="border-border/50 flex flex-col gap-2 border-r pr-6">
          {FX_PAIRS.map(({ pair, rate, change }) => {
            const up = change >= 0;
            return (
              <div key={pair} className="flex items-center gap-2">
                <span className="text-text-muted w-[60px] text-right font-mono text-[11px]">{pair}</span>
                <span className="font-money font-600 text-text text-[13px]">
                  {rate.toFixed(2)}
                </span>
                <span className={`flex items-center gap-0.5 font-mono text-[11px] ${up ? "text-green" : "text-red"}`}>
                  {up ? <TrendingUp size={10} /> : <TrendingDown size={10} />}
                  {up ? "+" : ""}{change.toFixed(2)}%
                </span>
              </div>
            );
          })}
        </div>

        {/* Income / Expense summary */}
        <div className="text-right">
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
    </div>
  );
};

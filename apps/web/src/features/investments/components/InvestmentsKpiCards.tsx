"use client";

import { TrendingUp, DollarSign, ArrowUpDown, Percent } from "lucide-react";
import { cn } from "@/lib/utils";
import { formatCurrency } from "@/lib/utils/formatCurrency";
import { formatPercentNeutral } from "@/lib/utils/formatNumber";
import type { InvestmentPortfolio } from "@/lib/types/investments.types";

type Props = { summary: InvestmentPortfolio };

export const InvestmentsKpiCards = ({ summary }: Props) => {
  const gainLoss         = summary.currentValue - summary.totalInvested;
  const gainLossPositive = gainLoss >= 0;
  const returnPositive   = summary.totalReturn >= 0;
  const yieldPositive    = summary.totalReturnPercent >= 0;

  return (
    <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
      {/* Patrimônio Total */}
      <div className="border-border bg-surface rounded-xl border p-5">
        <div className="mb-3 flex items-center justify-between">
          <span className="text-text-muted text-[12px] uppercase tracking-[0.04em]">Patrimônio Total</span>
          <div className="flex h-8 w-8 items-center justify-center rounded-[8px]" style={{ backgroundColor: "#00c98d18" }}>
            <DollarSign size={15} strokeWidth={1.75} style={{ color: "var(--green)" }} />
          </div>
        </div>
        <p className="font-money font-600 text-green text-[22px]">{formatCurrency(summary.currentValue / 100)}</p>
        <p className="mt-1.5 text-text-sub text-[12px]">
          Patrimônio investido: {formatCurrency(summary.totalInvested / 100)}
        </p>
      </div>

      {/* Retorno Total */}
      <div className="border-border bg-surface rounded-xl border p-5">
        <div className="mb-3 flex items-center justify-between">
          <span className="text-text-muted text-[12px] uppercase tracking-[0.04em]">Retorno Total</span>
          <div className="flex h-8 w-8 items-center justify-center rounded-[8px]" style={{ backgroundColor: returnPositive ? "#00c98d18" : "#f25f5c18" }}>
            <TrendingUp size={15} strokeWidth={1.75} style={{ color: returnPositive ? "var(--green)" : "var(--red)" }} />
          </div>
        </div>
        <p className={cn("font-money font-600 text-[22px]", returnPositive ? "text-green" : "text-red")}>
          {formatCurrency(Math.abs(summary.totalReturn) / 100)}
        </p>
        <p className="mt-1.5 flex flex-wrap items-baseline gap-1">
          <span className={cn("font-mono text-[12px] font-medium", returnPositive ? "text-green" : "text-red")}>
            {formatPercentNeutral(Math.abs(summary.totalReturnPercent))}
          </span>
          <span className="text-text-muted text-[12px]">sobre o aporte</span>
        </p>
      </div>

      {/* Variação */}
      <div className="border-border bg-surface rounded-xl border p-5">
        <div className="mb-3 flex items-center justify-between">
          <span className="text-text-muted text-[12px] uppercase tracking-[0.04em]">Variação</span>
          <div className="flex h-8 w-8 items-center justify-center rounded-[8px]" style={{ backgroundColor: gainLossPositive ? "#00c98d18" : "#f25f5c18" }}>
            <ArrowUpDown size={15} strokeWidth={1.75} style={{ color: gainLossPositive ? "var(--green)" : "var(--red)" }} />
          </div>
        </div>
        <p className={cn("font-money font-600 text-[22px]", gainLossPositive ? "text-green" : "text-red")}>
          {formatPercentNeutral(Math.abs(summary.totalReturnPercent))}
        </p>
        <p className="mt-1.5">
          <span className={cn("font-mono text-[12px] font-medium", gainLossPositive ? "text-green" : "text-red")}>
            {formatCurrency(Math.abs(gainLoss) / 100)}
          </span>
          <span className="text-text-muted text-[12px] ml-1">em valor</span>
        </p>
      </div>

      {/* Rentabilidade */}
      <div className="border-border bg-surface rounded-xl border p-5">
        <div className="mb-3 flex items-center justify-between">
          <span className="text-text-muted text-[12px] uppercase tracking-[0.04em]">Rentabilidade</span>
          <div className="flex h-8 w-8 items-center justify-center rounded-[8px]" style={{ backgroundColor: yieldPositive ? "#00c98d18" : "#f25f5c18" }}>
            <Percent size={15} strokeWidth={1.75} style={{ color: yieldPositive ? "var(--green)" : "var(--red)" }} />
          </div>
        </div>
        <p className={cn("font-money font-600 text-[22px]", yieldPositive ? "text-green" : "text-red")}>
          {formatPercentNeutral(Math.abs(summary.totalReturnPercent))}
        </p>
      </div>
    </div>
  );
};

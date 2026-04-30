"use client";

import { formatCurrency } from "@/lib/utils/formatCurrency";
import { formatPercent } from "@/lib/utils/formatNumber";
import { cn } from "@/lib/utils";
import type { InvestmentSummary } from "@/lib/types/investments.types";

type Props = { summary: InvestmentSummary };

export const InvestmentsSummaryHero = ({ summary }: Props) => {
  const isPositive = summary.totalReturn >= 0;

  return (
    <div
      className="border-border flex flex-wrap items-center justify-between gap-6 rounded-[16px] border px-8 py-7"
      style={{ background: "linear-gradient(135deg, var(--surface) 0%, var(--surface2) 100%)" }}
    >
      <div>
        <p className="font-display font-700 text-text mb-1 text-[18px] tracking-tight">
          Patrimônio Investido
        </p>
        <p className="font-money font-600 text-[40px] tracking-tight" style={{ color: "var(--green)" }}>
          {formatCurrency(summary.currentValue / 100)}
        </p>
        <div className="mt-2 flex items-center gap-2">
          <span className={cn(
            "rounded-full px-2.5 py-0.5 font-mono text-[13px]",
            isPositive ? "bg-green/12 text-green" : "bg-red/12 text-red",
          )}>
            {formatPercent(summary.totalReturnPercent)}
          </span>
          <span className="text-text-muted font-mono text-[13px]">rentabilidade total</span>
        </div>
      </div>

      <div className="flex gap-8 text-right">
        <div>
          <p className="text-text-muted text-[12px] uppercase tracking-[0.06em]">Investido</p>
          <p className="font-money font-600 text-text text-[20px]">
            {formatCurrency(summary.totalInvested / 100)}
          </p>
        </div>
        <div>
          <p className="text-text-muted text-[12px] uppercase tracking-[0.06em]">Retorno</p>
          <p className={cn("font-money font-600 text-[20px]", isPositive ? "text-green" : "text-red")}>
            {isPositive ? "+" : ""}{formatCurrency(summary.totalReturn / 100)}
          </p>
        </div>
        <div>
          <p className="text-text-muted text-[12px] uppercase tracking-[0.06em]">Ativos</p>
          <p className="font-money font-600 text-text text-[20px]">{summary.investments.length}</p>
        </div>
      </div>
    </div>
  );
};

"use client";

import { TrendingUp, DollarSign, BarChart2, Calendar } from "lucide-react";
import { formatCurrency } from "@/lib/utils/formatCurrency";
import { formatPercent } from "@/lib/utils/formatNumber";
import { cn } from "@/lib/utils";
import type { InvestmentPortfolio } from "@/lib/types/investments.types";

type Props = { summary: InvestmentPortfolio };

export const InvestmentsKpiCards = ({ summary }: Props) => {
  const isPositive = summary.totalReturn >= 0;

  const cards = [
    {
      label: "Patrimônio Total",
      value: formatCurrency(summary.currentValue / 100),
      sub: `Investido: ${formatCurrency(summary.totalInvested / 100)}`,
      color: "text-green",
      iconBg: "bg-green/15",
      Icon: DollarSign,
      iconColor: "text-green",
    },
    {
      label: "Retorno Total",
      value: `${isPositive ? "+" : ""}${formatCurrency(summary.totalReturn / 100)}`,
      sub: formatPercent(summary.totalReturnPercent),
      color: isPositive ? "text-green" : "text-red",
      iconBg: isPositive ? "bg-green/15" : "bg-red/15",
      Icon: TrendingUp,
      iconColor: isPositive ? "text-green" : "text-red",
    },
    {
      label: "Ativos em Carteira",
      value: String(summary.investments.length),
      sub: `${summary.allocations.length} classes`,
      color: "text-text",
      iconBg: "bg-blue/15",
      Icon: BarChart2,
      iconColor: "text-blue",
    },
    {
      label: "Última Atualização",
      value: "Manual",
      sub: "Atualização de preços manual",
      color: "text-text-muted",
      iconBg: "bg-surface2",
      Icon: Calendar,
      iconColor: "text-text-muted",
    },
  ];

  return (
    <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
      {cards.map(({ label, value, sub, color, iconBg, Icon, iconColor }) => (
        <div key={label} className="border-border bg-surface flex flex-col gap-3 rounded-xl border p-4">
          <div className="flex items-center justify-between">
            <span className="text-text-muted text-[11px] uppercase tracking-[0.05em]">{label}</span>
            <div className={cn("flex h-7 w-7 items-center justify-center rounded-[7px]", iconBg)}>
              <Icon size={13} strokeWidth={1.75} className={iconColor} />
            </div>
          </div>
          <div>
            <p className={cn("font-money font-600 text-[20px] leading-none", color)}>{value}</p>
            <p className="text-text-muted mt-1 text-[11px]">{sub}</p>
          </div>
        </div>
      ))}
    </div>
  );
};

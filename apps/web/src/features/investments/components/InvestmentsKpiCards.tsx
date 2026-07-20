"use client";

import { Wallet, DollarSign, TrendingUp, Percent } from "lucide-react";
import { StatCard } from "@/components/shared/StatCard";
import { formatCurrency } from "@/lib/utils/formatCurrency";
import type { InvestmentPortfolio } from "@/lib/types/investments.types";

type Props = { summary: InvestmentPortfolio };

export const InvestmentsKpiCards = ({ summary }: Props) => {
  const returnPositive = summary.totalReturn >= 0;

  return (
    <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
      <StatCard
        label="Patrimônio total"
        value={summary.currentValue / 100}
        icon={DollarSign}
        iconColor="var(--moss)"
        subText={`Investido ${formatCurrency(summary.totalInvested / 100)}`}
      />
      <StatCard
        label="Total investido"
        value={summary.totalInvested / 100}
        icon={Wallet}
        iconColor="var(--brand-cobalt)"
        subText={`${summary.investments.length} ${summary.investments.length === 1 ? "ativo" : "ativos"} na carteira`}
      />
      <StatCard
        label="Retorno total"
        value={summary.totalReturn / 100}
        icon={TrendingUp}
        iconColor={returnPositive ? "var(--moss)" : "var(--clay)"}
        subText="Sobre o aporte"
      />
      <StatCard
        label="Rentabilidade"
        value={summary.totalReturnPercent}
        format="percent"
        icon={Percent}
        iconColor={returnPositive ? "var(--moss)" : "var(--clay)"}
        subText="Valorização acumulada"
      />
    </div>
  );
};

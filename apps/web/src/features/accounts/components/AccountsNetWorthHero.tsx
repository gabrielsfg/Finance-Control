"use client";

import { TrendingUp, CreditCard, Wallet } from "lucide-react";
import { StatCard } from "@/components/shared/StatCard";

type Props = {
  netWorth: number;
  totalInvoice: number;
  totalCreditAvailable: number;
  netWorthChange?: number;
  invoiceChange?: number;
  creditAvailableChange?: number;
  previousNetWorth?: number;
  previousInvoice?: number;
  previousCreditAvailable?: number;
};

export const AccountsNetWorthHero = ({
  netWorth,
  totalInvoice,
  totalCreditAvailable,
  netWorthChange,
  invoiceChange,
  creditAvailableChange,
  previousNetWorth,
  previousInvoice,
  previousCreditAvailable,
}: Props) => (
  <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
    <StatCard
      label="Patrimônio Líquido"
      value={netWorth / 100}
      change={netWorthChange}
      previousValue={previousNetWorth !== undefined ? previousNetWorth / 100 : undefined}
      icon={TrendingUp}
      iconColor="#00C98D"
    />
    <StatCard
      label="Fatura Atual"
      value={-(totalInvoice / 100)}
      change={invoiceChange}
      previousValue={previousInvoice !== undefined ? previousInvoice / 100 : undefined}
      lowerIsBetter
      icon={CreditCard}
      iconColor="#F25F5C"
    />
    <StatCard
      label="Limite Disponível"
      value={Math.max(0, totalCreditAvailable) / 100}
      change={creditAvailableChange}
      previousValue={previousCreditAvailable !== undefined ? previousCreditAvailable / 100 : undefined}
      icon={Wallet}
      iconColor="#7C6FE0"
    />
  </div>
);

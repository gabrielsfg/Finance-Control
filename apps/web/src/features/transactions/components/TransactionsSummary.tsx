"use client";

import { ArrowUpRight, ArrowDownRight, ArrowLeftRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { formatCurrency } from "@/lib/utils/formatCurrency";

type Props = {
  totalIncome: number;
  totalExpense: number;
  balance: number;
};

export const TransactionsSummary = ({ totalIncome, totalExpense, balance }: Props) => {
  const items = [
    { label: "Receitas", value: totalIncome, color: "text-green", icon: ArrowUpRight },
    { label: "Despesas", value: totalExpense, color: "text-red", icon: ArrowDownRight },
    { label: "Saldo", value: balance, color: balance >= 0 ? "text-green" : "text-red", icon: ArrowLeftRight },
  ];

  return (
    <div className="grid grid-cols-3 gap-3">
      {items.map(({ label, value, color, icon: Icon }) => (
        <div key={label} className="border-border bg-surface rounded-xl border px-5 py-4">
          <div className="text-text-muted mb-1 flex items-center gap-1.5 text-[13px]">
            <Icon size={13} />
            {label}
          </div>
          <p className={cn("font-money font-600 text-[20px]", color)}>
            {value < 0 ? "-" : ""}{formatCurrency(Math.abs(value) / 100)}
          </p>
        </div>
      ))}
    </div>
  );
};

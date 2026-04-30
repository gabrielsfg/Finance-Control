"use client";

import { formatCurrency } from "@/lib/utils/formatCurrency";

type Props = {
  totalBalance: number;
  accountCount: number;
};

export const AccountsNetWorthHero = ({ totalBalance, accountCount }: Props) => (
  <div
    className="border-border flex items-center justify-between rounded-[16px] border px-8 py-7"
    style={{
      background: "linear-gradient(135deg, var(--surface) 0%, var(--surface2) 100%)",
    }}
  >
    <div>
      <p className="text-text-muted mb-2 text-[13px] tracking-[0.06em] uppercase">
        Patrimônio Total
      </p>
      <p
        className="font-money font-600 text-[40px] tracking-tight"
        style={{ color: totalBalance >= 0 ? "var(--green)" : "var(--red)" }}
      >
        {totalBalance < 0 ? "-" : ""}
        {formatCurrency(Math.abs(totalBalance / 100))}
      </p>
    </div>
    <div className="hidden text-right sm:block">
      <p className="text-text-muted text-[13px]">Contas</p>
      <p className="font-money font-600 text-text text-[20px]">{accountCount}</p>
    </div>
  </div>
);

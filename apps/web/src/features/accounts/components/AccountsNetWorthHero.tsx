"use client";

import { formatCurrency } from "@/lib/utils/formatCurrency";

type Props = {
  totalBalance: number;
  totalAssets: number;
  totalLiabilities: number;
  accountCount: number;
};

export const AccountsNetWorthHero = ({ totalBalance, totalAssets, totalLiabilities, accountCount }: Props) => (
  <div
    className="border-border rounded-[16px] border px-8 py-7"
    style={{
      background: "linear-gradient(135deg, var(--surface) 0%, var(--surface2) 100%)",
    }}
  >
    <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
      {/* Net worth */}
      <div>
        <p className="text-text-muted mb-2 text-[13px] tracking-[0.06em] uppercase">
          Patrimônio Líquido
        </p>
        <p
          className="font-money font-600 text-[40px] tracking-tight"
          style={{ color: totalBalance >= 0 ? "var(--green)" : "var(--red)" }}
        >
          {totalBalance < 0 ? "-" : ""}
          {formatCurrency(Math.abs(totalBalance / 100))}
        </p>
      </div>

      {/* Ativos / Passivos / Contas */}
      <div className="hidden gap-8 sm:flex">
        <div className="text-right">
          <p className="text-text-muted mb-1 text-[12px] tracking-[0.05em] uppercase">Total Ativos</p>
          <p className="font-money font-600 text-green text-[20px]">
            {formatCurrency(totalAssets / 100)}
          </p>
        </div>
        <div className="text-right">
          <p className="text-text-muted mb-1 text-[12px] tracking-[0.05em] uppercase">Total Passivos</p>
          <p className="font-money font-600 text-red text-[20px]">
            {totalLiabilities > 0 ? "-" : ""}{formatCurrency(Math.abs(totalLiabilities / 100))}
          </p>
        </div>
        <div className="text-right">
          <p className="text-text-muted mb-1 text-[12px] tracking-[0.05em] uppercase">Contas</p>
          <p className="font-money font-600 text-text text-[20px]">{accountCount}</p>
        </div>
      </div>
    </div>
  </div>
);

"use client";

import { RefreshCw } from "lucide-react";
import { formatCurrency } from "@/lib/utils/formatCurrency";
import type { TransactionItem } from "@/lib/types/transactions.types";

type Props = {
  transactions: TransactionItem[];
};

export const RecurringBanner = ({ transactions }: Props) => {
  const recurring = transactions.filter((t) => t.paymentType === "Recurring");
  if (recurring.length === 0) return null;

  const totalMonthly = recurring.reduce((sum, t) => sum + t.value, 0);
  const preview = recurring.slice(0, 4);

  return (
    <div
      className="flex items-center gap-4 rounded-[13px] border border-purple/25 px-5 py-4"
      style={{ background: "linear-gradient(135deg, color-mix(in srgb, var(--purple) 8%, transparent), color-mix(in srgb, var(--purple) 4%, transparent))" }}
    >
      <div className="bg-purple/15 flex h-10 w-10 shrink-0 items-center justify-center rounded-[10px]">
        <RefreshCw size={16} strokeWidth={1.75} className="text-purple" />
      </div>

      <div className="min-w-0 flex-1">
        <p className="text-text font-medium text-[14px]">
          {recurring.length} cobranças recorrentes ativas
        </p>
        <p className="text-text-muted mt-0.5 text-[12px]">
          Total mensal: <span className="font-money text-purple font-medium">{formatCurrency(totalMonthly / 100)}</span>
        </p>
      </div>

      <div className="hidden items-center gap-1.5 sm:flex">
        {preview.map((t) => (
          <div
            key={t.id}
            title={t.description}
            className="bg-purple/10 border-purple/20 flex h-7 items-center rounded-full border px-2.5 text-[11px] font-medium text-purple truncate max-w-[80px]"
          >
            {t.description.split(" ")[0]}
          </div>
        ))}
        {recurring.length > 4 && (
          <span className="text-text-muted text-[11px]">+{recurring.length - 4}</span>
        )}
      </div>
    </div>
  );
};

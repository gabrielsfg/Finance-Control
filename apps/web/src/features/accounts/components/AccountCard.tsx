"use client";

import { Pencil, Trash2, Star } from "lucide-react";
import { cn } from "@/lib/utils";
import { formatCurrency } from "@/lib/utils/formatCurrency";
import { ACCOUNT_TYPE_CONFIG } from "@/lib/config/accountTypes";
import type { AccountItem } from "@/lib/types/accounts.types";

type AccountCardProps = {
  account: AccountItem;
  onCardClick: () => void;
  onEdit: () => void;
  onDelete: (account: AccountItem) => void;
  onSetDefault: (account: AccountItem) => void;
  isConnected?: boolean;
};

export const AccountCard = ({
  account,
  onCardClick,
  onEdit,
  onDelete,
  onSetDefault,
  isConnected = false,
}: AccountCardProps) => {
  const config = ACCOUNT_TYPE_CONFIG[account.type];
  const { Icon, color, label } = config;
  const isNegative = account.currentAmount < 0;

  const isCredit = account.type === "Credit";
  const creditUsed = isCredit ? Math.abs(account.currentAmount) : 0;
  const creditLimit = isCredit && account.creditLimit ? account.creditLimit : 0;
  const creditUsedPercent = creditLimit > 0 ? Math.min((creditUsed / creditLimit) * 100, 100) : 0;
  const creditBarColor = creditUsedPercent >= 90 ? "#F25F5C" : creditUsedPercent >= 70 ? "#F5A623" : "#7C6FE0";

  return (
    <div
      className="border-border bg-surface group relative flex flex-col gap-3 rounded-xl border p-5 transition-shadow hover:shadow-sm cursor-pointer"
      onClick={onCardClick}
    >
      {account.isDefaultAccount ? (
        <div className="absolute top-3 right-3" title="Conta principal">
          <Star size={13} className="fill-yellow text-yellow" />
        </div>
      ) : (
        <button
          onClick={(e) => { e.stopPropagation(); onSetDefault(account); }}
          title="Definir como conta principal"
          className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity hover:scale-110"
        >
          <Star size={13} className="text-text-muted hover:text-yellow hover:fill-yellow transition-colors" />
        </button>
      )}

      {/* Header */}
      <div className="flex items-center gap-3">
        <div
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[10px]"
          style={{ backgroundColor: `${color}1a` }}
        >
          <Icon size={18} strokeWidth={1.75} style={{ color }} />
        </div>
        <div className="min-w-0 flex-1">
          <p className="font-500 text-text truncate text-[15px]">{account.name}</p>
          <div className="mt-0.5 flex items-center gap-1.5">
            <p className="text-text-muted text-[12px]">{label}</p>
            <span
              className={cn(
                "rounded-full px-1.5 py-px text-[10px] font-medium border",
                isConnected
                  ? "bg-green/10 text-green border-green/25"
                  : "bg-surface2 text-text-muted border-border",
              )}
            >
              {isConnected ? "Conectado" : "Manual"}
            </span>
          </div>
        </div>
      </div>

      {/* Balance */}
      <div>
        <p className="text-text-muted mb-0.5 text-[11px] tracking-[0.04em] uppercase">
          {isCredit ? "Fatura atual" : "Saldo atual"}
        </p>
        <p
          className={cn(
            "font-money font-600 text-[22px] tracking-tight",
            isNegative ? "text-red" : "text-text",
          )}
        >
          {formatCurrency(Math.abs(account.currentAmount / 100))}
        </p>
      </div>

      {/* Credit limit progress bar */}
      {isCredit && creditLimit > 0 && (
        <div className="flex flex-col gap-1">
          <div className="flex items-center justify-between text-[11px]">
            <span className="text-text-muted">Limite utilizado</span>
            <span className="font-mono font-medium" style={{ color: creditBarColor }}>
              {formatCurrency(creditUsed / 100)}{" "}
              <span className="text-text-muted font-normal">/ {formatCurrency(creditLimit / 100)}</span>
            </span>
          </div>
          <div className="bg-surface2 h-1.5 w-full overflow-hidden rounded-full">
            <div
              className="h-full rounded-full transition-all duration-300"
              style={{ width: `${creditUsedPercent}%`, backgroundColor: creditBarColor }}
            />
          </div>
          <p className="text-text-muted text-right text-[10px]">{creditUsedPercent.toFixed(0)}% usado</p>
        </div>
      )}

      {/* Actions */}
      <div className="flex gap-2 opacity-0 transition-opacity group-hover:opacity-100">
        <button
          onClick={(e) => { e.stopPropagation(); onEdit(); }}
          title="Editar conta"
          className="border-border text-text-sub hover:bg-surface2 hover:text-text flex h-7 flex-1 items-center justify-center gap-1.5 rounded-lg border text-[13px] transition-colors"
        >
          <Pencil size={12} />
          Editar
        </button>
        <button
          onClick={(e) => { e.stopPropagation(); onDelete(account); }}
          title="Excluir conta"
          className="border-red/40 text-red hover:bg-red/10 flex h-7 flex-1 items-center justify-center gap-1.5 rounded-lg border text-[13px] transition-colors"
        >
          <Trash2 size={12} />
          Excluir
        </button>
      </div>
    </div>
  );
};

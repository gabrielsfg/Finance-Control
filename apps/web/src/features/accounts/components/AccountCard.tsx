"use client";

import { useEffect, useRef } from "react";
import { Pencil, Trash2, Star, CreditCard, Landmark, PiggyBank, Wallet, Banknote, TrendingUp, TrendingDown } from "lucide-react";
import { Chart, registerables } from "chart.js";
import { cn } from "@/lib/utils";
import { formatCurrency } from "@/lib/utils/formatCurrency";
import type { AccountItem, AccountType } from "@/lib/types/accounts.types";

Chart.register(...registerables);

const ACCOUNT_TYPE_CONFIG: Record<
  AccountType,
  { label: string; color: string; Icon: React.ElementType }
> = {
  Checking: { label: "Conta Corrente", color: "#4A9EFF", Icon: Landmark },
  Savings:  { label: "Poupança",       color: "#00C98D", Icon: PiggyBank },
  Credit:   { label: "Crédito",        color: "#7C6FE0", Icon: CreditCard },
  Debit:    { label: "Débito",         color: "#F5A623", Icon: Wallet },
  Cash:     { label: "Dinheiro",       color: "#F5CE42", Icon: Banknote },
};

const DEFAULT_SPARKLINE = [100, 105, 98, 110, 108, 115, 112, 120];

type AccountCardProps = {
  account: AccountItem;
  onEdit: (account: AccountItem) => void;
  onDelete: (account: AccountItem) => void;
  sparklineData?: number[];
  trendPercent?: number;
  isConnected?: boolean;
};

export const AccountCard = ({
  account,
  onEdit,
  onDelete,
  sparklineData = DEFAULT_SPARKLINE,
  trendPercent,
  isConnected = false,
}: AccountCardProps) => {
  const config = ACCOUNT_TYPE_CONFIG[account.type];
  const { Icon, color, label } = config;
  const isNegative = account.currentAmount < 0;
  const sparkRef = useRef<HTMLCanvasElement>(null);

  const trend = trendPercent ?? (() => {
    const first = sparklineData[0];
    const last = sparklineData[sparklineData.length - 1];
    return first !== 0 ? ((last - first) / Math.abs(first)) * 100 : 0;
  })();
  const trendUp = trend >= 0;

  useEffect(() => {
    if (!sparkRef.current) return;
    const existing = Chart.getChart(sparkRef.current);
    if (existing) existing.destroy();

    new Chart(sparkRef.current.getContext("2d")!, {
      type: "line",
      data: {
        labels: sparklineData.map((_, i) => `D${i + 1}`),
        datasets: [{
          data: sparklineData,
          borderColor: isNegative ? "#F25F5C" : color,
          backgroundColor: isNegative ? "#F25F5C18" : `${color}18`,
          fill: true,
          tension: 0.4,
          borderWidth: 1.5,
          pointRadius: 0,
        }],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: { legend: { display: false }, tooltip: { enabled: false } },
        scales: { x: { display: false }, y: { display: false } },
      },
    });
  }, [sparklineData, color, isNegative]);

  return (
    <div className="border-border bg-surface group relative flex flex-col gap-3 rounded-xl border p-5 transition-shadow hover:shadow-sm">
      {account.isDefaultAccount && (
        <div className="absolute top-3 right-3">
          <Star size={13} className="fill-yellow text-yellow" />
        </div>
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
                "rounded-full px-1.5 py-px text-[10px] font-medium",
                isConnected
                  ? "bg-green/10 text-green border-green/25 border"
                  : "bg-surface3 text-text-muted border-border border",
              )}
            >
              {isConnected ? "Conectado" : "Manual"}
            </span>
          </div>
        </div>
      </div>

      {/* Balance + trend */}
      <div className="flex items-end justify-between">
        <div>
          <p className="text-text-muted mb-0.5 text-[11px] tracking-[0.04em] uppercase">Saldo atual</p>
          <p
            className={cn(
              "font-money font-600 text-[22px] tracking-tight",
              isNegative ? "text-red" : "text-text",
            )}
          >
            {isNegative ? "-" : ""}
            {formatCurrency(Math.abs(account.currentAmount / 100))}
          </p>
        </div>
        <div className={cn("flex items-center gap-1 text-[12px] font-medium", trendUp ? "text-green" : "text-red")}>
          {trendUp ? <TrendingUp size={13} /> : <TrendingDown size={13} />}
          <span className="font-mono">{trendUp ? "+" : ""}{trend.toFixed(1)}%</span>
          <span className="text-text-muted text-[11px] font-normal">30d</span>
        </div>
      </div>

      {/* Sparkline */}
      <div className="h-8">
        <canvas ref={sparkRef} />
      </div>

      {/* Actions */}
      <div className="flex gap-2 opacity-0 transition-opacity group-hover:opacity-100">
        <button
          onClick={() => onEdit(account)}
          className="border-border text-text-sub hover:bg-surface2 hover:text-text flex h-7 flex-1 items-center justify-center gap-1.5 rounded-lg border text-[13px] transition-colors"
        >
          <Pencil size={12} />
          Editar
        </button>
        <button
          onClick={() => onDelete(account)}
          className="border-border text-text-sub hover:bg-red/10 hover:text-red flex h-7 flex-1 items-center justify-center gap-1.5 rounded-lg border text-[13px] transition-colors"
        >
          <Trash2 size={12} />
          Excluir
        </button>
      </div>
    </div>
  );
};

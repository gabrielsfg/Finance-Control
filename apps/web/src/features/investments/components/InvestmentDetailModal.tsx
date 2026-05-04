"use client";

import { useState } from "react";
import { ArrowDownLeft, ArrowUpRight, Trash2, Loader2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { SectionHeader } from "@/components/shared/SectionHeader";
import { formatCurrency } from "@/lib/utils/formatCurrency";
import { cn } from "@/lib/utils";
import {
  useInvestmentTransactions,
  useInvestmentDividends,
  useDeleteTransaction,
} from "@/features/investments/hooks/useInvestments";
import type { Investment } from "@/lib/types/investments.types";

type SubTab = "transactions" | "dividends";

const DIVIDEND_TYPE_LABELS: Record<string, string> = {
  Dividend:            "Dividendo",
  JurosCapitalProprio: "JCP",
  RendimentoFII:       "Rendimento FII",
  Cupom:               "Cupom",
  Rendimento:          "Rendimento",
};

function formatDate(iso: string) {
  const [y, m, d] = iso.split("-");
  return `${d}/${m}/${y}`;
}

type Props = {
  open: boolean;
  onClose: () => void;
  investment: Investment;
};

export const InvestmentDetailModal = ({ open, onClose, investment }: Props) => {
  const [subTab, setSubTab] = useState<SubTab>("transactions");
  const transactions = useInvestmentTransactions(investment.id);
  const dividends    = useInvestmentDividends(investment.id);
  const deleteOp     = useDeleteTransaction();

  const isPositive = investment.totalReturn >= 0;

  const handleDelete = async (txId: number) => {
    try {
      await deleteOp.mutateAsync(txId);
    } catch {
      // error handled silently — could add toast here
    }
  };

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle className="font-display font-600 text-text text-[16px]">
            {investment.ticker} — {investment.name}
          </DialogTitle>
        </DialogHeader>

        {/* Summary strip */}
        <div className="bg-surface2 grid grid-cols-4 gap-3 rounded-xl p-4">
          <div>
            <p className="text-text-muted text-[12px]">Qtd. atual</p>
            <p className="font-money font-600 text-text text-[16px]">
              {investment.currentQuantity % 1 === 0
                ? investment.currentQuantity
                : investment.currentQuantity.toFixed(6)}
            </p>
          </div>
          <div>
            <p className="text-text-muted text-[12px]">Preço médio</p>
            <p className="font-money font-600 text-text text-[16px]">
              {formatCurrency(investment.averagePrice / 100)}
            </p>
          </div>
          <div>
            <p className="text-text-muted text-[12px]">Preço atual</p>
            <p className="font-money font-600 text-text text-[16px]">
              {formatCurrency(investment.currentPrice / 100)}
            </p>
          </div>
          <div>
            <p className="text-text-muted text-[12px]">Retorno</p>
            <p className={cn("font-money font-600 text-[16px]", isPositive ? "text-green" : "text-red")}>
              {isPositive ? "+" : ""}{investment.totalReturnPercent.toFixed(2)}%
            </p>
          </div>
        </div>

        {/* Sub-tabs */}
        <div className="border-border flex gap-1 rounded-xl border bg-surface p-1">
          {(["transactions", "dividends"] as SubTab[]).map((tab) => (
            <button
              key={tab}
              onClick={() => setSubTab(tab)}
              className={cn(
                "flex-1 rounded-[9px] py-1.5 text-[13px] font-medium transition-all",
                subTab === tab
                  ? "bg-surface2 text-text shadow-sm"
                  : "text-text-muted hover:text-text-sub",
              )}
            >
              {tab === "transactions" ? "Operações" : "Rendimentos"}
            </button>
          ))}
        </div>

        {/* Transactions list */}
        {subTab === "transactions" && (
          <div className="max-h-72 overflow-y-auto">
            {transactions.isLoading && (
              <div className="flex h-20 items-center justify-center">
                <Loader2 size={18} className="text-green animate-spin" />
              </div>
            )}
            {!transactions.isLoading && (transactions.data ?? []).length === 0 && (
              <p className="text-text-muted py-6 text-center text-[13px]">Nenhuma operação registrada.</p>
            )}
            {(transactions.data ?? []).map((tx) => {
              const isBuy = tx.operation === "Buy";
              return (
                <div key={tx.id} className="border-border flex items-center gap-3 border-b py-3 last:border-0">
                  <div className={cn("flex h-8 w-8 shrink-0 items-center justify-center rounded-[8px]", isBuy ? "bg-green/10" : "bg-red/10")}>
                    {isBuy
                      ? <ArrowDownLeft size={15} className="text-green" />
                      : <ArrowUpRight  size={15} className="text-red" />}
                  </div>
                  <div className="flex-1">
                    <p className="text-text text-[14px] font-medium">{isBuy ? "Compra" : "Venda"}</p>
                    <p className="text-text-muted text-[12px]">
                      {formatDate(tx.date)} · {tx.quantity % 1 === 0 ? tx.quantity : tx.quantity.toFixed(4)} × {formatCurrency(tx.unitPrice / 100)}
                      {tx.otherCosts > 0 && ` + ${formatCurrency(tx.otherCosts / 100)} custos`}
                    </p>
                  </div>
                  <p className={cn("font-money font-600 text-[14px]", isBuy ? "text-green" : "text-red")}>
                    {isBuy ? "+" : "-"}{formatCurrency(tx.totalValue / 100)}
                  </p>
                  <button
                    onClick={() => handleDelete(tx.id)}
                    disabled={deleteOp.isPending}
                    className="text-text-muted hover:text-red ml-1 transition-colors"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              );
            })}
          </div>
        )}

        {/* Dividends list */}
        {subTab === "dividends" && (
          <div className="max-h-72 overflow-y-auto">
            {dividends.isLoading && (
              <div className="flex h-20 items-center justify-center">
                <Loader2 size={18} className="text-green animate-spin" />
              </div>
            )}
            {!dividends.isLoading && (dividends.data ?? []).length === 0 && (
              <p className="text-text-muted py-6 text-center text-[13px]">Nenhum rendimento registrado.</p>
            )}
            {(dividends.data ?? []).map((div) => (
              <div key={div.id} className="border-border flex items-center gap-3 border-b py-3 last:border-0">
                <div className="bg-purple/10 flex h-8 w-8 shrink-0 items-center justify-center rounded-[8px]">
                  <ArrowDownLeft size={15} className="text-purple" />
                </div>
                <div className="flex-1">
                  <p className="text-text text-[14px] font-medium">
                    {DIVIDEND_TYPE_LABELS[div.type] ?? div.type}
                  </p>
                  <p className="text-text-muted text-[12px]">{formatDate(div.date)}</p>
                </div>
                <p className="font-money font-600 text-purple text-[14px]">
                  +{formatCurrency(div.amount / 100)}
                </p>
              </div>
            ))}
          </div>
        )}

        <div className="flex justify-end pt-1">
          <Button variant="outline" size="sm" onClick={onClose}>Fechar</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

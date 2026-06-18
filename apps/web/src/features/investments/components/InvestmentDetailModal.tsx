"use client";

import { useState } from "react";
import { ArrowDownLeft, ArrowUpRight, Trash2, Loader2, Building2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Money } from "@/components/shared/Money";
import { formatCurrency } from "@/lib/utils/formatCurrency";
import { formatPercentNeutral } from "@/lib/utils/formatNumber";
import { cn } from "@/lib/utils";
import {
  useInvestmentTransactions,
  useInvestmentDividends,
  useDeleteTransaction,
} from "@/features/investments/hooks/useInvestments";
import { FundamentalsDrawer } from "@/features/market/components/FundamentalsDrawer";
import type { Investment } from "@/lib/types/investments.types";

// AssetTypes eligible for fundamental data
const FUNDAMENTAL_TYPES = new Set([
  "Acao", "BDR", "Stock", "Reit", "ETF", "ETFInternacional", "FundoInvestimento",
]);

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
  const [subTab, setSubTab]                     = useState<SubTab>("transactions");
  const [showFundamentals, setShowFundamentals] = useState(false);
  const [confirmDeleteId, setConfirmDeleteId]   = useState<number | null>(null);
  const transactions = useInvestmentTransactions(investment.id);
  const dividends    = useInvestmentDividends(investment.id);
  const deleteOp     = useDeleteTransaction();

  const isPositive = investment.totalReturn >= 0;
  const hasFundamentals = FUNDAMENTAL_TYPES.has(investment.assetType);

  const handleConfirmDelete = async () => {
    if (confirmDeleteId === null) return;
    try {
      await deleteOp.mutateAsync(confirmDeleteId);
    } finally {
      setConfirmDeleteId(null);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle className="font-display text-[16px] font-bold tracking-[-0.01em] text-[var(--text)]">
            <span className="font-mono">{investment.ticker}</span>
            <span className="text-[var(--text-sub)]"> · {investment.name}</span>
          </DialogTitle>
        </DialogHeader>

        {/* Summary strip */}
        <div className="grid grid-cols-2 gap-px overflow-hidden rounded-[13px] border border-[var(--border-color)] bg-[var(--border-color)] sm:grid-cols-4">
          <div className="bg-[var(--surface2)] p-3.5">
            <p className="font-mono text-[10.5px] uppercase tracking-[0.1em] text-[var(--text-sub)]">Qtd. atual</p>
            <p className="mt-1 font-mono text-[16px] font-medium tabular-nums text-[var(--text)]">
              {investment.currentQuantity % 1 === 0
                ? investment.currentQuantity.toLocaleString("pt-BR")
                : investment.currentQuantity.toFixed(6)}
            </p>
          </div>
          <div className="bg-[var(--surface2)] p-3.5">
            <p className="font-mono text-[10.5px] uppercase tracking-[0.1em] text-[var(--text-sub)]">Preço médio</p>
            <Money cents={investment.averagePrice} className="mt-1 block text-[16px]" />
          </div>
          <div className="bg-[var(--surface2)] p-3.5">
            <p className="font-mono text-[10.5px] uppercase tracking-[0.1em] text-[var(--text-sub)]">Preço atual</p>
            <Money cents={investment.currentPrice} className="mt-1 block text-[16px]" />
          </div>
          <div className="bg-[var(--surface2)] p-3.5">
            <p className="font-mono text-[10.5px] uppercase tracking-[0.1em] text-[var(--text-sub)]">Retorno</p>
            <p className={cn("mt-1 font-mono text-[16px] font-semibold tabular-nums", isPositive ? "text-[var(--moss)]" : "text-[var(--clay)]")}>
              {formatPercentNeutral(Math.abs(investment.totalReturnPercent))}
            </p>
          </div>
        </div>

        {/* Sub-tabs */}
        <div className="inline-flex gap-[3px] rounded-[13px] border border-[var(--border-color)] bg-[var(--surface2)] p-[4px]">
          {(["transactions", "dividends"] as SubTab[]).map((tab) => (
            <button
              key={tab}
              onClick={() => setSubTab(tab)}
              className={cn(
                "flex-1 rounded-[9px] px-4 py-1.5 text-[13px] transition-all",
                subTab === tab
                  ? "bg-[var(--surface)] font-semibold text-[var(--text)] shadow-sm"
                  : "font-medium text-[var(--text-sub)] hover:text-[var(--text)]",
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
                <Loader2 size={18} className="animate-spin text-[var(--brand-accent)]" />
              </div>
            )}
            {!transactions.isLoading && (transactions.data ?? []).length === 0 && (
              <p className="py-6 text-center text-[13px] text-[var(--text-sub)]">Nenhuma operação registrada.</p>
            )}
            {(transactions.data ?? []).map((tx) => {
              const isBuy = tx.operation === "Buy";
              return (
                <div key={tx.id} className="flex items-center gap-3 border-b border-[var(--border-color)] py-3 last:border-0">
                  <div
                    className="flex h-8 w-8 shrink-0 items-center justify-center rounded-[9px]"
                    style={{ background: isBuy ? "color-mix(in srgb, var(--moss) 14%, transparent)" : "color-mix(in srgb, var(--clay) 14%, transparent)" }}
                  >
                    {isBuy
                      ? <ArrowDownLeft size={15} className="text-[var(--moss)]" />
                      : <ArrowUpRight  size={15} className="text-[var(--clay)]" />}
                  </div>
                  <div className="flex-1">
                    <p className="text-[14px] font-medium text-[var(--text)]">{isBuy ? "Compra" : "Venda"}</p>
                    <p className="font-mono text-[12px] text-[var(--text-sub)]">
                      {formatDate(tx.date)} · {tx.quantity % 1 === 0 ? tx.quantity : tx.quantity.toFixed(4)} × {formatCurrency(tx.unitPrice / 100)}
                      {tx.otherCosts > 0 && ` + ${formatCurrency(tx.otherCosts / 100)} custos`}
                    </p>
                  </div>
                  <Money cents={isBuy ? tx.totalValue : -tx.totalValue} sign className="text-[14px]" />
                  <button
                    onClick={() => setConfirmDeleteId(tx.id)}
                    disabled={deleteOp.isPending}
                    title="Excluir operação"
                    className="ml-1 text-[var(--text-sub)] transition-colors hover:text-[var(--clay)]"
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
                <Loader2 size={18} className="animate-spin text-[var(--brand-accent)]" />
              </div>
            )}
            {!dividends.isLoading && (dividends.data ?? []).length === 0 && (
              <p className="py-6 text-center text-[13px] text-[var(--text-sub)]">Nenhum rendimento registrado.</p>
            )}
            {(dividends.data ?? []).map((div) => (
              <div key={div.id} className="flex items-center gap-3 border-b border-[var(--border-color)] py-3 last:border-0">
                <div
                  className="flex h-8 w-8 shrink-0 items-center justify-center rounded-[9px]"
                  style={{ background: "color-mix(in srgb, var(--gold) 16%, transparent)" }}
                >
                  <ArrowDownLeft size={15} className="text-[var(--gold)]" />
                </div>
                <div className="flex-1">
                  <p className="text-[14px] font-medium text-[var(--text)]">
                    {DIVIDEND_TYPE_LABELS[div.type] ?? div.type}
                  </p>
                  <p className="font-mono text-[12px] text-[var(--text-sub)]">{formatDate(div.date)}</p>
                </div>
                <Money cents={div.amount} sign className="text-[14px]" />
              </div>
            ))}
          </div>
        )}

        <div className="flex items-center justify-between pt-1">
          {hasFundamentals ? (
            <button
              onClick={() => setShowFundamentals(true)}
              className="flex items-center gap-1.5 rounded-[13px] border border-[var(--border-color)] px-3 py-1.5 text-[12px] text-[var(--text-sub)] transition-colors hover:border-[var(--brand-accent)] hover:text-[var(--brand-accent)]"
            >
              <Building2 size={13} />
              Fundamentos da empresa
            </button>
          ) : <span />}
          <Button variant="outline" size="sm" onClick={onClose}>Fechar</Button>
        </div>
      </DialogContent>

      <FundamentalsDrawer
        ticker={showFundamentals ? investment.ticker : null}
        assetName={investment.name}
        onClose={() => setShowFundamentals(false)}
      />

      <Dialog open={confirmDeleteId !== null} onOpenChange={(o) => !o && setConfirmDeleteId(null)}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle className="font-display text-[16px]">Excluir operação</DialogTitle>
            <DialogDescription className="text-text-sub text-[14px]">
              Tem certeza que deseja excluir essa operação? Essa ação não pode ser desfeita.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setConfirmDeleteId(null)}>
              Cancelar
            </Button>
            <Button
              variant="destructive"
              onClick={handleConfirmDelete}
              disabled={deleteOp.isPending}
            >
              {deleteOp.isPending ? <Loader2 size={14} className="animate-spin" /> : "Excluir"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Dialog>
  );
};

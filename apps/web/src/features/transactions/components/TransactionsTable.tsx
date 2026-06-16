"use client";

import { ArrowLeftRight, RefreshCw, Layers, Pencil, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { formatCurrency } from "@/lib/utils/formatCurrency";
import { parseLocalDate } from "@/lib/utils/budgetPeriod";
import type { TransactionItem } from "@/lib/types/transactions.types";

const PAYMENT_METHOD_LABELS: Record<string, string> = {
  Debit: "Débito",
  Credit: "Crédito",
};

type Props = {
  transactions: TransactionItem[];
  search: string;
  onEdit: (t: TransactionItem) => void;
  onDelete: (t: TransactionItem) => void;
};

export const TransactionsTable = ({ transactions, search, onEdit, onDelete }: Props) => {
  if (transactions.length === 0) {
    return (
      <div className="overflow-hidden rounded-[20px] border" style={{ background: "var(--surface)", borderColor: "var(--border-color)" }}>
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <div className="bg-surface2 mb-4 flex h-12 w-12 items-center justify-center rounded-[12px]">
            <ArrowLeftRight size={20} className="text-text-muted" strokeWidth={1.5} />
          </div>
          <p className="font-500 text-text text-[15px]">Nenhuma transação encontrada</p>
          <p className="text-text-muted mt-1 text-[13px]">
            {search ? "Tente outro termo de busca." : "Crie sua primeira transação neste período."}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-[20px] border" style={{ background: "var(--surface)", borderColor: "var(--border-color)" }}>
      <table className="w-full">
        <thead>
          <tr className="border-border border-b">
            <th className="text-text-muted px-5 py-3 text-left text-[12px] font-medium">Data</th>
            <th className="text-text-muted px-5 py-3 text-left text-[12px] font-medium">Descrição</th>
            <th className="text-text-muted hidden px-5 py-3 text-left text-[12px] font-medium md:table-cell">Categoria</th>
            <th className="text-text-muted hidden px-5 py-3 text-left text-[12px] font-medium lg:table-cell">Conta</th>
            <th className="text-text-muted hidden px-5 py-3 text-left text-[12px] font-medium sm:table-cell">Tipo</th>
            <th className="text-text-muted px-5 py-3 text-right text-[12px] font-medium">Valor</th>
            <th className="px-4 py-3" />
          </tr>
        </thead>
        <tbody>
          {transactions.map((t) => (
            <tr
              key={t.id}
              className="border-border group border-b last:border-0 transition-colors hover:bg-surface2/50"
            >
              <td className="px-5 py-3.5">
                <span className="font-mono text-text-muted text-[13px]">
                  {parseLocalDate(t.transactionDate).toLocaleDateString("pt-BR", {
                    day: "2-digit",
                    month: "short",
                  })}
                </span>
              </td>
              <td className="px-5 py-3.5">
                <p className="text-text text-[14px] font-medium">{t.description}</p>
                <div className="mt-0.5 flex items-center gap-2">
                  {t.paymentMethod && (
                    <span className="text-text-muted text-[12px]">
                      {PAYMENT_METHOD_LABELS[t.paymentMethod]}
                    </span>
                  )}
                  {t.paymentType === "Recurring" && (
                    <span className="text-text-muted flex items-center gap-1 text-[12px]">
                      <RefreshCw size={10} />
                      Recorrente
                    </span>
                  )}
                  {t.paymentType === "Installment" && t.installmentNumber && t.totalInstallments && (
                    <span className="text-text-muted flex items-center gap-1 text-[12px]">
                      <Layers size={10} />
                      {t.installmentNumber}/{t.totalInstallments}x
                    </span>
                  )}
                </div>
              </td>
              <td className="hidden px-5 py-3.5 md:table-cell">
                <span className="text-text-sub flex items-center gap-1 text-[13px]">
                  {t.subCategoryEmoji && <span className="text-[13px] leading-none">{t.subCategoryEmoji}</span>}
                  {t.subCategoryName}
                </span>
              </td>
              <td className="hidden px-5 py-3.5 lg:table-cell">
                <span className="text-text-sub text-[13px]">{t.accountName}</span>
              </td>
              <td className="hidden px-5 py-3.5 sm:table-cell">
                <span
                  className={cn(
                    "inline-flex rounded-full px-2 py-0.5 text-[11px] font-medium",
                    t.type === "Income" ? "bg-green/12 text-green" : "bg-red/12 text-red",
                  )}
                >
                  {t.type === "Income" ? "Receita" : "Despesa"}
                </span>
              </td>
              <td className="px-5 py-3.5 text-right">
                <span
                  className={cn(
                    "font-money font-semibold text-[15px]",
                    t.type === "Income" ? "text-green" : "text-text",
                  )}
                >
                  {t.type === "Income" ? "+" : "-"}
                  {formatCurrency(t.value / 100)}
                </span>
              </td>
              <td className="px-4 py-3.5">
                <div className="flex items-center gap-1 opacity-0 transition-opacity group-hover:opacity-100">
                  <button
                    onClick={() => onEdit(t)}
                    className="text-text-sub hover:bg-surface2 hover:text-text flex h-7 w-7 items-center justify-center rounded-[9px] transition-colors"
                  >
                    <Pencil size={13} />
                  </button>
                  <button
                    onClick={() => onDelete(t)}
                    className="text-text-sub hover:bg-red/10 hover:text-red flex h-7 w-7 items-center justify-center rounded-[9px] transition-colors"
                  >
                    <Trash2 size={13} />
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

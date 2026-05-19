"use client";

import { useMemo } from "react";
import { ArrowLeftRight, Pencil, RefreshCw, Layers, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { formatCurrency } from "@/lib/utils/formatCurrency";
import { getCategoryColor } from "@/lib/config/categoryColors";
import type { TransactionItem } from "@/lib/types/transactions.types";

const PAYMENT_METHOD_LABELS: Record<string, string> = {
  Debit: "Débito",
  Credit: "Crédito",
};

function hexToRgb(hex: string) {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `${r} ${g} ${b}`;
}

function parseDateLocal(dateStr: string) {
  const [y, m, d] = dateStr.split("-").map(Number);
  return new Date(y, m - 1, d);
}

function formatDayHeader(dateStr: string) {
  const date = parseDateLocal(dateStr);
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(today.getDate() - 1);

  if (date.toDateString() === today.toDateString()) return "Hoje";
  if (date.toDateString() === yesterday.toDateString()) return "Ontem";
  return date.toLocaleDateString("pt-BR", { weekday: "long", day: "2-digit", month: "long" });
}

type SubcategoryMeta = { id: number; name: string; color: string; emoji?: string | null };

type DayGroup = {
  date: string;
  transactions: TransactionItem[];
  dayIncome: number;
  dayExpense: number;
};

type Props = {
  transactions: TransactionItem[];
  subcategoryMeta?: SubcategoryMeta[];
  search?: string;
  onView: (t: TransactionItem) => void;
  onEdit: (t: TransactionItem) => void;
  onDelete: (t: TransactionItem) => void;
};

export const TransactionsList = ({ transactions, subcategoryMeta = [], search, onView, onEdit, onDelete }: Props) => {
  const subColorMap = useMemo(() => {
    const m = new Map<number, string>();
    for (const s of subcategoryMeta) m.set(s.id, s.color);
    return m;
  }, [subcategoryMeta]);

  const subEmojiMap = useMemo(() => {
    const m = new Map<number, string>();
    for (const s of subcategoryMeta) if (s.emoji) m.set(s.id, s.emoji);
    return m;
  }, [subcategoryMeta]);

  const groups = useMemo<DayGroup[]>(() => {
    const map = new Map<string, TransactionItem[]>();
    for (const t of transactions) {
      if (!map.has(t.transactionDate)) map.set(t.transactionDate, []);
      map.get(t.transactionDate)!.push(t);
    }
    return Array.from(map.entries())
      .sort(([a], [b]) => b.localeCompare(a))
      .map(([date, txs]) => ({
        date,
        transactions: txs,
        dayIncome:  txs.filter((t) => t.type === "Income").reduce((s, t) => s + t.value, 0),
        dayExpense: txs.filter((t) => t.type === "Expense").reduce((s, t) => s + t.value, 0),
      }));
  }, [transactions]);

  if (transactions.length === 0) {
    return (
      <div className="border-border bg-surface flex flex-col items-center justify-center rounded-xl border py-16 text-center">
        <div className="bg-surface2 mb-4 flex h-12 w-12 items-center justify-center rounded-[12px]">
          <ArrowLeftRight size={20} className="text-text-muted" strokeWidth={1.5} />
        </div>
        <p className="font-500 text-text text-[15px]">Nenhuma transação encontrada</p>
        <p className="text-text-muted mt-1 text-[13px]">
          {search ? "Tente outro termo de busca." : "Crie sua primeira transação neste período."}
        </p>
      </div>
    );
  }

  return (
    <div className="border-border overflow-hidden rounded-xl border">
      {groups.map(({ date, transactions: txs, dayIncome, dayExpense }) => (
        <div key={date}>
          {/* Day header */}
          <div className="border-border bg-surface2 flex items-center justify-between border-b px-4 py-2.5">
            <span className="text-text-sub font-600 text-[12px] capitalize">
              {formatDayHeader(date)}
            </span>
            <div className="flex items-center gap-3">
              {dayIncome > 0 && (
                <span className="font-mono text-green text-[12px]">
                  +{formatCurrency(dayIncome / 100)}
                </span>
              )}
              {dayExpense > 0 && (
                <span className="font-mono text-red text-[12px]">
                  -{formatCurrency(dayExpense / 100)}
                </span>
              )}
            </div>
          </div>

          {/* Transactions for the day */}
          {txs.map((t, i) => {
            const isIncome = t.type === "Income";
            const isTransfer = t.recurringTransactionId !== null && t.type !== "Income" && t.type !== "Expense";
            const subColor = subColorMap.get(t.subCategoryId) ?? getCategoryColor(null, t.subCategoryName);
            const subEmoji = subEmojiMap.get(t.subCategoryId) ?? t.subCategoryEmoji;

            return (
              <div
                key={t.id}
                onClick={() => onView(t)}
                className={cn(
                  "group relative flex cursor-pointer items-center gap-3 px-4 py-3.5 transition-colors hover:bg-surface2/40",
                  i < txs.length - 1 && "border-border border-b",
                )}
              >
                {/* Category icon */}
                <div
                  className={cn(
                    "flex h-9 w-9 shrink-0 items-center justify-center rounded-[9px]",
                    isIncome ? "bg-green/10" : "bg-red/10",
                  )}
                >
                  <span className="text-[14px]">{isIncome ? "💰" : "💸"}</span>
                </div>

                {/* Description + meta */}
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <p className="text-text truncate text-[14px] font-medium">{t.description}</p>
                    {t.paymentType === "Recurring" && (
                      <span className="text-purple border-purple/25 bg-purple/8 flex shrink-0 items-center gap-1 rounded-full border px-2 py-0.5 text-[11px] font-medium">
                        <RefreshCw size={9} />
                        Recorrente
                      </span>
                    )}
                    {t.paymentType === "Installment" && t.installmentNumber && t.totalInstallments && (
                      <span className="text-blue border-blue/25 bg-blue/8 flex shrink-0 items-center gap-1 rounded-full border px-2 py-0.5 text-[11px] font-medium">
                        <Layers size={9} />
                        Parcela {t.installmentNumber}/{t.totalInstallments}
                      </span>
                    )}
                  </div>
                  <div className="mt-0.5 flex items-center gap-2">
                    {t.accountName && (
                      <span className="text-text-muted text-[12px]">{t.accountName}</span>
                    )}
                    {t.paymentMethod && (
                      <span className="text-text-muted text-[12px]">· {PAYMENT_METHOD_LABELS[t.paymentMethod]}</span>
                    )}
                  </div>
                </div>

                {/* Value + subcategory badge — slides left on hover */}
                <div className="flex shrink-0 flex-col items-end gap-1 transition-transform duration-200 group-hover:-translate-x-16">
                  <span
                    className={cn(
                      "font-money font-600 text-[15px]",
                      isIncome ? "text-green" : isTransfer ? "text-text-sub" : "text-text",
                    )}
                  >
                    {isIncome ? "+" : "-"}{formatCurrency(Math.abs(t.value) / 100)}
                  </span>
                  <span
                    className="flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-medium"
                    style={{
                      backgroundColor: `rgb(${hexToRgb(subColor)} / 0.15)`,
                      color: subColor,
                    }}
                  >
                    {subEmoji && <span className="text-[11px] leading-none">{subEmoji}</span>}
                    {t.subCategoryName}
                  </span>
                </div>

                {/* Inline actions — appear on hover, sit in the space revealed by value sliding */}
                <div className="absolute right-4 flex items-center gap-1 opacity-0 transition-opacity duration-200 group-hover:opacity-100">
                  <button
                    onClick={(e) => { e.stopPropagation(); onEdit(t); }}
                    title="Editar transação"
                    className="text-text-sub hover:bg-surface2 hover:text-text flex h-7 w-7 items-center justify-center rounded-lg transition-colors"
                  >
                    <Pencil size={13} />
                  </button>
                  <button
                    onClick={(e) => { e.stopPropagation(); onDelete(t); }}
                    title="Excluir transação"
                    className="text-red/60 hover:bg-red/10 flex h-7 w-7 items-center justify-center rounded-lg transition-colors hover:text-red"
                  >
                    <Trash2 size={13} />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      ))}
    </div>
  );
};

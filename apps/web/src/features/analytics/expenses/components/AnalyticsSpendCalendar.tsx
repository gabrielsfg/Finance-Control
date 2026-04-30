"use client";

import { SectionHeader } from "@/components/shared/SectionHeader";
import { formatCurrency } from "@/lib/utils/formatCurrency";
import { cn } from "@/lib/utils";
import type { DaySpend } from "@/lib/types/analytics.types";

const WEEK_DAYS = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];

type Props = { data: DaySpend[]; month: string };

type DayState = "empty" | "expense1" | "expense2" | "expense3" | "expense4" | "income1" | "income2" | "income3" | "income4";

const BG: Record<DayState, string> = {
  empty:    "border border-border",
  expense1: "bg-red/15",
  expense2: "bg-red/35",
  expense3: "bg-red/60",
  expense4: "bg-red",
  income1:  "bg-green/15",
  income2:  "bg-green/35",
  income3:  "bg-green/60",
  income4:  "bg-green",
};

const TEXT: Record<DayState, string> = {
  empty:    "text-text-muted",
  expense1: "text-text-sub",
  expense2: "text-text-sub",
  expense3: "text-white",
  expense4: "text-white",
  income1:  "text-text-sub",
  income2:  "text-text-sub",
  income3:  "text-white",
  income4:  "text-white",
};

function getDayState(expense: number, income: number, maxExpense: number, maxIncome: number): DayState {
  const net = income - expense;

  if (net > 0) {
    // Positive day — green palette
    const pct = net / Math.max(maxIncome, 1);
    if (pct < 0.2) return "income1";
    if (pct < 0.45) return "income2";
    if (pct < 0.7) return "income3";
    return "income4";
  }

  if (expense > 0) {
    // Expense day — red palette
    const pct = expense / Math.max(maxExpense, 1);
    if (pct < 0.2) return "expense1";
    if (pct < 0.45) return "expense2";
    if (pct < 0.7) return "expense3";
    return "expense4";
  }

  return "empty";
}

export const AnalyticsSpendCalendar = ({ data, month }: Props) => {
  const firstDate = data[0]?.date ? new Date(data[0].date + "T12:00:00") : new Date();
  const offset = firstDate.getDay();
  const year = firstDate.getFullYear();
  const monthNum = firstDate.getMonth();
  const daysInMonth = new Date(year, monthNum + 1, 0).getDate();

  const byDate = new Map(data.map((d) => [d.date, d]));

  const maxExpense = Math.max(...data.map((d) => d.total), 1);
  const maxNet     = Math.max(...data.map((d) => Math.max((d.income ?? 0) - d.total, 0)), 1);

  return (
    <div className="border-border bg-surface rounded-xl border p-5">
      <SectionHeader title="Calendário de Gastos" subtitle={month} />

      {/* Week day headers */}
      <div className="grid grid-cols-7 mb-1">
        {WEEK_DAYS.map((d) => (
          <div key={d} className="text-text-muted py-1 text-center text-[11px] font-medium uppercase tracking-[0.06em]">
            {d}
          </div>
        ))}
      </div>

      {/* Calendar grid */}
      <div className="grid grid-cols-7 gap-1">
        {Array.from({ length: offset }).map((_, i) => (
          <div key={`empty-${i}`} />
        ))}

        {Array.from({ length: daysInMonth }, (_, i) => {
          const dayNum = i + 1;
          const dateStr = `${year}-${String(monthNum + 1).padStart(2, "0")}-${String(dayNum).padStart(2, "0")}`;
          const d = byDate.get(dateStr);
          const expense = d?.total ?? 0;
          const income  = d?.income ?? 0;
          const net     = income - expense;
          const state   = getDayState(expense, income, maxExpense, maxNet);

          const tooltipLabel =
            net > 0
              ? `${dayNum}: +${formatCurrency(net / 100)} (receita)`
              : expense > 0
              ? `${dayNum}: -${formatCurrency(expense / 100)} (gasto)`
              : `${dayNum}: sem movimentação`;

          return (
            <div
              key={dateStr}
              title={tooltipLabel}
              className={cn(
                "relative flex flex-col items-center justify-center rounded-lg py-2 transition-transform hover:scale-105 cursor-default",
                BG[state],
              )}
              style={{ minHeight: 52 }}
            >
              <span className={cn("text-[13px] font-medium leading-none", TEXT[state])}>
                {dayNum}
              </span>
              {(expense > 0 || income > 0) && (
                <span className={cn("mt-1 text-[10px] leading-none font-mono", TEXT[state])}>
                  {net > 0
                    ? formatCurrency(net / 100).replace("R$ ", "").replace("R$ ", "")
                    : formatCurrency(expense / 100).replace("R$ ", "").replace("R$ ", "")}
                </span>
              )}
            </div>
          );
        })}
      </div>

      {/* Legend */}
      <div className="mt-4 flex flex-wrap items-center gap-x-5 gap-y-2">
        <div className="flex items-center gap-2">
          <span className="text-text-muted text-[11px]">Gasto baixo</span>
          {(["expense1", "expense2", "expense3", "expense4"] as DayState[]).map((s) => (
            <div key={s} className={cn("h-4 w-4 rounded-[4px]", BG[s])} />
          ))}
          <span className="text-text-muted text-[11px]">Alto</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-text-muted text-[11px]">Saldo positivo leve</span>
          {(["income1", "income2", "income3", "income4"] as DayState[]).map((s) => (
            <div key={s} className={cn("h-4 w-4 rounded-[4px]", BG[s])} />
          ))}
          <span className="text-text-muted text-[11px]">Alto</span>
        </div>
        <div className="flex items-center gap-2">
          <div className={cn("h-4 w-4 rounded-[4px]", BG["empty"])} />
          <span className="text-text-muted text-[11px]">Sem movimentação</span>
        </div>
      </div>
    </div>
  );
};

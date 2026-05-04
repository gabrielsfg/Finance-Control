"use client";

import { useRouter } from "next/navigation";
import { SectionHeader } from "@/components/shared/SectionHeader";
import { formatCurrency } from "@/lib/utils/formatCurrency";
import { cn } from "@/lib/utils";
import type { DaySpend, DayHeatmapState } from "@/lib/types/analytics.types";

const WEEK_DAYS = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];

type Props = { data: DaySpend[]; month: string };

const BG: Record<DayHeatmapState, string> = {
  Empty:    "border border-border",
  Expense1: "bg-red/15",
  Expense2: "bg-red/35",
  Expense3: "bg-red/60",
  Expense4: "bg-red",
  Income1:  "bg-green/15",
  Income2:  "bg-green/35",
  Income3:  "bg-green/60",
  Income4:  "bg-green",
};

const TEXT: Record<DayHeatmapState, string> = {
  Empty:    "text-text-muted",
  Expense1: "text-text-sub",
  Expense2: "text-text-sub",
  Expense3: "text-white",
  Expense4: "text-white",
  Income1:  "text-text-sub",
  Income2:  "text-text-sub",
  Income3:  "text-white",
  Income4:  "text-white",
};

export const AnalyticsSpendCalendar = ({ data, month }: Props) => {
  const router = useRouter();
  const firstDate = data[0]?.date ? new Date(data[0].date + "T12:00:00") : new Date();
  const offset = firstDate.getDay();
  const year = firstDate.getFullYear();
  const monthNum = firstDate.getMonth();
  const daysInMonth = new Date(year, monthNum + 1, 0).getDate();

  const byDate = new Map(data.map((d) => [d.date, d]));

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
          const net     = d?.net ?? 0;
          const state   = d?.state ?? "Empty";

          const tooltipLabel =
            net > 0
              ? `${dayNum}: +${formatCurrency(net / 100)} (receita)`
              : expense > 0
              ? `${dayNum}: -${formatCurrency(expense / 100)} (gasto)`
              : `${dayNum}: sem movimentação`;

          return (
            <button
              key={dateStr}
              type="button"
              title={tooltipLabel}
              onClick={() => router.push(`/transactions?date=${dateStr}`)}
              className={cn(
                "relative flex flex-col items-center justify-center rounded-lg py-2 transition-transform hover:scale-105 hover:ring-2 hover:ring-white/20 cursor-pointer",
                BG[state],
              )}
              style={{ minHeight: 52 }}
            >
              <span className={cn("text-[13px] font-medium leading-none", TEXT[state])}>
                {dayNum}
              </span>
              {(expense > 0 || net > 0) && (
                <span className={cn("mt-1 text-[10px] leading-none font-mono", TEXT[state])}>
                  {net > 0
                    ? formatCurrency(net / 100).replace("R$ ", "")
                    : formatCurrency(expense / 100).replace("R$ ", "")}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Legend */}
      <div className="mt-4 flex flex-wrap items-center gap-x-5 gap-y-2">
        <div className="flex items-center gap-2">
          <span className="text-text-muted text-[11px]">Gasto baixo</span>
          {(["Expense1", "Expense2", "Expense3", "Expense4"] as DayHeatmapState[]).map((s) => (
            <div key={s} className={cn("h-4 w-4 rounded-[4px]", BG[s])} />
          ))}
          <span className="text-text-muted text-[11px]">Alto</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-text-muted text-[11px]">Saldo positivo leve</span>
          {(["Income1", "Income2", "Income3", "Income4"] as DayHeatmapState[]).map((s) => (
            <div key={s} className={cn("h-4 w-4 rounded-[4px]", BG[s])} />
          ))}
          <span className="text-text-muted text-[11px]">Alto</span>
        </div>
        <div className="flex items-center gap-2">
          <div className={cn("h-4 w-4 rounded-[4px]", BG["Empty"])} />
          <span className="text-text-muted text-[11px]">Sem movimentação</span>
        </div>
      </div>
    </div>
  );
};

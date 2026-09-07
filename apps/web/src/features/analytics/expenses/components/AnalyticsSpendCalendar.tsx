"use client";

import { useRouter } from "next/navigation";
import { ChevronLeft, ChevronRight, ArrowUp, ArrowDown } from "lucide-react";
import { Card, CardHead } from "@/components/shared/Card";
import { formatCurrency } from "@/lib/utils/formatCurrency";
import { parseMonthYear } from "@/lib/utils/budgetPeriod";
import { cn } from "@/lib/utils";
import type { DaySpend, DayHeatmapState } from "@/lib/types/analytics.types";

const WEEK_DAYS = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];

const MONTH_NAMES = [
  "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
  "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro",
];

/**
 * The month-over-month marker on a day cell.
 *
 * It sits on top of a heatmap tint that runs from near-transparent to fully saturated, in
 * both themes — so no single ink colour works. It was hardcoded white, which vanished on
 * the light tints in light mode. Giving it its own surface-coloured chip decouples it from
 * whatever is underneath, and lets the arrow itself carry the meaning in colour: up (spent
 * more than last month) reads red, down reads green.
 */
function VsLastMonthBadge({ direction }: { direction: "up" | "down" }) {
  const Icon = direction === "up" ? ArrowUp : ArrowDown;
  return (
    <span
      className="flex h-[15px] w-[15px] items-center justify-center rounded-full border border-[var(--border-color)] bg-[var(--surface)]"
      style={{ color: direction === "up" ? "var(--red)" : "var(--green)" }}
    >
      <Icon size={9} strokeWidth={3.5} />
    </span>
  );
}

type Props = { data: DaySpend[]; month: string; onPrev: () => void; onNext: () => void };

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

export const AnalyticsSpendCalendar = ({ data, month, onPrev, onNext }: Props) => {
  const router = useRouter();
  const [year, monthNum1] = parseMonthYear(month);
  const monthNum = monthNum1 - 1;
  const offset = new Date(year, monthNum, 1).getDay();
  const daysInMonth = new Date(year, monthNum + 1, 0).getDate();

  const byDate = new Map(data.map((d) => [d.date, d]));

  const monthLabel = `${MONTH_NAMES[monthNum]} ${year}`;

  return (
    <Card>
      <CardHead
        title="Calendário de Gastos"
        right={
          <div className="flex items-center gap-1">
            <button
              onClick={onPrev}
              className="flex h-7 w-7 items-center justify-center rounded-[9px] text-[var(--text-sub)] transition-colors hover:bg-[var(--surface2)] hover:text-[var(--text)]"
            >
              <ChevronLeft size={15} />
            </button>
            <span className="min-w-[120px] text-center text-[13px] font-medium text-[var(--text-sub)]">
              {monthLabel}
            </span>
            <button
              onClick={onNext}
              className="flex h-7 w-7 items-center justify-center rounded-[9px] text-[var(--text-sub)] transition-colors hover:bg-[var(--surface2)] hover:text-[var(--text)]"
            >
              <ChevronRight size={15} />
            </button>
          </div>
        }
      />

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

          const vsLast = d?.vsLastMonth ?? null;

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
              {/* vs last month — inset past the corner radius, which used to clip it */}
              {vsLast !== null && expense > 0 && (
                <div
                  className="absolute top-1.5 right-1.5"
                  title={vsLast > 0 ? `+${formatCurrency(vsLast / 100)} vs mês anterior` : `${formatCurrency(vsLast / 100)} vs mês anterior`}
                >
                  <VsLastMonthBadge direction={vsLast > 0 ? "up" : "down"} />
                </div>
              )}
              {/* neutral: no movement */}
              {state === "Empty" && (
                <span className="text-text-muted text-[11px] leading-none mt-0.5">—</span>
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
        <div className="flex items-center gap-2">
          <VsLastMonthBadge direction="up" />
          <span className="text-text-muted text-[11px]">Mais que mês anterior</span>
          <VsLastMonthBadge direction="down" />
          <span className="text-text-muted text-[11px]">Menos que mês anterior</span>
        </div>
      </div>
    </Card>
  );
};

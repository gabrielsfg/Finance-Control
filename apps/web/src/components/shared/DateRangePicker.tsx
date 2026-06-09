"use client";

import { useState } from "react";
import { ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

const MONTH_NAMES = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"];
const WEEK_DAYS   = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];

type Props = {
  /** Selected start date, "YYYY-MM-DD" or "". */
  startDate: string;
  /** Selected finish date, "YYYY-MM-DD" or "". */
  finishDate: string;
  /** Fired on every change. Second click that lands before the start swaps the edges. */
  onChange: (start: string, finish: string) => void;
  /** Optional clamp — days before this are disabled. "YYYY-MM-DD". */
  minDate?: string;
  /** Optional clamp — days after this are disabled. "YYYY-MM-DD". */
  maxDate?: string;
};

/**
 * Canonical date-range picker: a SINGLE calendar where the user clicks the start
 * date, then the finish date (with hover preview of the range). Pass minDate/maxDate
 * to clamp selection to an available window (out-of-range days and month nav disable).
 *
 * This is presentational only — wrap it in your own popover/panel and own the
 * open/close behavior (see MarketPriceChart or TransactionsFilters for examples).
 */
export function DateRangePicker({ startDate, finishDate, onChange, minDate, maxDate }: Props) {
  const parseDate = (s: string) => (s ? new Date(s + "T00:00:00") : null);
  const isoStr    = (d: Date) => d.toISOString().slice(0, 10);

  const initial = parseDate(maxDate || finishDate || startDate) ?? new Date();
  const [viewYear,  setViewYear]  = useState(initial.getFullYear());
  const [viewMonth, setViewMonth] = useState(initial.getMonth());
  const [hovered,   setHovered]   = useState<string | null>(null);
  const [picking,   setPicking]   = useState<"start" | "end">("start");

  const selStart = parseDate(startDate);
  const selEnd   = parseDate(finishDate);
  const hovDate  = hovered ? parseDate(hovered) : null;

  function prevMonth() {
    if (viewMonth === 0) { setViewMonth(11); setViewYear(y => y - 1); }
    else setViewMonth(m => m - 1);
  }
  function nextMonth() {
    if (viewMonth === 11) { setViewMonth(0); setViewYear(y => y + 1); }
    else setViewMonth(m => m + 1);
  }

  function handleDayClick(dateStr: string) {
    const clicked = parseDate(dateStr)!;
    if (picking === "start" || !selStart) {
      onChange(dateStr, "");
      setPicking("end");
    } else {
      if (clicked < selStart) onChange(dateStr, startDate);
      else                    onChange(startDate, dateStr);
      setPicking("start");
    }
  }

  function isInRange(dateStr: string) {
    const d = parseDate(dateStr)!;
    const anchor = selStart;
    const tip    = hovDate ?? selEnd;
    if (!anchor || !tip) return false;
    const lo = anchor < tip ? anchor : tip;
    const hi = anchor < tip ? tip : anchor;
    return d > lo && d < hi;
  }

  // build calendar grid
  const firstDay = new Date(viewYear, viewMonth, 1).getDay();
  const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
  const cells: (string | null)[] = Array(firstDay).fill(null);
  for (let d = 1; d <= daysInMonth; d++) {
    const month = String(viewMonth + 1).padStart(2, "0");
    const day   = String(d).padStart(2, "0");
    cells.push(`${viewYear}-${month}-${day}`);
  }
  while (cells.length % 7 !== 0) cells.push(null);

  const atMinMonth = !!minDate &&
    (viewYear < +minDate.slice(0, 4) || (viewYear === +minDate.slice(0, 4) && viewMonth <= +minDate.slice(5, 7) - 1));
  const atMaxMonth = !!maxDate &&
    (viewYear > +maxDate.slice(0, 4) || (viewYear === +maxDate.slice(0, 4) && viewMonth >= +maxDate.slice(5, 7) - 1));

  const isDisabled = (dateStr: string) =>
    (!!minDate && dateStr < minDate) || (!!maxDate && dateStr > maxDate);

  const rangeLabel = startDate && finishDate
    ? `${startDate.split("-").reverse().join("/")} → ${finishDate.split("-").reverse().join("/")}`
    : startDate
    ? `A partir de ${startDate.split("-").reverse().join("/")}`
    : "Selecione o período";

  return (
    <div className="select-none">
      {/* Month nav */}
      <div className="mb-3 flex items-center justify-between">
        <button
          onClick={prevMonth}
          disabled={atMinMonth}
          className="text-text-muted hover:text-text flex h-7 w-7 items-center justify-center rounded-full transition-colors hover:bg-surface3 disabled:opacity-30 disabled:hover:bg-transparent"
        >
          <ChevronRight size={14} className="rotate-180" />
        </button>
        <span className="text-text text-[13px] font-semibold">
          {MONTH_NAMES[viewMonth]} {viewYear}
        </span>
        <button
          onClick={nextMonth}
          disabled={atMaxMonth}
          className="text-text-muted hover:text-text flex h-7 w-7 items-center justify-center rounded-full transition-colors hover:bg-surface3 disabled:opacity-30 disabled:hover:bg-transparent"
        >
          <ChevronRight size={14} />
        </button>
      </div>

      {/* Week headers */}
      <div className="mb-1 grid grid-cols-7">
        {WEEK_DAYS.map(d => (
          <div key={d} className="text-text-muted py-1 text-center text-[10px] font-medium">{d}</div>
        ))}
      </div>

      {/* Days grid */}
      <div className="grid grid-cols-7">
        {cells.map((dateStr, i) => {
          if (!dateStr) return <div key={`empty-${i}`} />;
          const disabled = isDisabled(dateStr);
          const inRange  = isInRange(dateStr);
          const isS      = dateStr === startDate;
          const isE      = dateStr === finishDate;
          const edge     = isS || isE;
          const isToday  = dateStr === isoStr(new Date());

          return (
            <div
              key={dateStr}
              className={cn("relative flex items-center justify-center py-0.5",
                inRange && "bg-green/10",
                isS && finishDate && "rounded-l-full bg-green/10",
                isE && startDate  && "rounded-r-full bg-green/10",
              )}
              onMouseEnter={() => !disabled && setHovered(dateStr)}
              onMouseLeave={() => setHovered(null)}
            >
              <button
                onClick={() => handleDayClick(dateStr)}
                disabled={disabled}
                className={cn(
                  "flex h-8 w-8 items-center justify-center rounded-full text-[13px] transition-all",
                  disabled
                    ? "text-text-muted/40 cursor-not-allowed"
                    : edge
                    ? "bg-green text-black font-bold"
                    : inRange
                    ? "text-green font-medium"
                    : isToday
                    ? "border-border border text-text font-semibold"
                    : "text-text-sub hover:bg-surface3 hover:text-text",
                )}
              >
                {parseInt(dateStr.slice(8))}
              </button>
            </div>
          );
        })}
      </div>

      {/* Range label */}
      <div className={cn(
        "mt-3 rounded-lg px-3 py-2 text-center text-[12px] transition-all",
        startDate && finishDate
          ? "bg-green/10 text-green font-medium"
          : "bg-surface3 text-text-muted",
      )}>
        {rangeLabel}
      </div>
    </div>
  );
}

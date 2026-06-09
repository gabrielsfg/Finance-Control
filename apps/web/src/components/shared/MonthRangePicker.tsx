"use client";

import { useState } from "react";
import { ChevronDown, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

export const MONTH_NAMES_SHORT = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"];

// Calendário de range de meses: 1ª seleção = início, 2ª = fim
// Clicar no rótulo do ano abre um grid para escolher o ano diretamente
export function MonthRangePicker({
  start,
  end,
  onChangeStart,
  onChangeEnd,
  minYearMonth,
  maxYearMonth,
}: {
  start: string;              // YYYY-MM ou ""
  end: string;                // YYYY-MM ou ""
  onChangeStart: (v: string) => void;
  onChangeEnd: (v: string) => void;
  minYearMonth?: string;
  maxYearMonth?: string;
}) {
  const today = new Date();
  const defaultMaxYear  = today.getFullYear();
  const defaultMaxMonth = today.getMonth(); // 0-indexed, mês atual inclusive (backend clamp)

  const maxYear  = maxYearMonth ? parseInt(maxYearMonth.slice(0, 4)) : defaultMaxYear;
  const maxMonth = maxYearMonth ? parseInt(maxYearMonth.slice(5, 7)) - 1 : defaultMaxMonth;
  const minYear  = minYearMonth ? parseInt(minYearMonth.slice(0, 4)) : 1994;
  const minMonth = minYearMonth ? parseInt(minYearMonth.slice(5, 7)) - 1 : 0;

  const [viewYear, setViewYear] = useState(() => {
    if (start) return parseInt(start.slice(0, 4));
    if (end)   return parseInt(end.slice(0, 4));
    return maxYear;
  });
  const [yearPickerOpen, setYearPickerOpen] = useState(false);

  // picking: 'start' = escolhendo início, 'end' = escolhendo fim
  const [picking, setPicking] = useState<'start' | 'end'>('start');

  const ym = (yr: number, mo: number) => `${yr}-${String(mo + 1).padStart(2, "0")}`;

  function isOutOfRange(yr: number, mo: number) {
    return yr < minYear || (yr === minYear && mo < minMonth)
        || yr > maxYear || (yr === maxYear && mo > maxMonth);
  }

  function isInRange(yr: number, mo: number) {
    if (!start || !end) return false;
    const v = ym(yr, mo);
    return v > start && v < end;
  }

  function isStart(yr: number, mo: number) { return !!start && ym(yr, mo) === start; }
  function isEnd  (yr: number, mo: number) { return !!end   && ym(yr, mo) === end;   }

  function handleMonthClick(yr: number, mo: number) {
    if (isOutOfRange(yr, mo)) return;
    const v = ym(yr, mo);
    if (picking === 'start') {
      onChangeStart(v);
      if (end && v > end) onChangeEnd('');
      setPicking('end');
    } else {
      if (v < start) {
        onChangeStart(v);
        onChangeEnd(start);
        setPicking('start');
      } else {
        onChangeEnd(v);
        setPicking('start');
      }
    }
  }

  const years: number[] = [];
  for (let y = minYear; y <= maxYear; y++) years.push(y);

  const fmtYM = (v: string) =>
    v ? `${MONTH_NAMES_SHORT[parseInt(v.slice(5, 7)) - 1]}/${v.slice(0, 4)}` : '—';

  return (
    <div className="select-none">
      {/* Header: setas de ano + rótulo clicável */}
      <div className="mb-2 flex items-center justify-between gap-1">
        <button
          onClick={() => setViewYear((y) => Math.max(y - 1, minYear))}
          disabled={viewYear <= minYear}
          className="text-text-muted hover:text-text flex h-7 w-7 shrink-0 items-center justify-center rounded-full transition-colors hover:bg-surface2 disabled:opacity-30 disabled:cursor-not-allowed"
        >
          <ChevronRight size={13} className="rotate-180" />
        </button>

        <button
          onClick={() => setYearPickerOpen((o) => !o)}
          className="flex items-center gap-1 rounded-lg px-2 py-1 text-[13px] font-semibold text-text hover:bg-surface2 transition-colors"
        >
          {viewYear}
          <ChevronDown size={12} className={cn("text-text-muted transition-transform", yearPickerOpen && "rotate-180")} />
        </button>

        <button
          onClick={() => setViewYear((y) => Math.min(y + 1, maxYear))}
          disabled={viewYear >= maxYear}
          className="text-text-muted hover:text-text flex h-7 w-7 shrink-0 items-center justify-center rounded-full transition-colors hover:bg-surface2 disabled:opacity-30 disabled:cursor-not-allowed"
        >
          <ChevronRight size={13} />
        </button>
      </div>

      {/* Year picker grid */}
      {yearPickerOpen && (
        <div className="mb-2 grid grid-cols-4 gap-1 rounded-xl border border-border bg-surface p-2">
          {years.map((y) => (
            <button
              key={y}
              onClick={() => { setViewYear(y); setYearPickerOpen(false); }}
              className={cn(
                "rounded-md py-1 text-[11px] font-medium transition-colors",
                y === viewYear
                  ? "bg-green text-black font-bold"
                  : "text-text-sub hover:bg-surface2 hover:text-text",
              )}
            >
              {y}
            </button>
          ))}
        </div>
      )}

      {/* Month grid */}
      <div className="grid grid-cols-3 gap-1">
        {MONTH_NAMES_SHORT.map((name, mo) => {
          const disabled  = isOutOfRange(viewYear, mo);
          const selStart  = isStart(viewYear, mo);
          const selEnd    = isEnd(viewYear, mo);
          const inRange   = isInRange(viewYear, mo);
          return (
            <button
              key={mo}
              onClick={() => handleMonthClick(viewYear, mo)}
              disabled={disabled}
              className={cn(
                "rounded-md py-2 text-[12px] font-medium transition-all",
                selStart || selEnd
                  ? "bg-green text-black font-bold shadow-sm"
                  : inRange
                  ? "bg-green/15 text-green"
                  : disabled
                  ? "text-text-muted opacity-30 cursor-not-allowed"
                  : "text-text-sub hover:bg-surface2 hover:text-text",
              )}
            >
              {name}
            </button>
          );
        })}
      </div>

      {/* Range summary */}
      <div className="mt-3 flex items-center justify-between rounded-lg bg-surface2/60 px-3 py-2 text-[11px]">
        <div className="flex flex-col items-center gap-0.5">
          <span className="text-text-muted">Início</span>
          <span
            className={cn("font-medium cursor-pointer hover:text-green transition-colors",
              picking === 'start' ? "text-green" : "text-text")}
            onClick={() => setPicking('start')}
          >
            {fmtYM(start)}
          </span>
        </div>
        <ChevronRight size={12} className="text-text-muted" />
        <div className="flex flex-col items-center gap-0.5">
          <span className="text-text-muted">Fim</span>
          <span
            className={cn("font-medium cursor-pointer hover:text-green transition-colors",
              picking === 'end' ? "text-green" : "text-text")}
            onClick={() => setPicking('end')}
          >
            {fmtYM(end)}
          </span>
        </div>
      </div>

      {/* Hint */}
      <p className="mt-1.5 text-center text-[10px] text-text-muted">
        {picking === 'start' ? 'Selecione o mês inicial' : 'Agora selecione o mês final'}
      </p>
    </div>
  );
}

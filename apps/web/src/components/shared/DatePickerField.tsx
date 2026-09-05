"use client";

import { useEffect, useState } from "react";
import { Calendar as CalendarIcon, ChevronRight, X } from "lucide-react";
import { cn } from "@/lib/utils";

const MONTH_NAMES = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"];
const WEEK_DAYS = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];

type Props = {
  value: string;
  onChange: (next: string) => void;
  placeholder?: string;
  allowClear?: boolean;
  className?: string;
  hasError?: boolean;
  /**
   * "md" is the form field. "sm" fits a dense table row — shorter trigger and a numeric
   * dd/mm/aaaa label, since "15 de janeiro de 2026" does not fit a column and a numeric
   * date is easier to scan down one anyway. The calendar itself is unchanged.
   */
  size?: "md" | "sm";
};

const TRIGGER_SIZES = {
  md: { box: "h-11 rounded-lg px-3.5 text-[15px]", icon: 15, label: "text-[15px]", menuTop: "top-12" },
  sm: { box: "h-7 rounded-md px-2 text-[12px]", icon: 12, label: "text-[12px]", menuTop: "top-9" },
} as const;

export function DatePickerField({
  value, onChange, placeholder, allowClear, className, hasError, size = "md",
}: Props) {
  const metrics = TRIGGER_SIZES[size];
  const [open, setOpen] = useState(false);
  const today = new Date();
  const parsed = value ? new Date(value + "T00:00:00") : null;
  const [viewYear, setViewYear] = useState(parsed?.getFullYear() ?? today.getFullYear());
  const [viewMonth, setViewMonth] = useState(parsed?.getMonth() ?? today.getMonth());

  useEffect(() => {
    if (open && parsed) {
      setViewYear(parsed.getFullYear());
      setViewMonth(parsed.getMonth());
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, value]);

  function prevMonth() {
    if (viewMonth === 0) { setViewMonth(11); setViewYear(y => y - 1); }
    else setViewMonth(m => m - 1);
  }
  function nextMonth() {
    if (viewMonth === 11) { setViewMonth(0); setViewYear(y => y + 1); }
    else setViewMonth(m => m + 1);
  }

  const firstDay = new Date(viewYear, viewMonth, 1).getDay();
  const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
  const cells: (string | null)[] = Array(firstDay).fill(null);
  for (let d = 1; d <= daysInMonth; d++) {
    const month = String(viewMonth + 1).padStart(2, "0");
    const day = String(d).padStart(2, "0");
    cells.push(`${viewYear}-${month}-${day}`);
  }
  while (cells.length % 7 !== 0) cells.push(null);

  const todayStr = today.toISOString().slice(0, 10);
  const label = value
    ? size === "sm"
      ? new Date(value + "T00:00:00").toLocaleDateString("pt-BR")
      : new Date(value + "T00:00:00").toLocaleDateString("pt-BR", { day: "2-digit", month: "long", year: "numeric" })
    : placeholder ?? "Selecionar data";

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen(o => !o)}
        className={cn(
          "border-border bg-surface2 text-text placeholder:text-text-muted w-full border outline-none focus:border-green/60",
          metrics.box,
          "flex items-center justify-between gap-2 text-left",
          !value && "text-text-muted",
          hasError && "border-red/60",
          className,
        )}
      >
        <span className="flex min-w-0 items-center gap-2.5">
          <CalendarIcon size={metrics.icon} className="text-text-muted shrink-0" />
          <span className={cn("truncate", metrics.label, value ? "text-text" : "text-text-muted")}>{label}</span>
        </span>
        {allowClear && value && (
          <span
            role="button"
            tabIndex={0}
            onClick={e => { e.stopPropagation(); onChange(""); }}
            onKeyDown={e => { if (e.key === "Enter" || e.key === " ") { e.stopPropagation(); onChange(""); } }}
            className="text-text-muted hover:text-text"
          >
            <X size={14} />
          </span>
        )}
      </button>

      {open && (
        <div className={cn("border-border bg-surface absolute left-0 z-[70] rounded-xl border p-4 shadow-2xl", metrics.menuTop)} style={{ minWidth: 280 }}>
          <div className="mb-3 flex items-center justify-between">
            <button type="button" onClick={prevMonth} className="text-text-muted hover:text-text flex h-7 w-7 items-center justify-center rounded-full transition-colors hover:bg-surface3">
              <ChevronRight size={14} className="rotate-180" />
            </button>
            <span className="text-text text-[13px] font-semibold">{MONTH_NAMES[viewMonth]} {viewYear}</span>
            <button type="button" onClick={nextMonth} className="text-text-muted hover:text-text flex h-7 w-7 items-center justify-center rounded-full transition-colors hover:bg-surface3">
              <ChevronRight size={14} />
            </button>
          </div>
          <div className="mb-1 grid grid-cols-7">
            {WEEK_DAYS.map(d => (
              <div key={d} className="text-text-muted py-1 text-center text-[10px] font-medium">{d}</div>
            ))}
          </div>
          <div className="grid grid-cols-7">
            {cells.map((dateStr, i) => {
              if (!dateStr) return <div key={`empty-${i}`} />;
              const isSelected = dateStr === value;
              const isToday = dateStr === todayStr;
              return (
                <div key={dateStr} className="flex items-center justify-center py-0.5">
                  <button
                    type="button"
                    onClick={() => { onChange(dateStr); setOpen(false); }}
                    className={cn(
                      "flex h-8 w-8 items-center justify-center rounded-full text-[13px] transition-all",
                      isSelected
                        ? "bg-green text-black font-bold"
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
        </div>
      )}
    </div>
  );
}

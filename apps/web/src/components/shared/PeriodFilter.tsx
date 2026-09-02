"use client";

import { useEffect, useRef, useState } from "react";
import { CalendarDays, Check } from "lucide-react";
import { cn } from "@/lib/utils";
import { DateRangePicker } from "@/components/shared/DateRangePicker";
import {
  PERIOD_PRESETS,
  periodPresetLabel,
  type PeriodValue,
} from "@/lib/utils/periodPresets";

/**
 * Compact period picker for a page header.
 *
 * Presets plus a custom range, sharing the canonical {@link DateRangePicker} for the
 * calendar rather than growing a second one. Pages with a full multi-section filter
 * (transactions, analytics) keep their own date section; this is for the pages whose
 * only filter is the period.
 */
export function PeriodFilter({
  value,
  onChange,
}: {
  value: PeriodValue;
  onChange: (next: PeriodValue) => void;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    function handler(event: MouseEvent) {
      if (ref.current && !ref.current.contains(event.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  const isDefault = value.preset === "budget-cycle";

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen((o) => !o)}
        title="Filtrar por período"
        className={cn(
          "flex h-[42px] items-center gap-2 rounded-[13px] border px-3.5 text-[13px] font-medium transition-all hover:-translate-y-[1px]",
          isDefault ? "text-[var(--text-sub)]" : "text-[var(--text)]",
        )}
        style={{
          background: "var(--surface)",
          borderColor: isDefault ? "var(--border-color)" : "var(--brand-cobalt)",
        }}
      >
        <CalendarDays size={15} strokeWidth={1.75} />
        <span className="hidden sm:inline">{periodPresetLabel(value)}</span>
      </button>

      {open && (
        <div
          className="border-border bg-surface absolute right-0 top-[calc(100%+6px)] z-50 w-[280px] overflow-hidden rounded-xl border shadow-xl"
        >
          <div className="py-1">
            {PERIOD_PRESETS.map((preset) => {
              const active = preset.id === value.preset;
              return (
                <button
                  key={preset.id}
                  onClick={() => {
                    // Custom keeps the panel open — the calendar below is the next step.
                    onChange({ ...value, preset: preset.id });
                    if (preset.id !== "custom-range") setOpen(false);
                  }}
                  className={cn(
                    "flex w-full items-center gap-2.5 px-3.5 py-2 text-left text-[13px] transition-colors",
                    active
                      ? "bg-surface2 text-text font-medium"
                      : "text-text-sub hover:bg-surface2 hover:text-text",
                  )}
                >
                  <span className="flex-1">{preset.label}</span>
                  {active && <Check size={12} className="text-text-muted shrink-0" />}
                </button>
              );
            })}
          </div>

          {value.preset === "custom-range" && (
            <div className="border-border border-t p-3">
              <DateRangePicker
                startDate={value.startDate}
                finishDate={value.finishDate}
                onChange={(start, finish) => onChange({ ...value, startDate: start, finishDate: finish })}
              />
            </div>
          )}
        </div>
      )}
    </div>
  );
}

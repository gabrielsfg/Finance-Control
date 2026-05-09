"use client";

import { useState, useRef, useEffect } from "react";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

type Option = { value: string; label: string };

type Props = {
  options: Option[];
  value: string;
  onChange: (value: string) => void;
  active?: boolean; // highlights border when selection is not the first option
};

export const PillSelect = ({ options, value, onChange, active }: Props) => {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const selected = options.find((o) => o.value === value);
  const isActive = active ?? (value !== options[0]?.value);

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        className={cn(
          "border-border bg-surface2 text-text-sub hover:text-text flex h-8 items-center gap-1.5 rounded-lg border px-3 text-[12px] font-medium transition-colors",
          isActive && "border-green/40 text-green",
        )}
      >
        <span>{selected?.label ?? "—"}</span>
        <ChevronDown size={12} strokeWidth={2} className={cn("transition-transform", open && "rotate-180")} />
      </button>

      {open && (
        <div className="border-border bg-surface absolute right-0 top-10 z-50 flex min-w-[160px] flex-col gap-px rounded-xl border p-1.5 shadow-lg">
          {options.map((opt) => (
            <button
              key={opt.value}
              onClick={() => { onChange(opt.value); setOpen(false); }}
              className={cn(
                "flex items-center justify-between rounded-lg px-2.5 py-1.5 text-left text-[13px] transition-colors hover:bg-surface2",
                opt.value === value ? "text-green" : "text-text-sub",
              )}
            >
              {opt.label}
              {opt.value === value && (
                <span className="ml-2 h-1.5 w-1.5 shrink-0 rounded-full bg-green" />
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

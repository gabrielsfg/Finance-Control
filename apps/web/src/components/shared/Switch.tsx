"use client";

import { cn } from "@/lib/utils";

/** Quantia switch — 40×23 pill, cobalt fill + translated knob when on. */
export function Switch({
  value,
  onChange,
  disabled,
  "aria-label": ariaLabel,
}: {
  value: boolean;
  onChange: (value: boolean) => void;
  disabled?: boolean;
  "aria-label"?: string;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={value}
      aria-label={ariaLabel}
      disabled={disabled}
      onClick={() => onChange(!value)}
      className={cn(
        "relative h-[23px] w-10 shrink-0 rounded-full border transition-colors",
        "outline-none focus-visible:shadow-[0_0_0_3px_color-mix(in_srgb,var(--brand-cobalt)_28%,transparent)]",
        disabled && "cursor-not-allowed opacity-50",
        value
          ? "border-[var(--brand-cobalt)] bg-[var(--brand-cobalt)]"
          : "border-[var(--border-color)] bg-[var(--surface2)]",
      )}
    >
      {/* `left` is not optional here: without it the knob falls back to its
          static position, and a <button> centres its content — so the knob
          started mid-track and the "on" translate pushed it past the pill.
          Anchored at 2px, the 17px knob travels 17px to land 2px from the
          other end (38px inner width − 2 − 17). */}
      <span
        className={cn(
          "absolute left-[2px] top-[2px] h-[17px] w-[17px] rounded-full shadow-[0_1px_3px_rgba(0,0,0,0.25)] transition-transform duration-200 ease-out",
          value ? "translate-x-[17px] bg-white" : "translate-x-0 bg-[var(--surface)]",
        )}
      />
    </button>
  );
}

"use client";

/**
 * Shared presentational primitives for the Simulations feature, tokenised to
 * the Quantia design system. Logic-free — purely the `.field`, `.seg-row`,
 * chart-token and tooltip idioms reused across the six simulators.
 */

import type { ReactNode } from "react";
import { cn } from "@/lib/utils";
import { formatCurrency } from "@/lib/utils/formatCurrency";

// ── Chart tokens (recipe) ────────────────────────────────────────────────────
// grid: --border-color dashed "3 5", vertical off; axes: mono 10px --text-sub.
export const CHART_GRID = {
  stroke: "var(--border-color)",
  strokeDasharray: "3 5",
  vertical: false,
} as const;

export const axisTick = {
  fill: "var(--text-sub)",
  fontSize: 10,
  fontFamily: "var(--font-mono, ui-monospace), monospace",
} as const;

/** Distinct series palette — avoids the cobalt/gold collisions of legacy vars. */
export const SERIES = {
  moss:   "var(--moss)",        // chart-1 — positive / patrimônio real
  cobalt: "var(--brand-cobalt)",// chart-2 — primary / nominal
  clay:   "var(--clay)",        // chart-3 — negative / tax
  gold:   "var(--gold)",        // chart-4 — invested / highlight
  muted:  "var(--text-sub)",    // chart-5
  violet: "#7c6fe0",            // extra distinct accent used in prototypes
} as const;

// ── Field (.field) ────────────────────────────────────────────────────────────
const fieldInputBase =
  "min-w-0 flex-1 bg-transparent text-[14px] text-[var(--text)] placeholder:text-[var(--text-sub)]/60 outline-none";

export const fieldMono = cn(fieldInputBase, "font-mono tabular-nums");

/** Mono uppercase field label. */
export function FieldLabel({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <label className={cn("mb-2 block font-mono text-[11px] uppercase tracking-[0.1em] text-[var(--text-sub)]", className)}>
      {children}
    </label>
  );
}

/** The bordered input wrapper with cobalt focus halo. Pass `prefix`/`suffix` nodes. */
export function FieldShell({
  prefix,
  suffix,
  className,
  children,
}: {
  prefix?: ReactNode;
  suffix?: ReactNode;
  className?: string;
  children: ReactNode;
}) {
  return (
    <div
      className={cn(
        "flex items-center gap-2 rounded-[13px] border border-[var(--border-color)] bg-[var(--surface)] px-3.5 py-2.5 transition-colors",
        "focus-within:border-[var(--brand-cobalt)] focus-within:shadow-[0_0_0_3px_color-mix(in_srgb,var(--brand-cobalt)_12%,transparent)]",
        className,
      )}
    >
      {prefix}
      {children}
      {suffix}
    </div>
  );
}

/** Mono `R$` prefix for money inputs. */
export function MoneyPrefix() {
  return <span className="font-mono text-[13px] text-[var(--text-sub)]">R$</span>;
}

/** Mono trailing unit (`%`, `anos`, …). */
export function UnitSuffix({ children }: { children: ReactNode }) {
  return <span className="ml-auto font-mono text-[13px] text-[var(--text-sub)]">{children}</span>;
}

// ── Segmented control (.seg-row) ───────────────────────────────────────────────
export function SegRow({ className, children }: { className?: string; children: ReactNode }) {
  return (
    <div
      className={cn(
        "inline-flex w-full gap-[3px] rounded-[13px] border border-[var(--border-color)] bg-[var(--surface2)] p-[4px]",
        className,
      )}
    >
      {children}
    </div>
  );
}

export function SegOption({
  active,
  onClick,
  className,
  children,
}: {
  active: boolean;
  onClick: () => void;
  className?: string;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={cn(
        "flex-1 rounded-[10px] px-3 py-1.5 text-center text-[12.5px] font-medium transition-all",
        active
          ? "bg-[var(--surface)] text-[var(--text)] shadow-sm"
          : "text-[var(--text-sub)] hover:text-[var(--text)]",
        className,
      )}
    >
      {children}
    </button>
  );
}

// ── Small pill toggle used for period presets / sub-period selectors ───────────
export function PresetPill({
  active,
  onClick,
  className,
  title,
  children,
}: {
  active: boolean;
  onClick: () => void;
  className?: string;
  title?: string;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      title={title}
      className={cn(
        "flex-1 whitespace-nowrap rounded-[9px] border px-1.5 py-1 text-center font-mono text-[11px] font-medium tabular-nums transition-colors",
        active
          ? "border-[var(--brand-accent)] bg-[color-mix(in_srgb,var(--brand-accent)_12%,transparent)] text-[var(--brand-accent)]"
          : "border-[var(--border-color)] text-[var(--text-sub)] hover:text-[var(--text)]",
        className,
      )}
    >
      {children}
    </button>
  );
}

/** Primary cobalt CTA used by the "Simular" buttons. */
export function PrimaryButton({
  onClick,
  disabled,
  title,
  className,
  children,
}: {
  onClick?: () => void;
  disabled?: boolean;
  title?: string;
  className?: string;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      title={title}
      className={cn(
        "flex w-full items-center justify-center gap-2 rounded-[13px] px-[18px] py-2.5 text-[14px] font-semibold text-white transition-transform",
        disabled ? "cursor-not-allowed opacity-50" : "hover:-translate-y-[1px]",
        className,
      )}
      style={{ background: "var(--brand-cobalt)", boxShadow: "0 12px 24px -12px rgba(31,60,224,0.7)" }}
    >
      {children}
    </button>
  );
}

// ── Status pill (.st-pill) ─────────────────────────────────────────────────────
type PillTone = "ok" | "alert" | "muted" | "info";
const PILL_TONES: Record<PillTone, { bg: string; color: string }> = {
  ok:    { bg: "color-mix(in srgb, var(--moss) 16%, transparent)",  color: "var(--moss)" },
  alert: { bg: "color-mix(in srgb, var(--gold) 18%, transparent)",  color: "var(--gold)" },
  muted: { bg: "var(--surface2)",                                   color: "var(--text-sub)" },
  info:  { bg: "color-mix(in srgb, var(--brand-accent) 14%, transparent)", color: "var(--brand-accent)" },
};

export function StatusPill({ tone = "muted", children, className }: { tone?: PillTone; children: ReactNode; className?: string }) {
  const t = PILL_TONES[tone];
  return (
    <span
      className={cn("inline-flex items-center rounded-full px-[9px] py-[3px] font-mono text-[10.5px] uppercase tracking-[0.06em]", className)}
      style={{ background: t.bg, color: t.color }}
    >
      {children}
    </span>
  );
}

// ── Chart tooltip (tokenised) ──────────────────────────────────────────────────
/** Generic recharts tooltip: title + colored series rows (money). */
export function ChartTooltip({
  active,
  payload,
  label,
  footer,
  colorKey = "stroke",
}: {
  active?: boolean;
  payload?: any[];
  label?: string;
  /** Optional extra line under the rows (e.g. "% da meta"). */
  footer?: ReactNode;
  /** Which payload field holds the series color. */
  colorKey?: "stroke" | "fill" | "color";
}) {
  if (!active || !payload?.length) return null;
  return (
    <div
      className="min-w-[190px] rounded-[13px] border border-[var(--border-color)] bg-[var(--surface)] px-3 py-2.5"
      style={{ boxShadow: "var(--shadow-md)" }}
    >
      {label !== undefined && <p className="mb-2 font-mono text-[11px] uppercase tracking-[0.08em] text-[var(--text-sub)]">{label}</p>}
      {payload.map((e: any, i: number) => {
        const color = e[colorKey] ?? e.stroke ?? e.fill ?? e.color;
        return (
          <div key={e.dataKey ?? e.name ?? i} className="mb-0.5 flex justify-between gap-4">
            <span className="text-[12px]" style={{ color }}>{e.name}</span>
            <span className="font-mono text-[12px] tabular-nums" style={{ color }}>
              {formatCurrency(e.value / 100)}
            </span>
          </div>
        );
      })}
      {footer && <div className="mt-1.5 border-t border-[var(--border-color)] pt-1.5 text-[11px] text-[var(--text-sub)]">{footer}</div>}
    </div>
  );
}

// ── Legend dot + label ─────────────────────────────────────────────────────────
export function LegendItem({ color, children }: { color: string; children: ReactNode }) {
  return (
    <div className="flex items-center gap-1.5">
      <span className="h-2.5 w-2.5 rounded-[3px]" style={{ backgroundColor: color }} />
      <span className="text-[12px] text-[var(--text-sub)]">{children}</span>
    </div>
  );
}

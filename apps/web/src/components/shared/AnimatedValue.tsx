"use client";

import type { ReactNode } from "react";
import { useAnimatedNumber } from "@/lib/hooks/useAnimatedNumber";
import { formatCurrency } from "@/lib/utils/index";

/**
 * Escape hatch for numbers that are not rendered by `Money` / `StatCard` — the
 * secondary figures inside hero panels, counters, percentages. Give it the raw
 * number and format the animated value yourself:
 *
 *   <AnimatedValue value={total}>{(v) => formatCurrency(v / 100)}</AnimatedValue>
 */
export function AnimatedValue({
  value,
  children,
  enabled = true,
  duration,
}: {
  value: number;
  children: (animated: number) => ReactNode;
  enabled?: boolean;
  duration?: number;
}) {
  const animated = useAnimatedNumber(value, { enabled, duration });
  return <>{children(enabled ? animated : value)}</>;
}

/** Counts an integer-cents amount up and renders it as pt-BR currency. */
export function AnimatedCurrency({
  cents,
  enabled = true,
  absolute = false,
}: {
  cents: number;
  enabled?: boolean;
  /** Render the magnitude only — for callers that print their own +/− sign. */
  absolute?: boolean;
}) {
  const animated = useAnimatedNumber(cents, { enabled });
  const shown = enabled ? animated : cents;
  return <>{formatCurrency((absolute ? Math.abs(shown) : shown) / 100)}</>;
}

/** Counts a plain number up (item counts, quantities, percentages). */
export function AnimatedCount({
  value,
  decimals = 0,
  suffix,
  enabled = true,
}: {
  value: number;
  decimals?: number;
  suffix?: string;
  enabled?: boolean;
}) {
  const animated = useAnimatedNumber(value, { enabled });
  const shown = enabled ? animated : value;
  return (
    <>
      {shown.toLocaleString("pt-BR", {
        minimumFractionDigits: decimals,
        maximumFractionDigits: decimals,
      })}
      {suffix}
    </>
  );
}

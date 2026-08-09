"use client";

import { useEffect, useLayoutEffect, useRef, useState } from "react";

/**
 * Longer than the structural entrances in globals.css on purpose: a count-up is
 * the one animation the eye actually *reads*, so it needs time for the digits
 * to be legible on the way to the total.
 */
export const NUMBER_ANIM_DURATION = 900;

/** easeOutCubic — fast out of the gate, settles softly on the target. */
const easeOut = (t: number) => 1 - Math.pow(1 - t, 3);

const useIsomorphicLayoutEffect = typeof window === "undefined" ? useEffect : useLayoutEffect;

export function prefersReducedMotion() {
  if (typeof window === "undefined" || !window.matchMedia) return false;
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

type Options = {
  /** Animation length in ms. */
  duration?: number;
  /** When false the value is returned as-is (no animation, no rAF loop). */
  enabled?: boolean;
  /** Where the mount animation starts from. Defaults to 0. */
  from?: number;
};

/**
 * Counts from the previously displayed value to `value` whenever it changes —
 * on mount (from `from`, 0 by default) and on every later update, which is what
 * makes a filter change read as the number travelling to its new total.
 *
 * The returned number is a plain number, so callers keep full control of
 * formatting (currency, percent, compact…).
 */
export function useAnimatedNumber(value: number, options: Options = {}): number {
  const { duration = NUMBER_ANIM_DURATION, enabled = true, from = 0 } = options;

  const safeValue = Number.isFinite(value) ? value : 0;

  const [display, setDisplay] = useState(safeValue);
  const displayRef = useRef(safeValue);
  const frameRef = useRef<number | null>(null);
  const mountedRef = useRef(false);

  useIsomorphicLayoutEffect(() => {
    // Bail out entirely: keep the number static and skip the rAF loop.
    if (!enabled || prefersReducedMotion()) {
      displayRef.current = safeValue;
      setDisplay(safeValue);
      return;
    }

    const start = mountedRef.current ? displayRef.current : from;
    mountedRef.current = true;

    if (start === safeValue) {
      displayRef.current = safeValue;
      setDisplay(safeValue);
      return;
    }

    // Paint the starting frame before the browser shows anything, so the
    // number never flashes its final value first.
    displayRef.current = start;
    setDisplay(start);

    const startedAt = performance.now();
    const delta = safeValue - start;

    const step = (now: number) => {
      const t = Math.min(1, (now - startedAt) / duration);
      const next = t >= 1 ? safeValue : start + delta * easeOut(t);
      displayRef.current = next;
      setDisplay(next);
      if (t < 1) frameRef.current = requestAnimationFrame(step);
    };

    frameRef.current = requestAnimationFrame(step);

    return () => {
      if (frameRef.current !== null) cancelAnimationFrame(frameRef.current);
      frameRef.current = null;
    };
    // `from` is intentionally read-once (mount only).
  }, [safeValue, duration, enabled]);

  return display;
}

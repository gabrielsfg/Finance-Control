"use client";

import { cn } from "@/lib/utils";
import { useAnimatedNumber } from "@/lib/hooks/useAnimatedNumber";

function fmtMoney(cents: number) {
  const value = Math.abs(cents / 100);
  const [int, dec] = value.toLocaleString("pt-BR", { minimumFractionDigits: 2 }).split(",");
  return { int, dec };
}

/**
 * Money as typography (design-system signature). IBM Plex Mono, tabular-nums.
 * Cifra (R$) and cents are smaller and dimmed. Color by sign:
 * negative → clay, positive (when `sign`) → moss, neutral → foreground.
 *
 * `cents` is the integer-cents value the API traffics in.
 *
 * `animate` counts the figure up on mount and travels it to the new total when
 * it changes (a filter being applied, for instance). Opt-in: it belongs on
 * totalizadores and KPIs, not on every row of a table.
 */
export function Money({
  cents,
  sign,
  className,
  animate = false,
}: {
  cents: number;
  sign?: boolean;
  className?: string;
  animate?: boolean;
}) {
  const animated = useAnimatedNumber(cents, { enabled: animate });
  const shown = animate ? Math.round(animated) : cents;

  // Colour + sign follow the *target*, so the glyphs never flip mid-count.
  const neg = cents < 0;
  const { int, dec } = fmtMoney(shown);
  return (
    <span
      className={cn(
        "font-mono tabular-nums font-medium tracking-[-0.01em]",
        neg ? "text-[var(--clay)]" : sign ? "text-[var(--moss)]" : "text-[var(--text)]",
        className,
      )}
    >
      <span className="text-[0.62em] opacity-70 mr-[0.18em] align-[0.06em]">R$</span>
      {neg ? "− " : sign ? "+ " : ""}
      {int}
      <span className="text-[0.66em] opacity-70">,{dec}</span>
    </span>
  );
}

/**
 * The single gigantic money figure — only used inside the dark hero panel
 * (patrimônio / período). Cents rendered in `--panel-muted`.
 *
 * Always animated: this is the number the page is about, so it should be seen
 * arriving. Pass `animate={false}` to opt out.
 */
export function BigMoney({
  cents,
  className,
  style,
  animate = true,
}: {
  cents: number;
  className?: string;
  style?: React.CSSProperties;
  animate?: boolean;
}) {
  const animated = useAnimatedNumber(cents, { enabled: animate });
  const { int, dec } = fmtMoney(animate ? Math.round(animated) : cents);
  return (
    <span className={cn("font-mono tabular-nums", className)} style={style}>
      <span className="text-[0.34em] opacity-60 mr-[0.16em] align-[0.42em]">R$</span>
      {int}
      <span className="text-[0.42em] text-[var(--panel-muted)]">,{dec}</span>
    </span>
  );
}

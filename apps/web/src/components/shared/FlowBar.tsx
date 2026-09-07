import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

const IN_FILL = "bg-gradient-to-r from-[var(--moss)] to-[var(--moss-lift)]";
const OUT_FILL = "bg-gradient-to-r from-[var(--clay)] to-[var(--clay-lift)]";

/** The flow track + fill (signature viz). Lives on the dark hero, so the track is white-tinted. */
export function FlowBar({ pct, variant }: { pct: number; variant: "in" | "out" }) {
  const to = Math.min(1, Math.max(0, pct));
  return (
    <div className="h-[14px] overflow-hidden rounded-full bg-white/[0.07]">
      <div
        className={cn("flow-fill h-full rounded-full", variant === "in" ? IN_FILL : OUT_FILL)}
        style={{ "--to": to } as React.CSSProperties}
      />
    </div>
  );
}

/** The dot + label + value header shared by the flow layouts. */
export function FlowLabelRow({
  label,
  value,
  dotColor,
  valueColor,
}: {
  label: ReactNode;
  value: ReactNode;
  dotColor?: string;
  valueColor?: string;
}) {
  return (
    <div className="mb-2 flex items-baseline justify-between gap-3">
      <span className="flex items-center gap-2 text-[13px] font-medium text-[var(--panel-foreground)]">
        {dotColor && <span className="h-[9px] w-[9px] rounded-[3px]" style={{ background: dotColor }} />}
        {label}
      </span>
      <span className="font-mono text-[14px] font-medium" style={valueColor ? { color: valueColor } : undefined}>
        {value}
      </span>
    </div>
  );
}

/** A labelled flow row (dot + label + value, then the bar) for use inside the hero. */
export function FlowRow({
  label,
  value,
  pct,
  variant,
  dotColor,
  valueColor,
}: {
  label: ReactNode;
  value: ReactNode;
  pct: number;
  variant: "in" | "out";
  dotColor?: string;
  valueColor?: string;
}) {
  return (
    <div className="my-[15px]">
      <FlowLabelRow label={label} value={value} dotColor={dotColor} valueColor={valueColor} />
      <FlowBar pct={pct} variant={variant} />
    </div>
  );
}

/**
 * Two complementary flows sharing ONE track: the segments always fill it and
 * always sum to 100%, so the track reads as the volume moved in the period and
 * each segment as its share. Being a ratio, it is scale-invariant by design —
 * 300/180 draws exactly like 30.000/18.000, which is the point when the pair is
 * a composition ("entradas vs. saídas"). Use `FlowRow` instead for two
 * independent magnitudes that happen to sit next to each other.
 *
 * The tick marks the 50/50 break-even: `in` past it means a positive period.
 */
export function FlowSplit({
  inValue,
  outValue,
  inColor,
  outColor,
  tick = true,
}: {
  inValue: number;
  outValue: number;
  /** Overrides the default gradient. Required when both sides would otherwise share a
   *  hue — on one track that reads as a single undivided bar. */
  inColor?: string;
  outColor?: string;
  /** The 50/50 mark. Only meaningful when the halves are opposing flows; a composition
   *  of unequal parts (principal vs. return) has no break-even to mark. */
  tick?: boolean;
}) {
  const a = Math.max(0, inValue);
  const b = Math.max(0, outValue);
  const total = a + b;
  // Nothing moved: leave the track empty rather than drawing a 50/50 that would
  // read as a perfectly balanced period.
  const inShare = total > 0 ? (a / total) * 100 : 0;
  const outShare = total > 0 ? (b / total) * 100 : 0;

  return (
    <div className="relative h-[14px] overflow-hidden rounded-full bg-white/[0.07]">
      <div className="flex h-full w-full">
        <div
          className={cn("split-fill h-full", !inColor && IN_FILL)}
          style={{ width: `${inShare}%`, ...(inColor ? { background: inColor } : {}) }}
        />
        <div
          className={cn("split-fill h-full", !outColor && OUT_FILL)}
          style={{ width: `${outShare}%`, ...(outColor ? { background: outColor } : {}) }}
        />
      </div>
      {tick && (
        <span
          aria-hidden="true"
          className="pointer-events-none absolute inset-y-0 left-1/2 w-[2px] -translate-x-1/2"
          style={{ background: "var(--panel)", opacity: 0.55 }}
        />
      )}
    </div>
  );
}

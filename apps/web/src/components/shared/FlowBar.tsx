import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

/** The flow track + fill (signature viz). Lives on the dark hero, so the track is white-tinted. */
export function FlowBar({ pct, variant }: { pct: number; variant: "in" | "out" }) {
  const to = Math.min(1, Math.max(0, pct));
  return (
    <div className="h-[14px] overflow-hidden rounded-full bg-white/[0.07]">
      <div
        className={cn(
          "flow-fill h-full rounded-full",
          variant === "in"
            ? "bg-gradient-to-r from-[var(--moss)] to-[var(--moss-lift)]"
            : "bg-gradient-to-r from-[var(--clay)] to-[var(--clay-lift)]",
        )}
        style={{ "--to": to } as React.CSSProperties}
      />
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
      <div className="mb-2 flex items-baseline justify-between">
        <span className="flex items-center gap-2 text-[13px] font-medium text-[var(--panel-foreground)]">
          {dotColor && <span className="h-[9px] w-[9px] rounded-[3px]" style={{ background: dotColor }} />}
          {label}
        </span>
        <span className="font-mono text-[14px] font-medium" style={valueColor ? { color: valueColor } : undefined}>
          {value}
        </span>
      </div>
      <FlowBar pct={pct} variant={variant} />
    </div>
  );
}

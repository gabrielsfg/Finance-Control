import { cn } from "@/lib/utils";

type ProgressBarProps = {
  value: number;
  max: number;
  color?: string;
  height?: number;
  className?: string;
  /** When true, the track is a lighter tint of `color` (visible even at 0%). */
  tinted?: boolean;
  /** Fill color when value exceeds max. Defaults to clay. */
  overflowColor?: string;
};

export const ProgressBar = ({
  value,
  max,
  color = "var(--moss)",
  height = 6,
  className,
  tinted = false,
  overflowColor = "var(--clay)",
}: ProgressBarProps) => {
  const pct = max > 0 ? Math.min((value / max) * 100, 100) : 0;
  const isOverflow = value > max;

  return (
    <div
      className={cn("w-full overflow-hidden rounded-full", !tinted && "bg-[var(--surface3)]", className)}
      style={tinted ? { height, background: `color-mix(in srgb, ${color} 20%, transparent)` } : { height }}
    >
      <div
        className="h-full rounded-full transition-all duration-300"
        style={{
          width: `${pct}%`,
          backgroundColor: isOverflow ? overflowColor : color,
        }}
      />
    </div>
  );
};

import { cn } from "@/lib/utils";

type ProgressBarProps = {
  value: number;
  max: number;
  color?: string;
  height?: number;
  className?: string;
};

export const ProgressBar = ({ value, max, color = "#00C98D", height = 6, className }: ProgressBarProps) => {
  const pct = Math.min((value / max) * 100, 100);
  const isOverflow = value > max;

  return (
    <div
      className={cn("w-full overflow-hidden rounded-full bg-surface3", className)}
      style={{ height }}
    >
      <div
        className="h-full rounded-full transition-all duration-300"
        style={{
          width: `${pct}%`,
          backgroundColor: isOverflow ? "#F25F5C" : color,
        }}
      />
    </div>
  );
};

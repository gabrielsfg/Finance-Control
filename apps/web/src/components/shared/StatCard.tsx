import { type LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { formatCurrency, formatPercent, formatPercentNeutral } from "@/lib/utils/index";

type StatCardProps = {
  label: string;
  value: number;
  /** How `value` is rendered. Defaults to currency. */
  format?: "currency" | "percent";
  change?: number;
  previousValue?: number;
  lowerIsBetter?: boolean;
  subText?: string;
  icon: LucideIcon;
  iconColor: string;
  className?: string;
};

export const StatCard = ({
  label,
  value,
  format = "currency",
  change,
  previousValue,
  lowerIsBetter = false,
  subText,
  icon: Icon,
  iconColor,
  className,
}: StatCardProps) => {
  const rawPositive = (change ?? 0) >= 0;
  const isGood = lowerIsBetter ? !rawPositive : rawPositive;

  const isNegative = value < 0;
  const valueColor = isNegative ? "text-red" : "text-text";

  return (
    <div className={cn("border-border bg-surface rounded-xl border p-5", className)}>
      <div className="mb-3 flex items-center justify-between">
        <span className="text-text-muted text-[12px] uppercase tracking-[0.04em]">{label}</span>
        <div
          className="flex h-8 w-8 items-center justify-center rounded-[8px]"
          style={{ backgroundColor: `${iconColor}18` }}
        >
          <Icon size={15} strokeWidth={1.75} style={{ color: iconColor }} />
        </div>
      </div>
      <p className={cn("font-money font-600 text-[22px]", valueColor)}>
        {isNegative && "-"}
        {format === "percent" ? formatPercentNeutral(Math.abs(value), 1) : formatCurrency(Math.abs(value))}
      </p>
      {subText !== undefined && (
        <p className="text-text-muted mt-1.5 text-[12px]">{subText}</p>
      )}
      {change !== undefined && (
        <p className="mt-1.5 flex items-baseline gap-1 flex-wrap">
          <span className={cn("font-mono text-[12px] font-medium", isGood ? "text-green" : "text-red")}>
            {formatPercent(change)}
          </span>
          <span className="text-text-muted text-[12px]">
            {previousValue !== undefined
              ? `vs. ${formatCurrency(previousValue)} mês anterior`
              : "vs. mês anterior"}
          </span>
        </p>
      )}
    </div>
  );
};

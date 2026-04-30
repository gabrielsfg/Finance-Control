import { type LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { formatCurrency, formatPercent } from "@/lib/utils/index";

type StatCardProps = {
  label: string;
  value: number;
  change?: number;
  lowerIsBetter?: boolean;
  showNegative?: boolean;
  icon: LucideIcon;
  iconColor: string;
  className?: string;
};

export const StatCard = ({
  label,
  value,
  change,
  lowerIsBetter = false,
  showNegative = false,
  icon: Icon,
  iconColor,
  className,
}: StatCardProps) => {
  const rawPositive = (change ?? 0) >= 0;
  const isGood = lowerIsBetter ? !rawPositive : rawPositive;

  return (
    <div className={cn("border-border bg-surface rounded-xl border p-5", className)}>
      <div className="mb-3 flex items-center justify-between">
        <span className="font-display font-700 text-text text-[18px]">{label}</span>
        <div
          className="flex h-8 w-8 items-center justify-center rounded-[8px]"
          style={{ backgroundColor: `${iconColor}18` }}
        >
          <Icon size={15} strokeWidth={1.75} style={{ color: iconColor }} />
        </div>
      </div>
      <p className="font-money font-600 text-text text-[22px]">
        {showNegative ? "-" : ""}{formatCurrency(value)}
      </p>
      {change !== undefined && (
        <p className="mt-1.5 flex items-baseline gap-1.5">
          <span className={cn("font-mono text-[13px]", isGood ? "text-green" : "text-red")}>
            {formatPercent(change)}
          </span>
          <span className="text-text-muted text-[13px]">vs. mês anterior</span>
        </p>
      )}
    </div>
  );
};

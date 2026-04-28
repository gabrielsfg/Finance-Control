import { type LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { formatCurrency, formatPercent } from "@/lib/utils/index";

type StatCardProps = {
  label: string;
  value: number;
  change?: number;
  icon: LucideIcon;
  iconColor: string;
  className?: string;
};

export const StatCard = ({ label, value, change, icon: Icon, iconColor, className }: StatCardProps) => {
  const isPositive = (change ?? 0) >= 0;

  return (
    <div className={cn("rounded-xl border border-border bg-surface p-5", className)}>
      <div className="mb-3 flex items-center justify-between">
        <span className="text-[12px] text-text-muted">{label}</span>
        <div
          className="flex h-8 w-8 items-center justify-center rounded-[8px]"
          style={{ backgroundColor: `${iconColor}18` }}
        >
          <Icon size={15} strokeWidth={1.75} style={{ color: iconColor }} />
        </div>
      </div>
      <p className="font-money text-[22px] font-600 text-text">{formatCurrency(value)}</p>
      {change !== undefined && (
        <p className={cn("mt-1.5 text-[12px]", isPositive ? "text-green" : "text-red")}>
          {formatPercent(change)} vs. mês anterior
        </p>
      )}
    </div>
  );
};

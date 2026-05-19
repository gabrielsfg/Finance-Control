"use client";

import { SectionHeader } from "@/components/shared/SectionHeader";
import { formatCurrency } from "@/lib/utils/formatCurrency";
import { cn } from "@/lib/utils";
import type { DaySpend } from "@/lib/types/analytics.types";

type Props = { data: DaySpend[]; month: string };

export const AnalyticsSpendHeatmap = ({ data, month }: Props) => {
  const max = Math.max(...data.map((d) => d.total), 1);

  const getIntensity = (total: number) => {
    if (total === 0) return 0;
    const pct = total / max;
    if (pct < 0.25) return 1;
    if (pct < 0.5) return 2;
    if (pct < 0.75) return 3;
    return 4;
  };

  const intensityClass: Record<number, string> = {
    0: "bg-surface3",
    1: "bg-red/20",
    2: "bg-red/40",
    3: "bg-red/65",
    4: "bg-red",
  };

  return (
    <div className="border-border bg-surface rounded-xl border p-5">
      <SectionHeader title="Gastos Diários" subtitle={month} />
      <div className="flex flex-wrap gap-1.5">
        {data.map((day) => {
          const intensity = getIntensity(day.total);
          const dayNum = parseInt(day.date.split("-")[2]);
          return (
            <div
              key={day.date}
              title={`${day.date}: ${formatCurrency(day.total / 100)}`}
              className={cn(
                "flex h-8 w-8 cursor-default items-center justify-center rounded-[6px] text-[11px] transition-transform hover:scale-110",
                intensityClass[intensity],
                intensity >= 3 ? "text-white" : "text-text-muted",
              )}
            >
              {dayNum}
            </div>
          );
        })}
      </div>
      <div className="mt-3 flex items-center gap-2">
        <span className="text-text-muted text-[11px]">Menos</span>
        {[0, 1, 2, 3, 4].map((i) => (
          <div key={i} className={cn("h-3 w-3 rounded-[3px]", intensityClass[i])} />
        ))}
        <span className="text-text-muted text-[11px]">Mais</span>
      </div>
    </div>
  );
};

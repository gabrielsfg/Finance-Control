"use client";

import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  ReferenceLine,
  Cell,
} from "recharts";
import { Card, CardHead } from "@/components/shared/Card";
import { ChartEmptyState } from "@/components/shared/ChartEmptyState";
import { formatCurrency, formatCurrencyCompact } from "@/lib/utils/index";
import type { SavingsPeriodItem } from "@/lib/types/analytics.types";
import { periodShortLabel } from "../savingsPeriod";
import { chartAnim } from "@/lib/config/chartAnimation";

const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="border-border bg-surface rounded-lg border px-3 py-2 shadow-md">
      <p className="text-text-muted mb-1.5 text-[11px]">{label}</p>
      {payload.map((entry: any) => (
        <p key={entry.dataKey} className="font-money text-[13px]" style={{ color: entry.color ?? entry.fill }}>
          {entry.name}: {entry.value < 0 ? "-" : ""}{formatCurrency(Math.abs(entry.value))}
        </p>
      ))}
    </div>
  );
};

type Props = {
  periods: SavingsPeriodItem[];
  plannedSavings: number; // cents
};

export function SavingsPlannedVsActualChart({ periods, plannedSavings }: Props) {
  const chartData = periods.map((p) => ({
    label: periodShortLabel(p.periodStart),
    planejado: plannedSavings / 100,
    executado: p.savings / 100,
  }));

  return (
    <Card className="flex flex-col">
      <CardHead
        title="Planejado vs. Executado"
        subtitle="Quanto o orçamento previa poupar e quanto você realmente poupou"
      />

      {chartData.length === 0 ? (
        <ChartEmptyState />
      ) : (
        <>
          <div className="w-full" style={{ height: 260 }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} margin={{ top: 4, right: 4, left: 0, bottom: 0 }}>
                <CartesianGrid stroke="var(--border-color)" strokeDasharray="3 5" vertical={false} />
                <XAxis
                  dataKey="label"
                  tick={{ fill: "var(--text-sub)", fontSize: 10, fontFamily: "IBM Plex Mono" }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  tick={{ fill: "var(--text-sub)", fontSize: 10, fontFamily: "IBM Plex Mono" }}
                  axisLine={false}
                  tickLine={false}
                  tickFormatter={(v) => formatCurrencyCompact(v)}
                  width={72}
                />
                <Tooltip content={<CustomTooltip />} cursor={{ fill: "var(--surface2)", opacity: 0.5 }} />
                <ReferenceLine y={0} stroke="var(--border-color)" />
                <Bar {...chartAnim(0)} dataKey="planejado" name="Planejado" fill="var(--chart-2)" fillOpacity={0.45} radius={[4, 4, 0, 0]} maxBarSize={28} />
                <Bar {...chartAnim(1)} dataKey="executado" name="Executado" radius={[4, 4, 0, 0]} maxBarSize={28}>
                  {chartData.map((entry, i) => (
                    <Cell key={i} fill={entry.executado < 0 ? "var(--chart-3)" : "var(--chart-1)"} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="mt-3 flex flex-wrap gap-5">
            {[
              ["var(--chart-2)", "Planejado"],
              ["var(--chart-1)", "Executado (positivo)"],
              ["var(--chart-3)", "Executado (negativo)"],
            ].map(([color, label]) => (
              <div key={label} className="flex items-center gap-1.5">
                <div className="h-2.5 w-2.5 rounded-[2px]" style={{ backgroundColor: color, opacity: label === "Planejado" ? 0.45 : 1 }} />
                <span className="text-text-muted text-[13px]">{label}</span>
              </div>
            ))}
          </div>
        </>
      )}
    </Card>
  );
}

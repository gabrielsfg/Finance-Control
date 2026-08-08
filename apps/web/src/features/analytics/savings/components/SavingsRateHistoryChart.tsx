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
import { Flame } from "lucide-react";
import { Card, CardHead } from "@/components/shared/Card";
import { ChartEmptyState } from "@/components/shared/ChartEmptyState";
import type { SavingsPeriodItem } from "@/lib/types/analytics.types";
import { periodShortLabel } from "../savingsPeriod";
import { chartAnim } from "@/lib/config/chartAnimation";

function barFill(rate: number): string {
  if (rate < 10) return "var(--chart-3)";
  if (rate < 20) return "var(--chart-4)";
  return "var(--chart-1)";
}

const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  const rate: number = payload[0]?.value ?? 0;
  return (
    <div className="border-border bg-surface rounded-lg border px-3 py-2 shadow-md">
      <p className="text-text-muted mb-1.5 text-[11px]">{label}</p>
      <p className="font-money text-[13px]" style={{ color: barFill(rate) }}>
        Taxa de economia: {rate.toFixed(1).replace(".", ",")}%
      </p>
    </div>
  );
};

type Props = {
  periods: SavingsPeriodItem[];
  plannedRate: number | null;
  positiveStreak: number;
};

export function SavingsRateHistoryChart({ periods, plannedRate, positiveStreak }: Props) {
  const chartData = periods
    .filter((p) => p.savingsRate !== null)
    .map((p) => ({
      label: periodShortLabel(p.periodStart),
      rate: p.savingsRate as number,
    }));

  const avgRate =
    chartData.length > 0 ? chartData.reduce((s, d) => s + d.rate, 0) / chartData.length : 0;

  return (
    <Card className="flex flex-col">
      <CardHead
        title="Taxa de Economia por Período"
        subtitle="Percentual do que você recebeu que ficou com você"
      />

      {chartData.length === 0 ? (
        <ChartEmptyState message="Sem receitas registradas nos períodos" />
      ) : (
        <>
          <div className="bg-surface2 mb-5 grid grid-cols-2 gap-3 rounded-xl p-4">
            <div>
              <p className="text-text-muted text-[12px]">Sequência positiva</p>
              <div className="mt-0.5 flex items-center gap-1.5">
                <Flame
                  size={18}
                  style={{ color: positiveStreak > 0 ? "var(--orange)" : "var(--text-muted)" }}
                />
                <p className="font-money font-600 text-[18px]">
                  {positiveStreak} {positiveStreak === 1 ? "período" : "períodos"}
                </p>
              </div>
              <p className="text-text-muted mt-0.5 text-[11px]">
                {positiveStreak > 0 ? "economizando sem interrupção" : "nenhum período fechado positivo"}
              </p>
            </div>
            <div>
              <p className="text-text-muted text-[12px]">Taxa média</p>
              <p className="font-money font-600 mt-0.5 text-[18px]" style={{ color: barFill(avgRate) }}>
                {avgRate.toFixed(1).replace(".", ",")}%
              </p>
              <p className="text-text-muted mt-0.5 text-[11px]">
                {plannedRate !== null
                  ? avgRate >= plannedRate
                    ? "acima da meta do orçamento"
                    : `${(plannedRate - avgRate).toFixed(1).replace(".", ",")}pp abaixo da meta`
                  : "nos períodos exibidos"}
              </p>
            </div>
          </div>

          <div className="w-full" style={{ height: 240 }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} margin={{ top: 4, right: 4, left: 0, bottom: 0 }}>
                <CartesianGrid stroke="var(--border-chart)" />
                <XAxis
                  dataKey="label"
                  tick={{ fill: "var(--text-muted)", fontSize: 12, fontFamily: "DM Sans" }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  tick={{ fill: "var(--text-muted)", fontSize: 12, fontFamily: "JetBrains Mono" }}
                  axisLine={false}
                  tickLine={false}
                  tickFormatter={(v) => `${v}%`}
                  width={48}
                />
                <Tooltip content={<CustomTooltip />} cursor={{ fill: "var(--surface2)", opacity: 0.5 }} />
                {plannedRate !== null && (
                  <ReferenceLine
                    y={plannedRate}
                    stroke="var(--blue)"
                    strokeDasharray="4 3"
                    strokeWidth={1.5}
                    label={{ value: "Meta", fill: "var(--blue)", fontSize: 11, position: "right" }}
                  />
                )}
                <Bar {...chartAnim(0)} dataKey="rate" name="Taxa de economia" radius={[4, 4, 0, 0]} maxBarSize={36}>
                  {chartData.map((entry, i) => (
                    <Cell key={i} fill={barFill(entry.rate)} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </>
      )}
    </Card>
  );
}

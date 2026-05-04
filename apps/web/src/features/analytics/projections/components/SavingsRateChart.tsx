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
import { TrendingUp, TrendingDown, Minus } from "lucide-react";
import { SectionHeader } from "@/components/shared/SectionHeader";
import type { MonthlyData } from "@/lib/types/analytics.types";

const RECOMMENDED_RATE = 20;

function barFill(rate: number): string {
  if (rate < 10)  return "var(--red)";
  if (rate < 20)  return "var(--orange)";
  return "var(--green)";
}

const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  const rate: number = payload[0]?.value ?? 0;
  return (
    <div className="border-border bg-surface rounded-lg border px-3 py-2 shadow-md">
      <p className="text-text-muted mb-1.5 text-[11px]">{label}</p>
      <p className="font-money text-[13px]" style={{ color: barFill(rate) }}>
        Taxa de poupança: {rate.toFixed(1)}%
      </p>
    </div>
  );
};

type Props = { data: MonthlyData[] };

export function SavingsRateChart({ data }: Props) {
  const chartData = data
    .filter((m) => m.totalIncome > 0)
    .map((m) => ({
      label:       m.label,
      savingsRate: Math.round(((m.totalIncome - m.totalExpense) / m.totalIncome) * 1000) / 10,
    }));

  const rates = chartData.map((d) => d.savingsRate);
  const avgRate = rates.length > 0 ? rates.reduce((s, r) => s + r, 0) / rates.length : 0;

  // Simple trend: compare last 3 vs previous 3
  const half = Math.floor(rates.length / 2);
  const recentAvg = rates.slice(-Math.min(3, rates.length)).reduce((s, r) => s + r, 0) / Math.min(3, rates.length);
  const olderAvg  = half > 0 ? rates.slice(0, half).reduce((s, r) => s + r, 0) / half : recentAvg;
  const trend = recentAvg - olderAvg;

  const TrendIcon = trend > 1 ? TrendingUp : trend < -1 ? TrendingDown : Minus;
  const trendColor = trend > 1 ? "var(--green)" : trend < -1 ? "var(--red)" : "var(--text-muted)";

  return (
    <div className="border-border bg-surface flex flex-col rounded-xl border p-5">
      <SectionHeader
        title="Evolução da Taxa de Poupança"
        subtitle="Percentual da renda que está sendo poupado a cada mês"
      />

      {/* Summary */}
      <div className="bg-surface2 mb-5 grid grid-cols-2 gap-3 rounded-xl p-4">
        <div>
          <p className="text-text-muted text-[12px]">Taxa média</p>
          <p
            className="font-money font-600 text-[18px]"
            style={{ color: barFill(avgRate) }}
          >
            {avgRate.toFixed(1)}%
          </p>
          <p className="text-text-muted mt-0.5 text-[11px]">
            {avgRate >= RECOMMENDED_RATE
              ? "Acima da meta recomendada"
              : `${(RECOMMENDED_RATE - avgRate).toFixed(1)}pp abaixo da meta`}
          </p>
        </div>
        <div>
          <p className="text-text-muted text-[12px]">Tendência recente</p>
          <div className="mt-0.5 flex items-center gap-1.5">
            <TrendIcon size={18} style={{ color: trendColor }} />
            <p className="font-money font-600 text-[18px]" style={{ color: trendColor }}>
              {trend >= 0 ? "+" : ""}{trend.toFixed(1)}pp
            </p>
          </div>
          <p className="text-text-muted mt-0.5 text-[11px]">vs. média anterior</p>
        </div>
      </div>

      <div className="w-full" style={{ height: 260 }}>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={chartData} margin={{ top: 4, right: 4, left: 0, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
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
            <ReferenceLine
              y={RECOMMENDED_RATE}
              stroke="var(--blue)"
              strokeDasharray="4 3"
              strokeWidth={1.5}
              label={{ value: "Meta 20%", fill: "var(--blue)", fontSize: 11, position: "right" }}
            />
            <Bar dataKey="savingsRate" name="Taxa de poupança" radius={[4, 4, 0, 0]} maxBarSize={36}>
              {chartData.map((entry) => (
                <Cell key={entry.label} fill={barFill(entry.savingsRate)} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div className="mt-3 flex flex-wrap gap-5">
        {[
          ["var(--green)",  "> 20% (ótimo)"],
          ["var(--orange)", "10–20% (ok)"],
          ["var(--red)",    "< 10% (atenção)"],
        ].map(([color, label]) => (
          <div key={label as string} className="flex items-center gap-1.5">
            <div className="h-2.5 w-2.5 rounded-[2px]" style={{ backgroundColor: color as string }} />
            <span className="text-text-muted text-[13px]">{label as string}</span>
          </div>
        ))}
        <div className="flex items-center gap-1.5">
          <svg width="20" height="12">
            <line x1="0" y1="6" x2="20" y2="6" stroke="var(--blue)" strokeWidth="2" strokeDasharray="4 3" />
          </svg>
          <span className="text-text-muted text-[13px]">Meta recomendada (20%)</span>
        </div>
      </div>
    </div>
  );
}

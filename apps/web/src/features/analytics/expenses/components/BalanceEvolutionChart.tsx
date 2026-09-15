"use client";

import {
  ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid,
} from "recharts";
import { Card, CardHead } from "@/components/shared/Card";
import { ChartEmptyState } from "@/components/shared/ChartEmptyState";
import { formatCurrency, formatCurrencyCompact } from "@/lib/utils/formatCurrency";
import type { BalanceEvolutionPoint } from "@/lib/types/analytics.types";
import { chartAnim } from "@/lib/config/chartAnimation";

const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  const value = payload[0]?.value ?? 0;
  return (
    <div className="border-border bg-surface rounded-lg border px-3 py-2 shadow-md">
      <p className="text-text-muted mb-1 text-[11px]">{label}</p>
      <p className={`font-money text-[13px] ${value >= 0 ? "text-green" : "text-red"}`}>
        {formatCurrency(value / 100)}
      </p>
    </div>
  );
};

const labelFor = (d: Date) => d.toLocaleDateString("pt-BR", { day: "2-digit", month: "short" });

type Props = { data: BalanceEvolutionPoint[] };

export function BalanceEvolutionChart({ data }: Props) {
  if (data.length === 0) {
    return (
      <div className="border-border bg-surface flex flex-col rounded-[20px] border p-5">
        <CardHead title="Evolução do Saldo" subtitle="Saldo acumulado por data no período" />
        <ChartEmptyState message="Sem movimentações no período selecionado" />
      </div>
    );
  }

  // The API only emits a point on days that moved. Recharts spaces categories evenly, so
  // those gaps used to render as if a three-week lull took the same time as a single day —
  // the slope of the line was whatever the gaps happened to be. Filling the quiet days in
  // at the balance they carried makes the horizontal axis mean elapsed time again.
  const chartData: { label: string; balance: number }[] = [];
  const dayMs = 86_400_000;
  const asDate = (iso: string) => new Date(iso.slice(0, 10) + "T00:00:00");

  for (let i = 0; i < data.length; i++) {
    const point = data[i];
    chartData.push({ label: labelFor(asDate(point.date)), balance: point.balance });

    const next = data[i + 1];
    if (!next) continue;

    // Cap the fill so a multi-year gap cannot blow the series up; past that the gap is
    // the story and drawing every day of it buys nothing.
    const gapDays = Math.round((asDate(next.date).getTime() - asDate(point.date).getTime()) / dayMs);
    if (gapDays <= 1 || gapDays > 400) continue;

    for (let d = 1; d < gapDays; d++) {
      chartData.push({
        label: labelFor(new Date(asDate(point.date).getTime() + d * dayMs)),
        balance: point.balance,
      });
    }
  }

  const hasNegative = chartData.some((p) => p.balance < 0);

  return (
    <div className="border-border bg-surface flex flex-col rounded-[20px] border p-5">
      <CardHead title="Evolução do Saldo" subtitle="Saldo acumulado por data no período" />
      <div className="w-full" style={{ height: 220 }}>
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={chartData} margin={{ top: 4, right: 4, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id="balGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="var(--green)" stopOpacity={0.15} />
                <stop offset="95%" stopColor="var(--green)" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid stroke="var(--border-chart)" />
            <XAxis
              dataKey="label"
              tick={{ fill: "var(--text-muted)", fontSize: 11, fontFamily: "DM Sans" }}
              axisLine={false} tickLine={false}
              interval="preserveStartEnd"
            />
            <YAxis
              tickFormatter={(v) => formatCurrencyCompact(v / 100)}
              tick={{ fill: "var(--text-muted)", fontSize: 11, fontFamily: "DM Sans" }}
              axisLine={false} tickLine={false} width={56}
            />
            <Tooltip content={<CustomTooltip />} />
            <Area
              {...chartAnim(0)}
              type="monotone"
              dataKey="balance"
              name="Saldo"
              stroke={hasNegative ? "var(--orange)" : "var(--green)"}
              fill="url(#balGrad)"
              strokeWidth={2}
              dot={false}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

"use client";

import {
  ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid, ReferenceLine,
} from "recharts";
import { Card, CardHead } from "@/components/shared/Card";
import { ChartEmptyState } from "@/components/shared/ChartEmptyState";
import { formatCurrency, formatCurrencyCompact } from "@/lib/utils/formatCurrency";
import type { BalanceProjectionResponse } from "@/lib/types/analytics.types";
import { chartAnim } from "@/lib/config/chartAnimation";

const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="border-border bg-surface rounded-lg border px-3 py-2 shadow-md">
      <p className="text-text-muted mb-1.5 text-[11px]">{label}</p>
      {payload.map((e: any) => (
        <p key={e.name} className="font-money text-[12px]" style={{ color: e.stroke }}>
          {e.name}: {formatCurrency(e.value / 100)}
        </p>
      ))}
    </div>
  );
};

function toLabel(date: string) {
  return new Date(date).toLocaleDateString("pt-BR", { day: "2-digit", month: "short" });
}

type Props = { data: BalanceProjectionResponse };

export function BalanceProjectionChart({ data }: Props) {
  const actualPoints = data.actual.map((p) => ({
    label: toLabel(p.date),
    actual: p.balance,
    projected: null as number | null,
  }));

  const projectedPoints = data.projected.map((p) => ({
    label: toLabel(p.date),
    actual: null as number | null,
    projected: p.balance,
  }));

  const chartData = [...actualPoints, ...projectedPoints];

  if (chartData.length === 0) {
    return (
      <Card className="flex flex-col">
        <CardHead title="Projeção de Saldo" subtitle="Tendência baseada nos últimos 30 dias" />
        <ChartEmptyState message="Sem transações suficientes para gerar projeção" />
      </Card>
    );
  }

  return (
    <Card className="flex flex-col">
      <CardHead
        title="Projeção de Saldo"
        subtitle="Tendência baseada nos últimos 30 dias"
        right={
          <div className="flex flex-col items-end gap-1">
            <span className="font-mono text-[11px] tracking-[0.1em] uppercase text-[var(--text-sub)]">Saldo projetado</span>
            <span className={`font-mono text-[16px] font-semibold tabular-nums ${data.projectedBalance >= 0 ? "text-[var(--moss)]" : "text-[var(--clay)]"}`}>
              {formatCurrency(data.projectedBalance / 100)}
            </span>
          </div>
        }
      />

      <div className="w-full" style={{ height: 220 }}>
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={chartData} margin={{ top: 4, right: 4, left: 0, bottom: 0 }}>
            <CartesianGrid stroke="var(--border-color)" strokeDasharray="3 5" vertical={false} />
            <XAxis
              dataKey="label"
              tick={{ fill: "var(--text-sub)", fontSize: 10, fontFamily: "IBM Plex Mono" }}
              axisLine={false} tickLine={false}
              interval="preserveStartEnd"
            />
            <YAxis
              tickFormatter={(v) => formatCurrencyCompact(v / 100)}
              tick={{ fill: "var(--text-sub)", fontSize: 10, fontFamily: "IBM Plex Mono" }}
              axisLine={false} tickLine={false} width={56}
            />
            <Tooltip content={<CustomTooltip />} />
            <ReferenceLine y={0} stroke="var(--border-color)" strokeDasharray="4 4" />
            <Line
              {...chartAnim(0)}
              type="monotone"
              dataKey="actual"
              name="Real"
              stroke="var(--brand-cobalt)"
              strokeWidth={2}
              dot={false}
              connectNulls={false}
            />
            <Line
              {...chartAnim(1)}
              type="monotone"
              dataKey="projected"
              name="Projetado"
              stroke="var(--purple)"
              strokeWidth={2}
              strokeDasharray="5 4"
              dot={false}
              connectNulls={false}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </Card>
  );
}

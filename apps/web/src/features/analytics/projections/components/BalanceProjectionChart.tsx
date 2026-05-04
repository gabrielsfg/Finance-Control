"use client";

import {
  ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid, ReferenceLine,
} from "recharts";
import { SectionHeader } from "@/components/shared/SectionHeader";
import { formatCurrency, formatCurrencyCompact } from "@/lib/utils/formatCurrency";
import type { BalanceProjectionResponse } from "@/lib/types/analytics.types";

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

  return (
    <div className="border-border bg-surface flex flex-col rounded-xl border p-5">
      <div className="mb-4 flex items-start justify-between gap-4">
        <SectionHeader
          title="Projeção de Saldo"
          subtitle="Tendência baseada nos últimos 30 dias"
        />
        <div className="flex flex-col items-end gap-1">
          <span className="text-text-muted text-[11px]">Saldo projetado</span>
          <span className={`font-money text-[16px] font-600 ${data.projectedBalance >= 0 ? "text-green" : "text-red"}`}>
            {formatCurrency(data.projectedBalance / 100)}
          </span>
        </div>
      </div>

      <div className="w-full" style={{ height: 220 }}>
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={chartData} margin={{ top: 4, right: 4, left: 0, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
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
            <ReferenceLine y={0} stroke="var(--border)" strokeDasharray="4 4" />
            <Line
              type="monotone"
              dataKey="actual"
              name="Real"
              stroke="var(--blue)"
              strokeWidth={2}
              dot={false}
              connectNulls={false}
            />
            <Line
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
    </div>
  );
}

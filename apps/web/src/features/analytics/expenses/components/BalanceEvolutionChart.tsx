"use client";

import {
  ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid,
} from "recharts";
import { SectionHeader } from "@/components/shared/SectionHeader";
import { ChartEmptyState } from "@/components/shared/ChartEmptyState";
import { formatCurrency, formatCurrencyCompact } from "@/lib/utils/formatCurrency";
import type { BalanceEvolutionPoint } from "@/lib/types/analytics.types";

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

type Props = { data: BalanceEvolutionPoint[] };

export function BalanceEvolutionChart({ data }: Props) {
  if (data.length === 0) {
    return (
      <div className="border-border bg-surface flex flex-col rounded-xl border p-5">
        <SectionHeader title="Evolução do Saldo" subtitle="Saldo acumulado por data no período" />
        <ChartEmptyState message="Sem movimentações no período selecionado" />
      </div>
    );
  }

  const chartData = data.map((p) => ({
    label: new Date(p.date).toLocaleDateString("pt-BR", { day: "2-digit", month: "short" }),
    balance: p.balance,
  }));

  const hasNegative = chartData.some((p) => p.balance < 0);

  return (
    <div className="border-border bg-surface flex flex-col rounded-xl border p-5">
      <SectionHeader title="Evolução do Saldo" subtitle="Saldo acumulado por data no período" />
      <div className="w-full" style={{ height: 220 }}>
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={chartData} margin={{ top: 4, right: 4, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id="balGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="var(--green)" stopOpacity={0.15} />
                <stop offset="95%" stopColor="var(--green)" stopOpacity={0} />
              </linearGradient>
            </defs>
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
            <Area
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

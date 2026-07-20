"use client";

import {
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid,
} from "recharts";
import { Card, CardHead } from "@/components/shared/Card";
import { ChartEmptyState } from "@/components/shared/ChartEmptyState";
import { formatCurrency, formatCurrencyCompact } from "@/lib/utils/formatCurrency";
import type { MonthlyData } from "@/lib/types/analytics.types";

const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="border-border bg-surface rounded-lg border px-3 py-2 shadow-md">
      <p className="text-text-muted mb-1.5 text-[11px]">{label}</p>
      {payload.map((entry: any) => (
        <p key={entry.name} className="font-money text-[12px]" style={{ color: entry.fill }}>
          {entry.name}: {formatCurrency(entry.value / 100)}
        </p>
      ))}
    </div>
  );
};

type Props = { data: MonthlyData[] };

export const AnalyticsTrendChart = ({ data }: Props) => (
  <Card className="flex h-full flex-col">
    <CardHead title="Evolução Mensal" subtitle="Receitas vs. Despesas vs. Saldo" />
    {data.length === 0 ? (
      <ChartEmptyState message="Nenhuma movimentação no período" />
    ) : (
      <>
        <div className="w-full flex-1" style={{ minHeight: 240 }}>
          <ResponsiveContainer width="100%" height="100%" minWidth={0}>
            <BarChart data={data} margin={{ top: 4, right: 4, left: 0, bottom: 0 }}>
              <CartesianGrid stroke="var(--border-color)" strokeDasharray="3 5" vertical={false} />
              <XAxis dataKey="label" tick={{ fill: "var(--text-sub)", fontSize: 10, fontFamily: "IBM Plex Mono" }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: "var(--text-sub)", fontSize: 10, fontFamily: "IBM Plex Mono" }} axisLine={false} tickLine={false} tickFormatter={(v) => formatCurrencyCompact(v / 100)} width={70} />
              <Tooltip content={<CustomTooltip />} cursor={{ fill: "var(--surface2)", opacity: 0.5 }} />
              <Bar dataKey="totalIncome" name="Receitas" fill="var(--chart-1)" radius={[4, 4, 0, 0]} maxBarSize={32} />
              <Bar dataKey="totalExpense" name="Despesas" fill="var(--chart-3)" radius={[4, 4, 0, 0]} maxBarSize={32} />
              <Bar dataKey="balance" name="Saldo" fill="var(--chart-2)" radius={[4, 4, 0, 0]} maxBarSize={32} />
            </BarChart>
          </ResponsiveContainer>
        </div>
        <div className="mt-3 flex gap-4">
          {[["var(--chart-1)", "Receitas"], ["var(--chart-3)", "Despesas"], ["var(--chart-2)", "Saldo"]].map(([color, label]) => (
            <div key={label} className="flex items-center gap-1.5">
              <div className="h-2.5 w-2.5 rounded-[2px]" style={{ backgroundColor: color }} />
              <span className="text-text-muted text-[13px]">{label}</span>
            </div>
          ))}
        </div>
      </>
    )}
  </Card>
);

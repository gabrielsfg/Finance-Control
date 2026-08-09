"use client";

import {
  ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid,
} from "recharts";
import { Card, CardHead } from "@/components/shared/Card";
import { ChartEmptyState } from "@/components/shared/ChartEmptyState";
import { formatCurrency, formatCurrencyCompact } from "@/lib/utils/formatCurrency";
import type { CategoryBreakdown, CategoryMonthlyData } from "@/lib/types/analytics.types";
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

type Props = {
  data: CategoryMonthlyData[];
  categories: CategoryBreakdown[];
};

export const AnalyticsCategoryEvolutionChart = ({ data, categories }: Props) => (
  <Card className="flex flex-col">
    <CardHead title="Evolução por Categoria" subtitle="Gastos mensais por categoria (últimos 7 meses)" />

    {data.length === 0 || categories.length === 0 ? (
      <ChartEmptyState message="Nenhum gasto por categoria no período" />
    ) : (
      <>
        <div className="w-full" style={{ height: 260 }}>
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data} margin={{ top: 4, right: 4, left: 0, bottom: 0 }}>
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
                tickFormatter={(v) => formatCurrencyCompact(v / 100)}
                width={70}
              />
              <Tooltip content={<CustomTooltip />} cursor={{ stroke: "var(--border-color)", strokeWidth: 1, strokeDasharray: "4 4" }} />
              {categories.map((cat) => {
                const color = cat.color ?? "var(--chart-5)";
                return (
                  <Line
                    {...chartAnim(0)}
                    key={cat.categoryName}
                    type="monotone"
                    dataKey={cat.categoryName}
                    stroke={color}
                    strokeWidth={2.5}
                    dot={false}
                    activeDot={{ r: 5 }}
                  />
                );
              })}
            </LineChart>
          </ResponsiveContainer>
        </div>
        <div className="mt-3 flex flex-wrap gap-x-4 gap-y-2">
          {categories.map((cat) => (
            <div key={cat.categoryName} className="flex items-center gap-1.5">
              <div className="h-2.5 w-2.5 rounded-[2px]" style={{ backgroundColor: cat.color ?? "var(--chart-5)" }} />
              <span className="text-text-muted text-[13px]">{cat.categoryName}</span>
            </div>
          ))}
        </div>
      </>
    )}
  </Card>
);

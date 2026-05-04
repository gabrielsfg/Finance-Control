"use client";

import {
  ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid, Legend,
} from "recharts";
import { SectionHeader } from "@/components/shared/SectionHeader";
import { formatCurrency, formatCurrencyCompact } from "@/lib/utils/formatCurrency";
import type { CategoryBreakdown, CategoryMonthlyData } from "@/lib/types/analytics.types";

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
  <div className="border-border bg-surface flex flex-col rounded-xl border p-5">
    <SectionHeader title="Evolução por Categoria" subtitle="Gastos mensais por categoria (últimos 7 meses)" />

    <div className="w-full" style={{ height: 260 }}>
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ top: 4, right: 4, left: 0, bottom: 0 }}>
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
            tickFormatter={(v) => formatCurrencyCompact(v / 100)}
            width={70}
          />
          <Tooltip content={<CustomTooltip />} cursor={{ stroke: "var(--border)", strokeWidth: 1, strokeDasharray: "4 4" }} />
          {categories.map((cat) => {
            const color = cat.color ?? "var(--text-muted)";
            return (
              <Line
                key={cat.categoryName}
                type="monotone"
                dataKey={cat.categoryName}
                stroke={color}
                strokeWidth={2}
                dot={{ r: 3, fill: color }}
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
          <div className="h-2.5 w-2.5 rounded-[2px]" style={{ backgroundColor: cat.color ?? "var(--text-muted)" }} />
          <span className="text-text-muted text-[13px]">{cat.categoryName}</span>
        </div>
      ))}
    </div>
  </div>
);

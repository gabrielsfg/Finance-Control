"use client";

import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  ReferenceLine,
} from "recharts";
import Link from "next/link";
import { formatCurrency, formatCurrencyCompact } from "@/lib/utils/formatCurrency";
import type { SpendingPredictionItem } from "@/lib/types/dashboard.types";

type Props = {
  data: SpendingPredictionItem[];
};

const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="border-border bg-surface rounded-lg border px-3 py-2 shadow-md">
      <p className="text-text-muted mb-1.5 text-[11px]">Dia {label}</p>
      {payload.map((entry: any) => (
        <p key={entry.name} className="font-money text-[12px]" style={{ color: entry.color }}>
          {entry.name}: {formatCurrency(entry.value / 100)}
        </p>
      ))}
    </div>
  );
};

export const SpendingPredictionChart = ({ data }: Props) => {
  const today = new Date().getDate();

  // Forecast: from today forward, grow by the same daily delta the historical
  // average grows each day (weekday-aware — computed by backend)
  const chartData = (() => {
    if (data.length === 0) return data;

    const currentBase = data.find((d) => d.day === today)?.currentExpense ?? 0;
    const historicalAtToday = data.find((d) => d.day === today)?.historicalAverage ?? 0;

    return data.map((item) => {
      if (item.day < today) return { ...item, forecastExpense: null };
      // Delta from historical-today to historical-day = how much the weekday pattern adds
      const forecastExpense = currentBase + (item.historicalAverage - historicalAtToday);
      return { ...item, forecastExpense };
    });
  })();

  return (
    <div className="border-[var(--border-color)] bg-[var(--surface)] flex flex-col rounded-[20px] border p-[22px]">
      <div className="mb-4 flex items-center gap-[10px]">
        <h2 className="font-display text-[17px] font-bold tracking-[-0.01em] text-[var(--text)]">
          Previsão de Gastos
        </h2>
        <span className="font-mono text-[11px] text-[var(--text-sub)]">acumulado vs. média 6 meses</span>
        <Link
          href="/analytics"
          className="ml-auto font-mono text-[11px] tracking-[0.1em] uppercase text-[var(--brand-accent)] hover:underline"
        >
          Ver analytics
        </Link>
      </div>

      <div className="w-full" style={{ height: 220 }}>
        <ResponsiveContainer width="100%" height={220} minWidth={0}>
          <LineChart data={chartData} margin={{ top: 4, right: 4, left: 0, bottom: 0 }}>
            <CartesianGrid stroke="var(--border-chart)" />
            <XAxis
              dataKey="day"
              tick={{ fill: "var(--text-muted)", fontSize: 12, fontFamily: "DM Sans" }}
              axisLine={false}
              tickLine={false}
              tickFormatter={(v) => (v % 5 === 0 || v === 1 ? String(v) : "")}
            />
            <YAxis
              tick={{ fill: "var(--text-muted)", fontSize: 12, fontFamily: "JetBrains Mono" }}
              axisLine={false}
              tickLine={false}
              tickFormatter={(v) => formatCurrencyCompact(v / 100)}
              width={70}
            />
            <Tooltip content={<CustomTooltip />} />
            <ReferenceLine
              x={today}
              stroke="var(--text-muted)"
              strokeDasharray="4 3"
              strokeWidth={1}
            />
            <Line
              type="monotone"
              dataKey="historicalAverage"
              name="Média histórica"
              stroke="var(--blue)"
              strokeWidth={2}
              dot={false}
              activeDot={{ r: 4 }}
            />
            <Line
              type="monotone"
              dataKey="currentExpense"
              name="Gasto atual"
              stroke="var(--red)"
              strokeWidth={2}
              dot={false}
              activeDot={{ r: 4 }}
              connectNulls={false}
            />
            <Line
              type="monotone"
              dataKey="forecastExpense"
              name="Previsão"
              stroke="var(--red)"
              strokeWidth={2}
              strokeDasharray="5 4"
              dot={false}
              activeDot={{ r: 4 }}
              connectNulls={false}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      <div className="mt-3 flex gap-4">
        <div className="flex items-center gap-1.5">
          <div className="bg-red h-2.5 w-2.5 rounded-[2px]" />
          <span className="text-text-muted text-[12px]">Gasto atual</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="bg-blue h-2.5 w-2.5 rounded-[2px]" />
          <span className="text-text-muted text-[12px]">Média 6 meses</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="border-red h-0 w-4 border-t-2 border-dashed" />
          <span className="text-text-muted text-[12px]">Previsão</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="border-text-muted h-2.5 w-2.5 rounded-[2px] border border-dashed" />
          <span className="text-text-muted text-[12px]">Hoje (dia {today})</span>
        </div>
      </div>
    </div>
  );
};

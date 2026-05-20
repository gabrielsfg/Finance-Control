"use client";

import { useState, useMemo } from "react";
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, ReferenceLine,
} from "recharts";
import { formatCurrency } from "@/lib/utils/formatCurrency";
import { cn } from "@/lib/utils";
import type { PricePoint } from "@/lib/types/market.types";

type Period = "1M" | "3M" | "6M" | "1A";

const PERIODS: { label: Period; days: number }[] = [
  { label: "1M", days: 22 },
  { label: "3M", days: 66 },
  { label: "6M", days: 132 },
  { label: "1A", days: 252 },
];

const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="border-border bg-surface rounded-lg border px-3 py-2 shadow-lg">
      <p className="text-text-muted mb-1 text-[11px]">{label}</p>
      <p className="font-money text-text text-[13px] font-medium">
        {formatCurrency(payload[0].value / 100)}
      </p>
    </div>
  );
};

type Props = { ticker: string; history: PricePoint[] };

export const MarketPriceChart = ({ ticker, history }: Props) => {
  const [period, setPeriod] = useState<Period>("1M");

  const data = useMemo(() => {
    const days = PERIODS.find((p) => p.label === period)?.days ?? 22;
    const slice = history.slice(-days);
    return slice.map((p) => {
      const [year, month, day] = p.date.split("-");
      const label = `${day}/${month}`;
      return { date: label, fullDate: p.date, price: p.price };
    });
  }, [history, period]);

  if (history.length === 0) {
    return (
      <div className="border-border bg-surface flex items-center justify-center rounded-xl border p-5 h-[300px]">
        <p className="text-text-muted text-[13px]">Histórico de preço não disponível ainda.</p>
      </div>
    );
  }

  const first = data[0]?.price ?? 0;
  const last  = data[data.length - 1]?.price ?? 0;
  const isUp  = last >= first;
  const color = isUp ? "var(--green)" : "var(--red)";

  const tickInterval = Math.max(1, Math.floor(data.length / 6));

  return (
    <div className="border-border bg-surface rounded-xl border p-5">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h3 className="font-display font-700 text-text text-[16px] tracking-tight">Histórico de Preço</h3>
          <p className="text-text-muted mt-0.5 text-[12px]">{ticker} — {period}</p>
        </div>
        <div className="flex items-center gap-1">
          {PERIODS.map(({ label }) => (
            <button
              key={label}
              onClick={() => setPeriod(label)}
              className={cn(
                "h-7 rounded-lg px-3 text-[12px] font-medium transition-colors",
                period === label
                  ? "bg-green/15 text-green"
                  : "text-text-sub hover:bg-surface2 hover:text-text",
              )}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      <div style={{ height: 220 }}>
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id={`priceGradient-${ticker}`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={color} stopOpacity={0.2} />
                <stop offset="100%" stopColor={color} stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid stroke="var(--border-chart)" vertical={false} />
            <XAxis
              dataKey="date"
              tick={{ fill: "var(--text-muted)", fontSize: 10, fontFamily: "DM Sans" }}
              axisLine={false}
              tickLine={false}
              interval={tickInterval - 1}
            />
            <YAxis
              domain={["auto", "auto"]}
              tick={{ fill: "var(--text-muted)", fontSize: 10, fontFamily: "JetBrains Mono" }}
              tickFormatter={(v) => `R$${(v / 100).toFixed(0)}`}
              axisLine={false}
              tickLine={false}
              width={60}
            />
            <Tooltip content={<CustomTooltip />} />
            <ReferenceLine y={first} stroke="var(--border)" strokeDasharray="4 3" />
            <Area
              type="monotone"
              dataKey="price"
              stroke={color}
              strokeWidth={2}
              fill={`url(#priceGradient-${ticker})`}
              dot={false}
              activeDot={{ r: 5, fill: color, stroke: "var(--surface)", strokeWidth: 2 }}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

"use client";

import { TrendingUp, ArrowUp } from "lucide-react";
import { ResponsiveContainer, AreaChart, Area } from "recharts";
import { chartAnim } from "@/lib/config/chartAnimation";

type Props = {
  savingsRate: number;
  savingsRateHistory?: number[];
  change?: number;
};

const DEFAULT_HISTORY = [41, 38, 21, 40, 45, 44, 51];

export const SavingsRateCard = ({
  savingsRate,
  savingsRateHistory = DEFAULT_HISTORY,
  change,
}: Props) => {
  const rawChange =
    change ??
    (savingsRateHistory.length >= 2
      ? savingsRateHistory[savingsRateHistory.length - 1] -
        savingsRateHistory[savingsRateHistory.length - 2]
      : 0);
  const isPositive = rawChange >= 0;

  const data = savingsRateHistory.map((v, i) => ({ i, v }));

  return (
    <div className="border-border bg-surface flex flex-col gap-2 rounded-xl border p-5">
      <div className="flex items-center justify-between">
        <span className="text-text-muted text-[12px] uppercase tracking-[0.04em]">
          Taxa de Poupança
        </span>
        <div className="bg-green/15 flex h-8 w-8 items-center justify-center rounded-[8px]">
          <TrendingUp size={15} strokeWidth={1.75} className="text-green" />
        </div>
      </div>

      <p className="font-money font-600 text-green text-[24px] tracking-tight leading-none">
        {savingsRate.toFixed(1)}%
      </p>

      <div className="h-9">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ top: 0, right: 0, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id="sgFill" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#00c98d" stopOpacity={0.18} />
                <stop offset="95%" stopColor="#00c98d" stopOpacity={0} />
              </linearGradient>
            </defs>
            <Area
              {...chartAnim(0)}
              type="monotone"
              dataKey="v"
              stroke="#00c98d"
              strokeWidth={2}
              fill="url(#sgFill)"
              dot={false}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      <div className="flex items-center gap-1">
        <ArrowUp
          size={12}
          className={isPositive ? "text-green" : "text-red rotate-180"}
        />
        <span className={`font-mono text-[11px] ${isPositive ? "text-green" : "text-red"}`}>
          {isPositive ? "+" : ""}
          {rawChange.toFixed(1)}pp
        </span>
        <span className="text-text-muted text-[11px]">vs. mês anterior</span>
      </div>
    </div>
  );
};

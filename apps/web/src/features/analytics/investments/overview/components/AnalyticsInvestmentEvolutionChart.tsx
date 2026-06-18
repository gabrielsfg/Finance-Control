"use client";

import {
  ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid,
} from "recharts";
import { Card, CardHead } from "@/components/shared/Card";
import { ChartEmptyState } from "@/components/shared/ChartEmptyState";
import { formatCurrency, formatCurrencyCompact } from "@/lib/utils/formatCurrency";
import type { InvestmentEvolutionResponse } from "@/lib/types/analytics.types";

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

const SERIES = [
  { key: "totalValue",    name: "Valor atual",       color: "var(--green)" },
  { key: "totalInvested", name: "Capital investido",  color: "var(--blue)" },
  { key: "returns",       name: "Lucro/Prejuízo",     color: "var(--cyan)" },
  { key: "dividends",     name: "Dividendos",         color: "var(--purple)" },
] as const;

type Props = { data: InvestmentEvolutionResponse };

export const AnalyticsInvestmentEvolutionChart = ({ data: response }: Props) => {
  const { data, returnPct, cumulativeDividends } = response;
  const latest = data[data.length - 1];
  const totalDividends = cumulativeDividends > 0 ? cumulativeDividends : null;

  if (data.length === 0) {
    return (
      <Card>
        <CardHead title="Evolução dos Investimentos" subtitle="Capital investido, valor atual, rendimento e dividendos (últimos 7 meses)" />
        <ChartEmptyState message="Sem movimentações de investimento no período" />
      </Card>
    );
  }

  return (
    <Card>
      <CardHead title="Evolução dos Investimentos" subtitle="Capital investido, valor atual, rendimento e dividendos (últimos 7 meses)" />

      {latest && (
        <div className="bg-surface2 mb-5 grid grid-cols-4 gap-3 rounded-xl p-4">
          <div>
            <p className="text-text-muted text-[12px]">Valor atual</p>
            <p className="font-money font-600 text-text text-[18px]">{formatCurrency(latest.totalValue / 100)}</p>
          </div>
          <div>
            <p className="text-text-muted text-[12px]">Capital investido</p>
            <p className="font-money font-600 text-text text-[18px]">{formatCurrency(latest.totalInvested / 100)}</p>
          </div>
          <div>
            <p className="text-text-muted text-[12px]">Lucro / Prejuízo</p>
            <p className={`font-money font-600 text-[18px] ${latest.returns >= 0 ? "text-cyan" : "text-red"}`}>
              {latest.returns >= 0 ? "+" : ""}{formatCurrency(latest.returns / 100)}
              {returnPct !== null && (
                <span className="ml-1 text-[13px] font-normal text-text-muted">({returnPct.toFixed(1)}%)</span>
              )}
            </p>
          </div>
          <div>
            <p className="text-text-muted text-[12px]">Dividendos acum.</p>
            <p className="font-money font-600 text-purple text-[18px]">
              {totalDividends !== null ? `+${formatCurrency(totalDividends / 100)}` : "—"}
            </p>
          </div>
        </div>
      )}

      <div className="w-full" style={{ height: 280 }}>
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
            {SERIES.map(({ key, name, color }) => (
              <Line
                key={key}
                type="monotone"
                dataKey={key}
                name={name}
                stroke={color}
                strokeWidth={2}
                dot={{ r: 3, fill: color }}
                activeDot={{ r: 5 }}
              />
            ))}
          </LineChart>
        </ResponsiveContainer>
      </div>

      <div className="mt-3 flex flex-wrap gap-x-4 gap-y-2">
        {SERIES.map(({ name, color }) => (
          <div key={name} className="flex items-center gap-1.5">
            <div className="h-2.5 w-2.5 rounded-[2px]" style={{ backgroundColor: color }} />
            <span className="text-text-muted text-[13px]">{name}</span>
          </div>
        ))}
      </div>
    </Card>
  );
};

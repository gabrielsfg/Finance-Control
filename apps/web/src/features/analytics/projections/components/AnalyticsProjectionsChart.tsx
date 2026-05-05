"use client";

import {
  ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid,
} from "recharts";
import { SectionHeader } from "@/components/shared/SectionHeader";
import { ChartEmptyState } from "@/components/shared/ChartEmptyState";
import { formatCurrency, formatCurrencyCompact } from "@/lib/utils/formatCurrency";
import type { ProjectionPoint } from "@/lib/types/analytics.types";

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

const SCENARIOS = [
  { key: "optimistic", label: "Otimista", color: "var(--green)" },
  { key: "moderate", label: "Moderado", color: "var(--blue)" },
  { key: "conservative", label: "Conservador", color: "var(--orange)" },
] as const;

type Props = { data: ProjectionPoint[] };

export const AnalyticsProjectionsChart = ({ data }: Props) => {
  const last = data[data.length - 1];

  if (data.length === 0) {
    return (
      <div className="border-border bg-surface flex flex-col rounded-xl border p-5">
        <SectionHeader title="Projeções Patrimoniais" subtitle="Cenários para os próximos 3 anos (baseado na poupança mensal média)" />
        <ChartEmptyState message="Sem dados suficientes para calcular projeções" />
      </div>
    );
  }

  return (
    <div className="border-border bg-surface flex flex-col rounded-xl border p-5">
      <SectionHeader title="Projeções Patrimoniais" subtitle="Cenários para os próximos 3 anos (baseado na poupança mensal média)" />

      {last && (
        <div className="bg-surface2 mb-5 grid grid-cols-3 gap-3 rounded-xl p-4">
          {SCENARIOS.map(({ key, label, color }) => (
            <div key={key}>
              <p className="text-text-muted text-[12px]">{label}</p>
              <p className="font-money font-600 text-[18px]" style={{ color }}>
                {formatCurrency(last[key] / 100)}
              </p>
              <p className="text-text-muted text-[11px]">em {last.label}</p>
            </div>
          ))}
        </div>
      )}

      <div className="w-full" style={{ height: 280 }}>
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
            {SCENARIOS.map(({ key, label, color }) => (
              <Line
                key={key}
                type="monotone"
                dataKey={key}
                name={label}
                stroke={color}
                strokeWidth={2}
                dot={{ r: 3, fill: color }}
                activeDot={{ r: 5 }}
                strokeDasharray={key === "conservative" ? "4 3" : undefined}
              />
            ))}
          </LineChart>
        </ResponsiveContainer>
      </div>

      <div className="mt-3 flex gap-4">
        {SCENARIOS.map(({ label, color }) => (
          <div key={label} className="flex items-center gap-1.5">
            <div className="h-2.5 w-2.5 rounded-[2px]" style={{ backgroundColor: color }} />
            <span className="text-text-muted text-[13px]">{label}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

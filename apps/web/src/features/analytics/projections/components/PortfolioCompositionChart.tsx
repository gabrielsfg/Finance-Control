"use client";

import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  ReferenceLine,
} from "recharts";
import { Card, CardHead } from "@/components/shared/Card";
import { ChartEmptyState } from "@/components/shared/ChartEmptyState";
import { formatCurrencyCompact } from "@/lib/utils/formatCurrency";
import type { PortfolioCompositionProjectionResponse } from "@/lib/types/analytics.types";

const MONTH_LABELS = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"];

function toLabel(year: number, month: number) {
  return `${MONTH_LABELS[month - 1]}/${String(year).slice(2)}`;
}

const CLASS_COLORS: Record<string, string> = {
  "Renda Fixa":     "var(--blue)",
  "Renda Variável": "var(--green)",
  "FII":            "var(--purple)",
  "Internacional":  "var(--orange)",
  "Cripto":         "var(--yellow)",
};

function classColor(cls: string) {
  return CLASS_COLORS[cls] ?? "var(--text-muted)";
}

const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  const total = payload.reduce((s: number, e: any) => s + (e.value ?? 0), 0);
  return (
    <div className="border-border bg-surface rounded-lg border px-3 py-2 shadow-md">
      <p className="text-text-muted mb-1.5 text-[11px]">{label}</p>
      {[...payload].reverse().map((e: any) => (
        <div key={e.dataKey} className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-1.5">
            <span className="inline-block h-2 w-2 rounded-full" style={{ background: e.fill }} />
            <span className="text-text-sub text-[12px]">{e.dataKey}</span>
          </div>
          <span className="font-money text-text text-[12px]">{formatCurrencyCompact(e.value / 100)}</span>
        </div>
      ))}
      <div className="border-border mt-1.5 border-t pt-1.5">
        <div className="flex items-center justify-between gap-4">
          <span className="text-text-muted text-[11px]">Total</span>
          <span className="font-money text-text text-[12px] font-semibold">{formatCurrencyCompact(total / 100)}</span>
        </div>
      </div>
    </div>
  );
};

type Props = { data: PortfolioCompositionProjectionResponse };

export function PortfolioCompositionChart({ data }: Props) {
  const { assetClasses } = data;

  // Flatten each month into a flat object keyed by class name
  const chartData = data.data.map((m) => {
    const row: Record<string, number | string | boolean> = {
      label:       toLabel(m.year, m.month),
      isProjected: m.isProjected,
    };
    for (const b of m.breakdown) {
      row[b.assetClass] = b.value;
    }
    // Fill missing classes with 0
    for (const cls of assetClasses) {
      if (!(cls in row)) row[cls] = 0;
    }
    return row;
  });

  // Find the label of the first projected month for the reference line
  const firstProjected = data.data.find((m) => m.isProjected);
  const projectionLabel = firstProjected ? toLabel(firstProjected.year, firstProjected.month) : null;

  // Summary cards: last historical month breakdown
  const lastHistorical = data.data.filter((m) => !m.isProjected).at(-1);
  const totalCurrentValue = lastHistorical
    ? lastHistorical.breakdown.reduce((s, b) => s + b.value, 0)
    : 0;

  if (data.data.length === 0) {
    return (
      <Card className="flex flex-col">
        <CardHead
          title="Composição Futura da Carteira"
          subtitle="Distribuição histórica por classe de ativo e projeção para os próximos meses"
        />
        <ChartEmptyState message="Sem dados de carteira para o período" />
      </Card>
    );
  }

  return (
    <Card className="flex flex-col">
      <CardHead
        title="Composição Futura da Carteira"
        subtitle="Distribuição histórica por classe de ativo e projeção para os próximos meses"
      />

      {/* Summary cards */}
      {lastHistorical && (
        <div className="bg-surface2 mb-5 grid grid-cols-2 gap-3 rounded-xl p-4 sm:grid-cols-3 lg:grid-cols-5">
          {assetClasses.map((cls) => {
            const val = lastHistorical.breakdown.find((b) => b.assetClass === cls)?.value ?? 0;
            const pct = totalCurrentValue > 0 ? Math.round((val / totalCurrentValue) * 100) : 0;
            return (
              <div key={cls}>
                <div className="mb-0.5 flex items-center gap-1.5">
                  <span className="inline-block h-2 w-2 shrink-0 rounded-full" style={{ background: classColor(cls) }} />
                  <p className="text-text-muted truncate text-[11px]">{cls}</p>
                </div>
                <p className="font-money text-text text-[15px] font-semibold">{formatCurrencyCompact(val / 100)}</p>
                <p className="text-text-muted text-[11px]">{pct}%</p>
              </div>
            );
          })}
        </div>
      )}

      <div className="w-full" style={{ height: 300 }}>
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={chartData} margin={{ top: 4, right: 4, left: 0, bottom: 0 }}>
            <CartesianGrid stroke="var(--border-color)" strokeDasharray="3 5" vertical={false} />
            <XAxis
              dataKey="label"
              tick={{ fill: "var(--text-sub)", fontSize: 10, fontFamily: "IBM Plex Mono" }}
              axisLine={false}
              tickLine={false}
              interval="preserveStartEnd"
            />
            <YAxis
              tick={{ fill: "var(--text-sub)", fontSize: 10, fontFamily: "IBM Plex Mono" }}
              axisLine={false}
              tickLine={false}
              tickFormatter={(v) => formatCurrencyCompact(v / 100)}
              width={72}
            />
            <Tooltip content={<CustomTooltip />} cursor={{ stroke: "var(--border-color)", strokeWidth: 1, strokeDasharray: "4 4" }} />
            {projectionLabel && (
              <ReferenceLine
                x={projectionLabel}
                stroke="var(--text-muted)"
                strokeDasharray="4 3"
                strokeWidth={1}
                label={{ value: "Projeção →", position: "insideTopRight", fontSize: 11, fill: "var(--text-muted)" }}
              />
            )}
            {assetClasses.map((cls) => (
              <Area
                key={cls}
                type="monotone"
                dataKey={cls}
                stackId="a"
                stroke={classColor(cls)}
                fill={classColor(cls)}
                fillOpacity={0.75}
                strokeWidth={1.5}
              />
            ))}
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* Legend */}
      <div className="mt-3 flex flex-wrap gap-x-5 gap-y-2">
        {assetClasses.map((cls) => (
          <div key={cls} className="flex items-center gap-1.5">
            <span className="inline-block h-2.5 w-2.5 rounded-full" style={{ background: classColor(cls) }} />
            <span className="text-text-muted text-[13px]">{cls}</span>
          </div>
        ))}
        <div className="flex items-center gap-1.5">
          <svg width="20" height="12">
            <line x1="0" y1="6" x2="20" y2="6" stroke="var(--text-muted)" strokeWidth="1.5" strokeDasharray="4 3" />
          </svg>
          <span className="text-text-muted text-[13px]">Projeção</span>
        </div>
      </div>
    </Card>
  );
}

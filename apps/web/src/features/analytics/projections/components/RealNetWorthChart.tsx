"use client";

import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from "recharts";
import { Card, CardHead } from "@/components/shared/Card";
import { ChartEmptyState } from "@/components/shared/ChartEmptyState";
import { formatCurrency, formatCurrencyCompact } from "@/lib/utils/formatCurrency";
import type { RealNetWorthResponse } from "@/lib/types/analytics.types";

const MONTH_LABELS = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"];

function toLabel(year: number, month: number) {
  return `${MONTH_LABELS[month - 1]}/${String(year).slice(2)}`;
}

const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;

  const nominal  = payload.find((e: any) => e.dataKey === "nominalNetWorth");
  const real     = payload.find((e: any) => e.dataKey === "realNetWorth");
  const inflation = payload[0]?.payload?.accumulatedInflationPct;

  return (
    <div className="border-border bg-surface rounded-lg border px-3 py-2 shadow-md">
      <p className="text-text-muted mb-1.5 text-[11px]">{label}</p>
      {nominal && (
        <p className="font-money text-[12px]" style={{ color: "var(--blue)" }}>
          Nominal: {formatCurrency(nominal.value / 100)}
        </p>
      )}
      {real && (
        <p className="font-money text-[12px]" style={{ color: "var(--orange)" }}>
          Real: {formatCurrency(real.value / 100)}
        </p>
      )}
      {inflation != null && (
        <p className="text-text-muted mt-1 text-[11px]">
          IPCA acumulado: {inflation.toFixed(2)}%
        </p>
      )}
    </div>
  );
};

function SummaryCard({ label, value, color, isPercent = false }: {
  label: string;
  value: number;
  color: string;
  isPercent?: boolean;
}) {
  const formatted = isPercent
    ? `${value >= 0 ? "+" : ""}${value.toFixed(2)}%`
    : formatCurrency(value / 100);
  return (
    <div>
      <p className="text-text-muted text-[12px]">{label}</p>
      <p className="font-money font-600 text-[18px]" style={{ color }}>
        {formatted}
      </p>
    </div>
  );
}

type Props = { data: RealNetWorthResponse };

export function RealNetWorthChart({ data }: Props) {
  const { points, totalNominalGrowthPct, totalRealGrowthPct, totalInflationPct } = data;

  const chartData = points.map((p) => ({
    label:                  toLabel(p.year, p.month),
    nominalNetWorth:        p.nominalNetWorth,
    realNetWorth:           p.realNetWorth,
    accumulatedInflationPct: p.accumulatedInflationPct,
  }));

  const realIsNegative = totalRealGrowthPct < 0;

  if (chartData.length === 0) {
    return (
      <Card className="flex flex-col">
        <CardHead
          title="Patrimônio Real vs Inflação"
          subtitle="Evolução do patrimônio nominal e deflacionado pelo IPCA"
        />
        <ChartEmptyState message="Sem dados patrimoniais para o período" />
      </Card>
    );
  }

  return (
    <Card className="flex flex-col">
      <CardHead
        title="Patrimônio Real vs Inflação"
        subtitle="Evolução do patrimônio nominal e deflacionado pelo IPCA"
      />

      {/* Summary cards */}
      <div className="bg-surface2 mb-5 grid grid-cols-2 gap-3 rounded-xl p-4 lg:grid-cols-3">
        <SummaryCard
          label="Crescimento nominal"
          value={totalNominalGrowthPct}
          color={totalNominalGrowthPct >= 0 ? "var(--blue)" : "var(--red)"}
          isPercent
        />
        <SummaryCard
          label="Crescimento real"
          value={totalRealGrowthPct}
          color={realIsNegative ? "var(--red)" : "var(--green)"}
          isPercent
        />
        <SummaryCard
          label="IPCA acumulado no período"
          value={totalInflationPct}
          color="var(--orange)"
          isPercent
        />
      </div>

      {realIsNegative && (
        <div className="border-orange/30 bg-orange/10 mb-4 rounded-lg border px-3 py-2">
          <p className="text-orange text-[13px]">
            Seu patrimônio cresceu abaixo da inflação no período — o poder de compra real está caindo.
          </p>
        </div>
      )}

      <div className="w-full" style={{ height: 300 }}>
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={chartData} margin={{ top: 4, right: 4, left: 0, bottom: 0 }}>
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
            <Tooltip
              content={<CustomTooltip />}
              cursor={{ stroke: "var(--border-color)", strokeWidth: 1, strokeDasharray: "4 4" }}
            />
            <Line
              type="monotone"
              dataKey="nominalNetWorth"
              name="Nominal"
              stroke="var(--blue)"
              strokeWidth={2}
              dot={false}
              activeDot={{ r: 4 }}
            />
            <Line
              type="monotone"
              dataKey="realNetWorth"
              name="Real (deflacionado pelo IPCA)"
              stroke="var(--orange)"
              strokeWidth={2}
              dot={false}
              activeDot={{ r: 4 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Legend */}
      <div className="mt-3 flex flex-wrap gap-5">
        <div className="flex items-center gap-1.5">
          <svg width="20" height="12">
            <line x1="0" y1="6" x2="20" y2="6" stroke="var(--blue)" strokeWidth="2" />
          </svg>
          <span className="text-text-muted text-[13px]">Nominal</span>
        </div>
        <div className="flex items-center gap-1.5">
          <svg width="20" height="12">
            <line x1="0" y1="6" x2="20" y2="6" stroke="var(--orange)" strokeWidth="2" />
          </svg>
          <span className="text-text-muted text-[13px]">Real (deflacionado pelo IPCA)</span>
        </div>
      </div>

      <p className="text-text-muted mt-3 text-[11px]">
        Fonte: BACEN SGS — série 433 (IPCA)
      </p>
    </Card>
  );
}

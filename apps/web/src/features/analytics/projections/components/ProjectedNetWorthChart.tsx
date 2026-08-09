"use client";

import { AlertTriangle } from "lucide-react";
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
import { Card, CardHead } from "@/components/shared/Card";
import { ChartEmptyState } from "@/components/shared/ChartEmptyState";
import { formatCurrency, formatCurrencyCompact } from "@/lib/utils/formatCurrency";
import type { NetWorthProjectionResponse } from "@/lib/types/analytics.types";
import { chartAnim } from "@/lib/config/chartAnimation";

const MONTH_LABELS = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"];

function toLabel(year: number, month: number) {
  return `${MONTH_LABELS[month - 1]}/${String(year).slice(2)}`;
}

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

function LegendItem({ color, label, dashed }: { color: string; label: string; dashed: boolean }) {
  return (
    <div className="flex items-center gap-1.5">
      <svg width="20" height="12">
        {dashed
          ? <line x1="0" y1="6" x2="20" y2="6" stroke={color} strokeWidth="2" strokeDasharray="4 3" />
          : <line x1="0" y1="6" x2="20" y2="6" stroke={color} strokeWidth="2" />}
      </svg>
      <span className="text-text-muted text-[13px]">{label}</span>
    </div>
  );
}

type Props = { data: NetWorthProjectionResponse };

export function ProjectedNetWorthChart({ data }: Props) {
  const { currentNetWorth, monthlyAvgGrowth, monthsUntilTarget, targetAmount } = data;

  const historicalPoints = data.historical.map((p) => ({
    label:      toLabel(p.year, p.month),
    historical: p.netWorth,
    projected:  null as number | null,
  }));

  // Overlap: last historical point is the join point for the projected line
  const joinPoint = data.historical[data.historical.length - 1];
  const projectedPoints = data.projected.map((p) => ({
    label:      toLabel(p.year, p.month),
    historical: null as number | null,
    projected:  p.netWorth,
  }));

  const chartData = [
    ...historicalPoints,
    ...(joinPoint ? [{
      label:      toLabel(joinPoint.year, joinPoint.month),
      historical: joinPoint.netWorth,
      projected:  joinPoint.netWorth,
    }] : []),
    ...projectedPoints,
  ];

  const projected24 = data.projected[data.projected.length - 1]?.netWorth ?? currentNetWorth;
  const isNegative = monthlyAvgGrowth < 0;

  if (chartData.length === 0) {
    return (
      <Card className="flex flex-col">
        <CardHead
          title="Projeção de Patrimônio"
          subtitle="Histórico real e projeção baseada no crescimento médio mensal"
        />
        <ChartEmptyState message="Sem histórico para calcular projeção" />
      </Card>
    );
  }

  return (
    <Card className="flex flex-col">
      <CardHead
        title="Projeção de Patrimônio"
        subtitle="Histórico real e projeção baseada no crescimento médio mensal"
      />

      {isNegative && (
        <div className="border-red/30 bg-red/10 mb-4 flex items-center gap-2 rounded-lg border px-3 py-2">
          <AlertTriangle size={15} className="text-red shrink-0" />
          <p className="text-red text-[13px]">
            Crescimento médio mensal negativo — seu patrimônio está encolhendo. Revise suas despesas.
          </p>
        </div>
      )}

      {/* Summary cards */}
      <div className="bg-surface2 mb-5 grid grid-cols-2 gap-3 rounded-xl p-4 lg:grid-cols-3">
        <div>
          <p className="text-text-muted text-[12px]">Patrimônio atual</p>
          <p className="font-money font-600 text-text text-[18px]">
            {formatCurrency(currentNetWorth / 100)}
          </p>
        </div>
        <div>
          <p className="text-text-muted text-[12px]">Crescimento médio/mês</p>
          <p
            className="font-money font-600 text-[18px]"
            style={{ color: isNegative ? "var(--red)" : "var(--green)" }}
          >
            {monthlyAvgGrowth >= 0 ? "+" : ""}
            {formatCurrency(monthlyAvgGrowth / 100)}
          </p>
        </div>
        <div>
          <p className="text-text-muted text-[12px]">Projetado em {data.projected.length} meses</p>
          <p className="font-money font-600 text-text text-[18px]">
            {formatCurrency(projected24 / 100)}
          </p>
          {monthsUntilTarget !== null && targetAmount !== null && (
            <p className="text-text-muted mt-0.5 text-[11px]">
              Meta R$ {formatCurrencyCompact(targetAmount / 100)} em {monthsUntilTarget}m
            </p>
          )}
        </div>
      </div>

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
            {targetAmount !== null && (
              <ReferenceLine
                y={targetAmount}
                stroke="var(--orange)"
                strokeDasharray="4 3"
                strokeWidth={1}
                label={{ value: "Meta", fill: "var(--orange)", fontSize: 11, position: "right" }}
              />
            )}
            <Line
              {...chartAnim(0)}
              type="monotone"
              dataKey="historical"
              name="Histórico"
              stroke="var(--text-muted)"
              strokeWidth={2}
              dot={false}
              activeDot={{ r: 4 }}
              connectNulls={false}
            />
            <Line
              {...chartAnim(1)}
              type="monotone"
              dataKey="projected"
              name="Projeção"
              stroke="var(--green)"
              strokeWidth={2}
              strokeDasharray="5 4"
              dot={false}
              activeDot={{ r: 4 }}
              connectNulls={false}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      <div className="mt-3 flex flex-wrap gap-5">
        <LegendItem color="var(--text-muted)" label="Histórico real" dashed={false} />
        <LegendItem color="var(--green)"      label="Projeção"       dashed />
        {targetAmount !== null && (
          <LegendItem color="var(--orange)" label="Meta" dashed />
        )}
      </div>
    </Card>
  );
}

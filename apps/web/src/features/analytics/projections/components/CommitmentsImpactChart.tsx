"use client";

import {
  ResponsiveContainer, ComposedChart, Bar, Line, XAxis, YAxis, Tooltip, CartesianGrid,
} from "recharts";
import { Card, CardHead } from "@/components/shared/Card";
import { ChartEmptyState } from "@/components/shared/ChartEmptyState";
import { formatCurrency, formatCurrencyCompact } from "@/lib/utils/formatCurrency";
import type { CommitmentsImpactResponse } from "@/lib/types/analytics.types";
import { chartAnim } from "@/lib/config/chartAnimation";

const MONTH_LABELS = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"];

const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="border-border bg-surface rounded-lg border px-3 py-2 shadow-md">
      <p className="text-text-muted mb-1.5 text-[11px]">{label}</p>
      {payload.map((e: any) => (
        <p key={e.name} className="font-money text-[12px]" style={{ color: e.color ?? e.stroke }}>
          {e.name}: {formatCurrency(e.value / 100)}
        </p>
      ))}
    </div>
  );
};

type Props = { data: CommitmentsImpactResponse };

export function CommitmentsImpactChart({ data }: Props) {
  if (data.months.length === 0) {
    return (
      <Card className="flex flex-col">
        <CardHead
          title="Impacto dos Compromissos"
          subtitle="Receita projetada vs. comprometimentos nos próximos meses"
        />
        <ChartEmptyState message="Sem transações recorrentes cadastradas" />
      </Card>
    );
  }

  const chartData = data.months.map((m) => ({
    label: `${MONTH_LABELS[m.month - 1]}/${String(m.year).slice(2)}`,
    income: m.projectedIncome,
    commitments: m.totalCommitments,
    balance: m.projectedBalance,
    isNegative: m.isNegative,
  }));

  const negativeMonths = data.months.filter((m) => m.isNegative).length;

  return (
    <Card className="flex flex-col">
      <CardHead
        title="Impacto dos Compromissos"
        subtitle="Receita projetada vs. comprometimentos nos próximos meses"
        right={
          negativeMonths > 0 ? (
            <div
              className="rounded-full px-3 py-1.5"
              style={{ backgroundColor: "color-mix(in srgb, var(--clay) 14%, transparent)" }}
            >
              <span className="font-mono text-[12px] text-[var(--clay)]">
                {negativeMonths} {negativeMonths === 1 ? "mês negativo" : "meses negativos"}
              </span>
            </div>
          ) : undefined
        }
      />

      <div className="w-full" style={{ height: 220 }}>
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={chartData} margin={{ top: 4, right: 4, left: 0, bottom: 0 }}>
            <CartesianGrid stroke="var(--border-color)" strokeDasharray="3 5" vertical={false} />
            <XAxis
              dataKey="label"
              tick={{ fill: "var(--text-sub)", fontSize: 10, fontFamily: "IBM Plex Mono" }}
              axisLine={false} tickLine={false}
            />
            <YAxis
              tickFormatter={(v) => formatCurrencyCompact(v / 100)}
              tick={{ fill: "var(--text-sub)", fontSize: 10, fontFamily: "IBM Plex Mono" }}
              axisLine={false} tickLine={false} width={56}
            />
            <Tooltip content={<CustomTooltip />} />
            <Bar {...chartAnim(0)} dataKey="income" name="Receita" fill="var(--moss)" opacity={0.7} radius={[3, 3, 0, 0]} />
            <Bar {...chartAnim(1)} dataKey="commitments" name="Comprometido" fill="var(--clay)" opacity={0.7} radius={[3, 3, 0, 0]} />
            <Line
              {...chartAnim(2)}
              type="monotone"
              dataKey="balance"
              name="Saldo projetado"
              stroke="var(--brand-cobalt)"
              strokeWidth={2}
              dot={false}
            />
          </ComposedChart>
        </ResponsiveContainer>
      </div>

      <div className="mt-3 flex gap-4">
        <div className="flex items-center gap-1.5">
          <span className="h-2.5 w-2.5 rounded-sm bg-[var(--moss)]" />
          <span className="text-text-muted text-[11px]">Receita</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="h-2.5 w-2.5 rounded-sm bg-[var(--clay)]" />
          <span className="text-text-muted text-[11px]">Comprometido</span>
        </div>
        <div className="flex items-center gap-1.5">
          <svg width="16" height="10"><line x1="0" y1="5" x2="16" y2="5" stroke="var(--brand-cobalt)" strokeWidth="2" /></svg>
          <span className="text-text-muted text-[11px]">Saldo projetado</span>
        </div>
      </div>
    </Card>
  );
}

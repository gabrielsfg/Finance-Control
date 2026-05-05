"use client";

import {
  ResponsiveContainer, ComposedChart, Bar, Line, XAxis, YAxis, Tooltip, CartesianGrid,
} from "recharts";
import { SectionHeader } from "@/components/shared/SectionHeader";
import { ChartEmptyState } from "@/components/shared/ChartEmptyState";
import { formatCurrency, formatCurrencyCompact } from "@/lib/utils/formatCurrency";
import type { CommitmentsImpactResponse } from "@/lib/types/analytics.types";

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
      <div className="border-border bg-surface flex flex-col rounded-xl border p-5">
        <SectionHeader
          title="Impacto dos Compromissos"
          subtitle="Receita projetada vs. comprometimentos nos próximos meses"
        />
        <ChartEmptyState message="Sem transações recorrentes cadastradas" />
      </div>
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
    <div className="border-border bg-surface flex flex-col rounded-xl border p-5">
      <div className="mb-4 flex items-start justify-between gap-4">
        <SectionHeader
          title="Impacto dos Compromissos"
          subtitle="Receita projetada vs. comprometimentos nos próximos meses"
        />
        {negativeMonths > 0 && (
          <div className="rounded-lg bg-red/10 px-3 py-1.5">
            <span className="text-red text-[12px] font-medium">
              {negativeMonths} {negativeMonths === 1 ? "mês negativo" : "meses negativos"}
            </span>
          </div>
        )}
      </div>

      <div className="w-full" style={{ height: 220 }}>
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={chartData} margin={{ top: 4, right: 4, left: 0, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
            <XAxis
              dataKey="label"
              tick={{ fill: "var(--text-muted)", fontSize: 11, fontFamily: "DM Sans" }}
              axisLine={false} tickLine={false}
            />
            <YAxis
              tickFormatter={(v) => formatCurrencyCompact(v / 100)}
              tick={{ fill: "var(--text-muted)", fontSize: 11, fontFamily: "DM Sans" }}
              axisLine={false} tickLine={false} width={56}
            />
            <Tooltip content={<CustomTooltip />} />
            <Bar dataKey="income" name="Receita" fill="var(--green)" opacity={0.7} radius={[3, 3, 0, 0]} />
            <Bar dataKey="commitments" name="Comprometido" fill="var(--red)" opacity={0.7} radius={[3, 3, 0, 0]} />
            <Line
              type="monotone"
              dataKey="balance"
              name="Saldo projetado"
              stroke="var(--blue)"
              strokeWidth={2}
              dot={false}
            />
          </ComposedChart>
        </ResponsiveContainer>
      </div>

      <div className="mt-3 flex gap-4">
        <div className="flex items-center gap-1.5">
          <span className="h-2.5 w-2.5 rounded-sm bg-[var(--green)]" />
          <span className="text-text-muted text-[11px]">Receita</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="h-2.5 w-2.5 rounded-sm bg-[var(--red)]" />
          <span className="text-text-muted text-[11px]">Comprometido</span>
        </div>
        <div className="flex items-center gap-1.5">
          <svg width="16" height="10"><line x1="0" y1="5" x2="16" y2="5" stroke="var(--blue)" strokeWidth="2" /></svg>
          <span className="text-text-muted text-[11px]">Saldo projetado</span>
        </div>
      </div>
    </div>
  );
}

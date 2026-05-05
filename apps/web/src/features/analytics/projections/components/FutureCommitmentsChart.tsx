"use client";

import {
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid,
} from "recharts";
import { SectionHeader } from "@/components/shared/SectionHeader";
import { ChartEmptyState } from "@/components/shared/ChartEmptyState";
import { formatCurrency, formatCurrencyCompact } from "@/lib/utils/formatCurrency";
import type { FutureCommitmentsItem } from "@/lib/types/analytics.types";

const MONTH_LABELS = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"];

const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  const entry = payload[0];
  return (
    <div className="border-border bg-surface rounded-lg border px-3 py-2 shadow-md">
      <p className="text-text-muted mb-1.5 text-[11px]">{label}</p>
      <p className="font-money text-[12px] text-orange">{formatCurrency(entry.value / 100)}</p>
    </div>
  );
};

type Props = { data: FutureCommitmentsItem[] };

export function FutureCommitmentsChart({ data }: Props) {
  if (data.length === 0) {
    return (
      <div className="border-border bg-surface flex flex-col rounded-xl border p-5">
        <SectionHeader
          title="Compromissos Futuros"
          subtitle="Parcelas e compromissos agendados nos próximos meses"
        />
        <ChartEmptyState message="Sem compromissos futuros agendados" />
      </div>
    );
  }

  const chartData = data.map((item) => ({
    label: `${MONTH_LABELS[item.month - 1]}/${String(item.year).slice(2)}`,
    total: item.totalCommitted,
    installments: item.installments,
  }));

  const total = data.reduce((s, m) => s + m.totalCommitted, 0);

  return (
    <div className="border-border bg-surface flex flex-col rounded-xl border p-5">
      <div className="mb-4 flex items-start justify-between gap-4">
        <SectionHeader
          title="Compromissos Futuros"
          subtitle="Parcelas e compromissos agendados nos próximos meses"
        />
        <div className="flex flex-col items-end gap-1">
          <span className="text-text-muted text-[11px]">Total comprometido</span>
          <span className="font-money text-[16px] font-600 text-orange">
            {formatCurrency(total / 100)}
          </span>
        </div>
      </div>

      <div className="w-full" style={{ height: 200 }}>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={chartData} margin={{ top: 4, right: 4, left: 0, bottom: 0 }}>
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
            <Bar dataKey="total" name="Comprometido" fill="var(--orange)" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Breakdown table for the first month with installments */}
      {data[0]?.installments.length > 0 && (
        <div className="mt-4 flex flex-col gap-1">
          <p className="text-text-muted text-[11px] uppercase tracking-wide">Detalhes — {chartData[0]?.label}</p>
          {data[0].installments.slice(0, 5).map((inst, i) => (
            <div key={i} className="flex items-center justify-between py-1">
              <span className="text-text-sub text-[12px]">{inst.description}</span>
              <span className="font-money text-[12px] text-orange">{formatCurrency(inst.value / 100)}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

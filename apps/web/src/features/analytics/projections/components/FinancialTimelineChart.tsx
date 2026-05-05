"use client";

import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  ReferenceDot,
} from "recharts";
import { Flag, TrendingUp, Coins, Star, Flame, Trophy } from "lucide-react";
import { SectionHeader } from "@/components/shared/SectionHeader";
import { ChartEmptyState } from "@/components/shared/ChartEmptyState";
import { formatCurrency, formatCurrencyCompact } from "@/lib/utils/formatCurrency";
import type { FinancialMilestonesResponse, FinancialMilestone } from "@/lib/types/analytics.types";

const MONTH_LABELS = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"];

function toLabel(year: number, month: number) {
  return `${MONTH_LABELS[month - 1]}/${String(year).slice(2)}`;
}

function milestoneIcon(type: FinancialMilestone["type"]) {
  switch (type) {
    case "journey_start":     return Flag;
    case "investment_start":  return Coins;
    case "net_worth_milestone": return Trophy;
    case "peak":              return Star;
    case "savings_streak":    return Flame;
    default:                  return Flag;
  }
}

function milestoneColor(type: FinancialMilestone["type"]): string {
  switch (type) {
    case "journey_start":     return "var(--blue)";
    case "investment_start":  return "var(--cyan)";
    case "net_worth_milestone": return "var(--green)";
    case "peak":              return "var(--yellow)";
    case "savings_streak":    return "var(--orange)";
    default:                  return "var(--text-muted)";
  }
}

function formatMilestoneDate(dateStr: string): string {
  const d = new Date(dateStr + "T00:00:00");
  return `${MONTH_LABELS[d.getMonth()]}/${d.getFullYear()}`;
}

const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="border-border bg-surface rounded-lg border px-3 py-2 shadow-md">
      <p className="text-text-muted mb-1 text-[11px]">{label}</p>
      <p className="font-money text-green text-[13px]">
        {formatCurrency(payload[0]?.value / 100)}
      </p>
    </div>
  );
};

type Props = { data: FinancialMilestonesResponse };

export function FinancialTimelineChart({ data }: Props) {
  const { timeline, milestones } = data;

  const chartData = timeline.map((p) => ({
    label:    toLabel(p.year, p.month),
    netWorth: p.netWorth,
    year:     p.year,
    month:    p.month,
  }));

  // Build a lookup: label → netWorth, so we can place ReferenceDots
  const netWorthByLabel = new Map(chartData.map((d) => [d.label, d.netWorth]));

  // For each milestone, find its chart label
  const milestonePoints = milestones.map((m) => {
    const d = new Date(m.date + "T00:00:00");
    const label = toLabel(d.getFullYear(), d.getMonth() + 1);
    const y = netWorthByLabel.get(label) ?? m.netWorthAtDate;
    return { ...m, chartLabel: label, chartY: y };
  });

  if (chartData.length === 0) {
    return (
      <div className="border-border bg-surface flex flex-col rounded-xl border p-5">
        <SectionHeader
          title="Linha da Vida Financeira"
          subtitle="Evolução completa do patrimônio com marcos da sua jornada"
        />
        <ChartEmptyState message="Sem histórico patrimonial para exibir" />
      </div>
    );
  }

  return (
    <div className="border-border bg-surface flex flex-col rounded-xl border p-5">
      <SectionHeader
        title="Linha da Vida Financeira"
        subtitle="Evolução completa do patrimônio com marcos da sua jornada"
      />

      <div className="w-full" style={{ height: 300 }}>
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={chartData} margin={{ top: 16, right: 8, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id="gradTimeline" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%"  stopColor="var(--green)" stopOpacity={0.22} />
                <stop offset="95%" stopColor="var(--green)" stopOpacity={0.02} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
            <XAxis
              dataKey="label"
              tick={{ fill: "var(--text-muted)", fontSize: 10, fontFamily: "DM Sans" }}
              axisLine={false}
              tickLine={false}
              interval="preserveStartEnd"
            />
            <YAxis
              tick={{ fill: "var(--text-muted)", fontSize: 10, fontFamily: "JetBrains Mono" }}
              axisLine={false}
              tickLine={false}
              tickFormatter={(v) => formatCurrencyCompact(v / 100)}
              width={72}
            />
            <Tooltip
              content={<CustomTooltip />}
              cursor={{ stroke: "var(--border)", strokeWidth: 1, strokeDasharray: "4 4" }}
            />
            <Area
              type="monotone"
              dataKey="netWorth"
              name="Patrimônio"
              stroke="var(--green)"
              strokeWidth={2}
              fill="url(#gradTimeline)"
              dot={false}
            />
            {milestonePoints.map((m) => (
              <ReferenceDot
                key={`${m.type}-${m.date}`}
                x={m.chartLabel}
                y={m.chartY}
                r={5}
                fill={milestoneColor(m.type)}
                stroke="var(--surface)"
                strokeWidth={2}
              />
            ))}
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* Legend */}
      <div className="mt-3 flex flex-wrap gap-5">
        <div className="flex items-center gap-1.5">
          <svg width="20" height="12">
            <line x1="0" y1="6" x2="20" y2="6" stroke="var(--green)" strokeWidth="2" />
          </svg>
          <span className="text-text-muted text-[13px]">Patrimônio líquido histórico</span>
        </div>
        {[
          { color: "var(--blue)",       label: "Início da jornada" },
          { color: "var(--cyan)",       label: "Primeiro investimento" },
          { color: "var(--green)",      label: "Marco de patrimônio" },
          { color: "var(--yellow)",     label: "Pico histórico" },
          { color: "var(--orange)",     label: "Sequência de poupança" },
        ].map(({ color, label }) => (
          <div key={label} className="flex items-center gap-1.5">
            <div className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: color }} />
            <span className="text-text-muted text-[13px]">{label}</span>
          </div>
        ))}
      </div>

      {/* Milestone list */}
      {milestones.length > 0 && (
        <div className="mt-5">
          <p className="text-text-sub mb-3 text-[13px] font-medium">Marcos da jornada</p>
          <div className="flex flex-col gap-2">
            {milestones.map((m) => {
              const Icon  = milestoneIcon(m.type);
              const color = milestoneColor(m.type);
              return (
                <div
                  key={`${m.type}-${m.date}`}
                  className="border-border bg-surface2 flex items-center gap-3 rounded-xl border px-4 py-3"
                >
                  <div
                    className="flex h-8 w-8 shrink-0 items-center justify-center rounded-[10px]"
                    style={{ backgroundColor: `${color}1a` }}
                  >
                    <Icon size={15} style={{ color }} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-text text-[13px] font-medium">{m.label}</p>
                    <p className="text-text-muted text-[11px]">{formatMilestoneDate(m.date)}</p>
                  </div>
                  <p className="font-money text-text-sub shrink-0 text-[13px]">
                    {formatCurrency(m.netWorthAtDate / 100)}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

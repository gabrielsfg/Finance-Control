"use client";

import { useState } from "react";
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
import { SectionHeader } from "@/components/shared/SectionHeader";
import { ChartEmptyState } from "@/components/shared/ChartEmptyState";
import { formatCurrency, formatCurrencyCompact } from "@/lib/utils/formatCurrency";
import { useGoals } from "@/features/goals/hooks/useGoals";
import type { PassiveIncomeProjectionResponse } from "@/lib/types/analytics.types";
import type { Goal } from "@/lib/types/goal.types";

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
        <p key={e.name} className="font-money text-[12px]" style={{ color: e.color ?? e.stroke }}>
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

// ── Goal countdown computation ────────────────────────────────────────────────
// Finds the first projected month in which cumulative passive income >= goal.targetAmount.
// Returns a human-readable label like "Jun/27" or null if not reachable in the projection window.
function computeGoalCountdown(
  projected: PassiveIncomeProjectionResponse["projected"],
  currentPassiveIncome: number,
  goal: Goal,
): { label: string; monthsAway: number } | null {
  let accumulated = 0;
  for (const point of projected) {
    accumulated += point.passiveIncome;
    if (accumulated >= goal.targetAmount) {
      const now = new Date();
      const targetDate = new Date(point.year, point.month - 1);
      const monthsAway = Math.max(
        0,
        (targetDate.getFullYear() - now.getFullYear()) * 12 +
          (targetDate.getMonth() - now.getMonth()),
      );
      return { label: toLabel(point.year, point.month), monthsAway };
    }
  }
  return null;
}

type Props = { data: PassiveIncomeProjectionResponse };

export function PassiveIncomeChart({ data }: Props) {
  const { currentMonthlyPassiveIncome, monthlyLivingCost, coveragePercent } = data;
  const { data: goals } = useGoals({ type: "Item", status: "Active" });
  const [selectedGoalId, setSelectedGoalId] = useState<number | "">("");

  const selectedGoal = goals?.find((g) => g.id === selectedGoalId) ?? null;
  const countdown = selectedGoal
    ? computeGoalCountdown(data.projected, currentMonthlyPassiveIncome, selectedGoal)
    : null;

  // Combine history + projected into a flat chart array
  const histPoints = data.history.map((h) => ({
    label:            toLabel(h.year, h.month),
    passiveIncome:    h.passiveIncome,
    passiveProjected: null as number | null,
    livingCost:       h.livingCost,
  }));

  const joinH = data.history[data.history.length - 1];
  const projPoints = data.projected.map((p) => ({
    label:            toLabel(p.year, p.month),
    passiveIncome:    null as number | null,
    passiveProjected: p.passiveIncome,
    livingCost:       p.livingCost,
  }));

  const chartData = data.history.length === 0 ? [] : [
    ...histPoints,
    {
      label:            toLabel(joinH.year, joinH.month),
      passiveIncome:    joinH.passiveIncome,
      passiveProjected: joinH.passiveIncome,
      livingCost:       joinH.livingCost,
    },
    ...projPoints,
  ];

  if (chartData.length === 0) {
    return (
      <div className="border-border bg-surface flex flex-col rounded-xl border p-5">
        <SectionHeader
          title="Renda Passiva vs. Custo de Vida"
          subtitle="Evolução dos dividendos e projeção até a independência financeira"
        />
        <ChartEmptyState message="Sem dividendos registrados para exibir" />
      </div>
    );
  }

  return (
    <div className="border-border bg-surface flex flex-col rounded-xl border p-5">
      <SectionHeader
        title="Renda Passiva vs. Custo de Vida"
        subtitle="Evolução dos dividendos e projeção até a independência financeira"
      />

      {/* Summary cards */}
      <div className="bg-surface2 mb-5 grid grid-cols-2 gap-3 rounded-xl p-4">
        <div>
          <p className="text-text-muted text-[12px]">Cobertura atual</p>
          <p
            className="font-money font-600 text-[20px]"
            style={{ color: coveragePercent >= 100 ? "var(--green)" : "var(--orange)" }}
          >
            {coveragePercent.toFixed(1)}%
          </p>
          <p className="text-text-muted mt-0.5 text-[11px]">do custo de vida</p>
        </div>
        <div>
          <p className="text-text-muted text-[12px]">Renda passiva mensal</p>
          <p className="font-money font-600 text-text text-[18px]">
            {formatCurrency(currentMonthlyPassiveIncome / 100)}
          </p>
          <p className="text-text-muted mt-0.5 text-[11px]">
            Custo de vida: {formatCurrency(monthlyLivingCost / 100)}
          </p>
        </div>
      </div>

      {/* Goal selector */}
      {goals && goals.length > 0 && (
        <div className="mb-5 flex flex-col gap-2">
          <div className="flex items-center gap-3">
            <label className="text-text-muted text-[12px] shrink-0">Simular meta:</label>
            <select
              value={selectedGoalId}
              onChange={(e) => setSelectedGoalId(e.target.value ? Number(e.target.value) : "")}
              className="border-border bg-surface2 text-text h-8 flex-1 rounded-lg border px-3 text-[13px] outline-none focus:border-green/60"
            >
              <option value="">Selecione uma meta de compra...</option>
              {goals.map((g) => (
                <option key={g.id} value={g.id}>
                  {g.name} — {formatCurrency(g.targetAmount / 100)}
                </option>
              ))}
            </select>
          </div>

          {selectedGoal && (
            <div className="border-border/50 bg-surface2 rounded-xl border px-4 py-3">
              {countdown ? (
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <p className="text-text text-[13px] font-medium">
                      Sua renda passiva acumulada cobre{" "}
                      <span className="text-green">{selectedGoal.name}</span> em
                    </p>
                    <p className="text-text-muted text-[12px] mt-0.5">
                      Acumulando {formatCurrency(selectedGoal.targetAmount / 100)} em dividendos projetados
                    </p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="font-money text-green text-[20px] font-semibold">{countdown.label}</p>
                    <p className="text-text-muted text-[11px]">
                      {countdown.monthsAway} {countdown.monthsAway === 1 ? "mês" : "meses"}
                    </p>
                  </div>
                </div>
              ) : (
                <p className="text-text-muted text-[13px]">
                  Essa meta não é atingível pela renda passiva projetada neste horizonte.
                </p>
              )}
            </div>
          )}
        </div>
      )}

      <div className="w-full" style={{ height: 300 }}>
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={chartData} margin={{ top: 4, right: 4, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id="gradPassive" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%"  stopColor="var(--green)" stopOpacity={0.25} />
                <stop offset="95%" stopColor="var(--green)" stopOpacity={0.02} />
              </linearGradient>
              <linearGradient id="gradLiving" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%"  stopColor="var(--red)" stopOpacity={0.18} />
                <stop offset="95%" stopColor="var(--red)" stopOpacity={0.02} />
              </linearGradient>
            </defs>
            <CartesianGrid stroke="var(--border-chart)" />
            <XAxis
              dataKey="label"
              tick={{ fill: "var(--text-muted)", fontSize: 11, fontFamily: "DM Sans" }}
              axisLine={false}
              tickLine={false}
              interval="preserveStartEnd"
            />
            <YAxis
              tick={{ fill: "var(--text-muted)", fontSize: 11, fontFamily: "JetBrains Mono" }}
              axisLine={false}
              tickLine={false}
              tickFormatter={(v) => formatCurrencyCompact(v / 100)}
              width={72}
            />
            <Tooltip
              content={<CustomTooltip />}
              cursor={{ stroke: "var(--border)", strokeWidth: 1, strokeDasharray: "4 4" }}
            />
            <ReferenceLine
              y={monthlyLivingCost}
              stroke="var(--red)"
              strokeDasharray="4 3"
              strokeWidth={1}
              label={{ value: "Custo de vida", fill: "var(--red)", fontSize: 10, position: "right" }}
            />
            <Area
              type="monotone"
              dataKey="livingCost"
              name="Custo de vida"
              stroke="var(--red)"
              strokeWidth={1.5}
              fill="url(#gradLiving)"
              dot={false}
              connectNulls={false}
            />
            <Area
              type="monotone"
              dataKey="passiveIncome"
              name="Renda passiva"
              stroke="var(--green)"
              strokeWidth={2}
              fill="url(#gradPassive)"
              dot={false}
              connectNulls={false}
            />
            <Area
              type="monotone"
              dataKey="passiveProjected"
              name="Projeção renda"
              stroke="var(--green)"
              strokeWidth={2}
              strokeDasharray="5 4"
              fill="none"
              dot={false}
              connectNulls={false}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      <div className="mt-3 flex flex-wrap gap-5">
        <LegendItem color="var(--green)" label="Renda passiva (histórico)" dashed={false} />
        <LegendItem color="var(--green)" label="Renda passiva (projeção)"  dashed />
        <LegendItem color="var(--red)"   label="Custo de vida"             dashed={false} />
      </div>
    </div>
  );
}

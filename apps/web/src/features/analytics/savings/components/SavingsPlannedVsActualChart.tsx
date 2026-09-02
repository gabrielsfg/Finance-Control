"use client";

import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  ReferenceLine,
  Cell,
} from "recharts";
import { Card, CardHead } from "@/components/shared/Card";
import { ChartEmptyState } from "@/components/shared/ChartEmptyState";
import { formatCurrency, formatCurrencyCompact } from "@/lib/utils/index";
import type { SavingsPeriodItem } from "@/lib/types/analytics.types";
import { periodShortLabel } from "../savingsPeriod";
import { chartAnim } from "@/lib/config/chartAnimation";

const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="border-border bg-surface rounded-lg border px-3 py-2 shadow-md">
      <p className="text-text-muted mb-1.5 text-[11px]">{label}</p>
      {payload.map((entry: any) => {
        // The executado bar is plotted mirrored so it hangs below the axis; its plotted
        // value is a position, not an amount. The real figure rides along on the datum
        // and is what the reader must see — a saved R$ 300 must never read as -R$ 300.
        const real = entry.dataKey === "executado" ? entry.payload.executadoReal : entry.value;
        return (
          <p key={entry.dataKey} className="font-money text-[13px]" style={{ color: entry.color ?? entry.fill }}>
            {entry.name}: {real < 0 ? "-" : ""}{formatCurrency(Math.abs(real))}
          </p>
        );
      })}
    </div>
  );
};

type Props = {
  periods: SavingsPeriodItem[];
  plannedSavings: number; // cents
};

export function SavingsPlannedVsActualChart({ periods, plannedSavings }: Props) {
  /**
   * Planned and executed share an x position and diverge from zero: planned up, executed
   * down. Side by side they read as two unrelated series, when in fact they are two
   * measurements of the SAME period and the only thing worth seeing is which is longer.
   *
   * `executado` is negated because Recharts derives the bar's direction from the sign of
   * its value — the mirrored number is a coordinate, so the real one travels beside it
   * for the tooltip and the colour. Magnitude is used rather than the raw figure so a
   * period that lost money still hangs below the line instead of flipping up into the
   * planned half; the red fill is what says it went negative.
   */
  const chartData = periods.map((p) => ({
    label: periodShortLabel(p.periodStart),
    planejado: plannedSavings / 100,
    executado: -Math.abs(p.savings / 100),
    executadoReal: p.savings / 100,
  }));

  return (
    <Card className="flex flex-col">
      <CardHead
        title="Planejado vs. Executado"
        subtitle="Quanto o orçamento previa poupar e quanto você realmente poupou"
      />

      {chartData.length === 0 ? (
        <ChartEmptyState />
      ) : (
        <>
          <div className="w-full" style={{ height: 260 }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} margin={{ top: 4, right: 4, left: 0, bottom: 0 }}>
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
                  // Both halves measure an amount; the sign here is direction, so the
                  // axis would otherwise label the executado side as negative money.
                  tickFormatter={(v) => formatCurrencyCompact(Math.abs(v))}
                  width={72}
                />
                <Tooltip content={<CustomTooltip />} cursor={{ fill: "var(--surface2)", opacity: 0.5 }} />
                {/* The axis the two series diverge from, so it carries more weight than
                    a grid line. */}
                <ReferenceLine y={0} stroke="var(--text-muted)" strokeWidth={1.5} />
                {/* One stackId puts both in the same x slot. Recharts stacks positives up
                    from zero and negatives down from it, so the shared stack is what
                    produces the split rather than any manual offset that would drift as
                    the container resizes. */}
                {/* Solid, not the 45% ghost it was. Both halves are measurements being
                    compared by length, so they need equal visual weight — a translucent
                    planned bar reads as a backdrop and the eye stops measuring it. The
                    2px surface stroke keeps the two from smearing together at zero. */}
                <Bar
                  {...chartAnim(0)}
                  stackId="period"
                  dataKey="planejado"
                  name="Planejado"
                  fill="var(--chart-2)"
                  stroke="var(--surface)"
                  strokeWidth={2}
                  radius={[4, 4, 0, 0]}
                  maxBarSize={28}
                />
                <Bar
                  {...chartAnim(1)}
                  stackId="period"
                  dataKey="executado"
                  name="Executado"
                  stroke="var(--surface)"
                  strokeWidth={2}
                  radius={[0, 0, 4, 4]}
                  maxBarSize={28}
                >
                  {chartData.map((entry, i) => (
                    <Cell key={i} fill={entry.executadoReal < 0 ? "var(--chart-3)" : "var(--chart-1)"} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="mt-3 flex flex-wrap gap-5">
            {[
              ["var(--chart-2)", "Planejado (acima)"],
              ["var(--chart-1)", "Executado (abaixo)"],
              ["var(--chart-3)", "Executado negativo"],
            ].map(([color, label]) => (
              <div key={label} className="flex items-center gap-1.5">
                <div className="h-2.5 w-2.5 rounded-[2px]" style={{ backgroundColor: color }} />
                <span className="text-text-muted text-[13px]">{label}</span>
              </div>
            ))}
          </div>
        </>
      )}
    </Card>
  );
}

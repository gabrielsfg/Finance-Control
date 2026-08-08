"use client";

import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip } from "recharts";
import { Card, CardHead } from "@/components/shared/Card";
import { ChartEmptyState } from "@/components/shared/ChartEmptyState";
import { formatCurrency } from "@/lib/utils/index";
import type { SavingsDetailResponse } from "@/lib/types/analytics.types";
import { pieAnim } from "@/lib/config/chartAnimation";

const CustomTooltip = ({ active, payload }: any) => {
  if (!active || !payload?.length) return null;
  const entry = payload[0];
  return (
    <div className="border-border bg-surface rounded-lg border px-3 py-2 shadow-md">
      <p className="font-money text-[13px]" style={{ color: entry.payload.fill }}>
        {entry.name}: {formatCurrency(entry.value)}
      </p>
    </div>
  );
};

type Props = { detail: SavingsDetailResponse };

export function SavingsDestinationCard({ detail }: Props) {
  const invested = Math.max(0, detail.invested);
  const goals = Math.max(0, detail.goalContributions);
  const idle = Math.max(0, detail.savings - invested - goals);
  const overcommitted = detail.savings > 0 && invested + goals > detail.savings;

  const slices = [
    { name: "Investido", value: invested / 100, fill: "var(--purple)" },
    { name: "Guardado em metas", value: goals / 100, fill: "var(--gold)" },
    { name: "Livre em conta", value: idle / 100, fill: "var(--moss)" },
  ].filter((s) => s.value > 0);

  const total = slices.reduce((s, x) => s + x.value, 0);

  return (
    <Card className="flex flex-col">
      <CardHead
        title="Destino das Economias"
        subtitle="Para onde foi o que você não gastou"
      />

      {detail.savings <= 0 || slices.length === 0 ? (
        <ChartEmptyState message="Sem economias neste período" />
      ) : (
        <>
          <div className="w-full" style={{ height: 200 }}>
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Tooltip content={<CustomTooltip />} />
                <Pie
                  {...pieAnim()}
                  data={slices}
                  dataKey="value"
                  nameKey="name"
                  innerRadius={58}
                  outerRadius={85}
                  paddingAngle={2}
                  strokeWidth={0}
                >
                  {slices.map((s) => (
                    <Cell key={s.name} fill={s.fill} />
                  ))}
                </Pie>
              </PieChart>
            </ResponsiveContainer>
          </div>

          <div className="mt-4 flex flex-col gap-2">
            {slices.map((s) => (
              <div key={s.name} className="flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <span className="h-2.5 w-2.5 rounded-[2px]" style={{ backgroundColor: s.fill }} />
                  <span className="text-text-sub text-[13px]">{s.name}</span>
                </div>
                <span className="font-money text-text text-[13px]">
                  {formatCurrency(s.value)}
                  <span className="text-text-muted ml-1.5 text-[11px]">
                    {total > 0 ? `${((s.value / total) * 100).toFixed(0)}%` : ""}
                  </span>
                </span>
              </div>
            ))}
          </div>

          {overcommitted && (
            <p className="text-text-muted mt-3 text-[11px]">
              Você aplicou mais do que economizou no período — a diferença saiu de saldo anterior.
            </p>
          )}
        </>
      )}
    </Card>
  );
}

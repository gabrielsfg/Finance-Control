"use client";

import { ChartEmptyState } from "@/components/shared/ChartEmptyState";
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from "recharts";
import { Card, CardHead } from "@/components/shared/Card";
import { formatCurrency } from "@/lib/utils/formatCurrency";
import { cn } from "@/lib/utils";
import { useInvestments } from "@/features/investments/hooks/useInvestments";
import { useAnalyticsInvestmentEvolution } from "@/features/analytics/hooks/useAnalytics";
import { AnalyticsInvestmentEvolutionChart } from "./AnalyticsInvestmentEvolutionChart";
import { HeroPanel } from "@/components/shared/HeroPanel";
import { BigMoney } from "@/components/shared/Money";
import { FlowRow } from "@/components/shared/FlowBar";
import { AnimatedCurrency, AnimatedCount } from "@/components/shared/AnimatedValue";
import { pieAnim } from "@/lib/config/chartAnimation";

const ASSET_CLASS_ORDER = ["Renda Fixa", "Renda Variável", "FII", "Internacional", "Cripto"];

const DonutTooltip = ({ active, payload }: any) => {
  if (!active || !payload?.length) return null;
  const { name, value, payload: { color } } = payload[0];
  return (
    <div className="border-border bg-surface rounded-lg border px-3 py-2 shadow-md">
      <div className="flex items-center gap-1.5">
        <div className="h-2 w-2 rounded-[2px]" style={{ backgroundColor: color }} />
        <span className="text-text text-[12px] font-medium">{name}</span>
      </div>
      <p className="font-money text-text-sub mt-1 text-[12px]">{formatCurrency(value / 100)}</p>
    </div>
  );
};

export function InvestmentOverviewTab({ startDate, finishDate }: { startDate: string; finishDate: string }) {
  const portfolio = useInvestments();
  const evolution = useAnalyticsInvestmentEvolution(startDate, finishDate);

  const data = portfolio.data;

  return (
    <div className="flex flex-col gap-5">
      {/* Hero panel — portfolio summary */}
      {data && (() => {
        const maxBar = Math.max(data.totalInvested, Math.abs(data.totalReturn), 1);
        return (
          <HeroPanel split>
            {/* Left — current portfolio value */}
            <div>
              <div className="font-mono text-[11px] tracking-[0.18em] uppercase text-[var(--panel-muted)]">
                Patrimônio atual
              </div>
              <BigMoney
                cents={data.currentValue}
                className="block mt-[10px] mb-[2px] font-semibold leading-[0.96] tracking-[-0.035em]"
                style={{ fontSize: "clamp(40px, 5.6vw, 70px)" } as React.CSSProperties}
              />
              <div className="mt-2 font-mono text-[13px] text-[var(--panel-muted)]">
                {data.investments.length} ativo{data.investments.length !== 1 ? "s" : ""} · {data.allocations.length} classe{data.allocations.length !== 1 ? "s" : ""}
              </div>

              <div className="mt-6 flex flex-wrap gap-[26px]">
                <div>
                  <div className="font-mono text-[11px] tracking-[0.18em] uppercase text-[var(--panel-muted)]">
                    Capital investido
                  </div>
                  <div className="font-mono mt-[3px] text-[18px] font-medium text-[var(--panel-foreground)]">
                    <AnimatedCurrency cents={data.totalInvested} />
                  </div>
                </div>
                <div>
                  <div className="font-mono text-[11px] tracking-[0.18em] uppercase text-[var(--panel-muted)]">
                    Retorno %
                  </div>
                  <div
                    className="font-mono mt-[3px] text-[18px] font-medium"
                    style={{ color: data.totalReturnPercent >= 0 ? "var(--moss-lift)" : "var(--clay-lift)" }}
                  >
                    {data.totalReturnPercent >= 0 ? "+" : ""}
                    <AnimatedCount value={data.totalReturnPercent} decimals={2} suffix="%" />
                  </div>
                </div>
              </div>
            </div>

            {/* Right — invested vs return bars */}
            <div className="self-center">
              <div className="mb-[18px] flex items-baseline justify-between">
                <span className="font-display text-[16px] font-bold">Capital vs. Retorno</span>
                <span className="font-mono text-[11px] tracking-[0.1em] uppercase text-[var(--panel-muted)]">
                  Composição
                </span>
              </div>

              <FlowRow
                label="Capital investido"
                dotColor="var(--moss-lift)"
                value={<AnimatedCurrency cents={data.totalInvested} />}
                valueColor="var(--moss-lift)"
                pct={data.totalInvested / maxBar}
                variant="in"
              />
              <FlowRow
                label="Retorno total"
                dotColor={data.totalReturn >= 0 ? "var(--moss-lift)" : "var(--clay-lift)"}
                value={
                  <>
                    {data.totalReturn >= 0 ? "+ " : "− "}
                    <AnimatedCurrency cents={data.totalReturn} absolute />
                  </>
                }
                valueColor={data.totalReturn >= 0 ? "var(--moss-lift)" : "var(--clay-lift)"}
                pct={Math.abs(data.totalReturn) / maxBar}
                variant={data.totalReturn >= 0 ? "in" : "out"}
              />

              <div
                className="mt-5 flex items-center justify-between border-t pt-4"
                style={{ borderColor: "rgba(255,255,255,0.12)" }}
              >
                <span className="font-mono text-[11px] tracking-[0.16em] uppercase text-[var(--panel-muted)]">
                  Valor atual
                </span>
                <span className="font-mono text-[22px] font-semibold text-[var(--panel-foreground)]">
                  <AnimatedCurrency cents={data.currentValue} />
                </span>
              </div>
            </div>
          </HeroPanel>
        );
      })()}

      {/* Allocation breakdown */}
      <Card>
        <CardHead title="Alocação por classe" subtitle="Distribuição do patrimônio entre classes de ativos" />
        {!data || data.allocations.length === 0 ? (
          <ChartEmptyState message="Nenhuma posição em carteira" />
        ) : (
          <div className="flex flex-col gap-6 lg:flex-row lg:items-center">
            <div className="mx-auto w-full max-w-[220px] shrink-0 lg:mx-0" style={{ height: 220 }}>
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    {...pieAnim()}
                    data={data.allocations}
                    dataKey="value"
                    nameKey="assetClass"
                    cx="50%"
                    cy="50%"
                    innerRadius={62}
                    outerRadius={95}
                    paddingAngle={2}
                    strokeWidth={0}
                  >
                    {data.allocations.map((alloc) => (
                      <Cell key={alloc.assetClass} fill={alloc.color} />
                    ))}
                  </Pie>
                  <Tooltip content={<DonutTooltip />} />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="flex flex-1 flex-col gap-3">
              {ASSET_CLASS_ORDER
                .map((cls) => data.allocations.find((a) => a.assetClass === cls))
                .filter(Boolean)
                .map((alloc) => (
                  <div key={alloc!.assetClass}>
                    <div className="mb-1 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="h-2.5 w-2.5 rounded-[3px]" style={{ backgroundColor: alloc!.color }} />
                        <span className="text-text text-[13px] font-medium">{alloc!.assetClass}</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="font-money text-text-sub text-[12px]">{formatCurrency(alloc!.value / 100)}</span>
                        <span className="font-mono text-text-muted w-10 text-right text-[12px]">{alloc!.percent.toFixed(1)}%</span>
                      </div>
                    </div>
                    <div className="bg-surface2 h-1.5 w-full overflow-hidden rounded-full">
                      <div
                        className="h-full rounded-full transition-all"
                        style={{ width: `${alloc!.percent}%`, backgroundColor: alloc!.color }}
                      />
                    </div>
                  </div>
                ))}
            </div>
          </div>
        )}
      </Card>

      {/* Evolution chart */}
      <AnalyticsInvestmentEvolutionChart data={evolution.data ?? { data: [], returnPct: null, cumulativeDividends: 0 }} />
    </div>
  );
}

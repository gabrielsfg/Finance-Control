"use client";

import { TrendingUp, Wallet, BarChart2, ArrowUpRight } from "lucide-react";
import { ChartEmptyState } from "@/components/shared/ChartEmptyState";
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from "recharts";
import { Card, CardHead } from "@/components/shared/Card";
import { formatCurrency } from "@/lib/utils/formatCurrency";
import { cn } from "@/lib/utils";
import { useInvestments } from "@/features/investments/hooks/useInvestments";
import { useAnalyticsInvestmentEvolution } from "@/features/analytics/hooks/useAnalytics";
import { AnalyticsInvestmentEvolutionChart } from "./AnalyticsInvestmentEvolutionChart";

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
      {/* KPI cards */}
      {data && (
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          <Card>
            <div
              className="mb-3 flex h-9 w-9 items-center justify-center rounded-[13px]"
              style={{ backgroundColor: "color-mix(in srgb, var(--moss) 14%, transparent)" }}
            >
              <Wallet size={18} className="text-[var(--moss)]" strokeWidth={1.75} />
            </div>
            <p className="font-display text-[16px] font-bold text-[var(--text)]">Patrimônio atual</p>
            <p className="mt-1 font-mono text-[20px] font-bold tabular-nums text-[var(--text)]">
              {formatCurrency(data.currentValue / 100)}
            </p>
          </Card>

          <Card>
            <div
              className="mb-3 flex h-9 w-9 items-center justify-center rounded-[13px]"
              style={{ backgroundColor: "color-mix(in srgb, var(--brand-cobalt) 14%, transparent)" }}
            >
              <BarChart2 size={18} className="text-[var(--brand-cobalt)]" strokeWidth={1.75} />
            </div>
            <p className="font-display text-[16px] font-bold text-[var(--text)]">Capital investido</p>
            <p className="mt-1 font-mono text-[20px] font-bold tabular-nums text-[var(--text)]">
              {formatCurrency(data.totalInvested / 100)}
            </p>
          </Card>

          <Card>
            <div
              className="mb-3 flex h-9 w-9 items-center justify-center rounded-[13px]"
              style={{ backgroundColor: `color-mix(in srgb, ${data.totalReturn >= 0 ? "var(--cyan)" : "var(--clay)"} 14%, transparent)` }}
            >
              <TrendingUp size={18} className={data.totalReturn >= 0 ? "text-[var(--cyan)]" : "text-[var(--clay)]"} strokeWidth={1.75} />
            </div>
            <p className="font-display text-[16px] font-bold text-[var(--text)]">Retorno total</p>
            <p className={cn("mt-1 font-mono text-[20px] font-bold tabular-nums", data.totalReturn >= 0 ? "text-[var(--cyan)]" : "text-[var(--clay)]")}>
              {data.totalReturn >= 0 ? "+" : ""}{formatCurrency(data.totalReturn / 100)}
            </p>
            <p className={cn("mt-0.5 font-mono text-[12px]", data.totalReturnPercent >= 0 ? "text-[var(--cyan)]" : "text-[var(--clay)]")}>
              {data.totalReturnPercent >= 0 ? "+" : ""}{data.totalReturnPercent.toFixed(2)}%
            </p>
          </Card>

          <Card>
            <div
              className="mb-3 flex h-9 w-9 items-center justify-center rounded-[13px]"
              style={{ backgroundColor: "color-mix(in srgb, var(--gold) 14%, transparent)" }}
            >
              <ArrowUpRight size={18} className="text-[var(--gold)]" strokeWidth={1.75} />
            </div>
            <p className="font-display text-[16px] font-bold text-[var(--text)]">Ativos na carteira</p>
            <p className="mt-1 font-display text-[20px] font-bold text-[var(--text)]">{data.investments.length}</p>
            <p className="mt-0.5 text-[12px] text-[var(--text-sub)]">{data.allocations.length} classes de ativos</p>
          </Card>
        </div>
      )}

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

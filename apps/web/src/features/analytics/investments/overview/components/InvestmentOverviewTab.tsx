"use client";

import { useState, useCallback } from "react";
import { TrendingUp, Wallet, BarChart2, ArrowUpRight } from "lucide-react";
import { PieChart, Pie, Cell, Sector, Tooltip, ResponsiveContainer } from "recharts";
import { SectionHeader } from "@/components/shared/SectionHeader";
import { formatCurrency } from "@/lib/utils/formatCurrency";
import { cn } from "@/lib/utils";
import { useInvestments } from "@/features/investments/hooks/useInvestments";
import { useAnalyticsInvestmentEvolution } from "@/features/analytics/hooks/useAnalytics";
import { AnalyticsInvestmentEvolutionChart } from "./AnalyticsInvestmentEvolutionChart";

const ASSET_CLASS_ORDER = ["Renda Fixa", "Renda Variável", "FII", "Internacional", "Cripto"];

const renderActiveShape = (props: any) => {
  const { cx, cy, innerRadius, outerRadius, startAngle, endAngle, fill } = props;
  return (
    <Sector cx={cx} cy={cy} innerRadius={innerRadius} outerRadius={outerRadius + 8} startAngle={startAngle} endAngle={endAngle} fill={fill} />
  );
};

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
  const [activeIndex, setActiveIndex] = useState<number | undefined>(undefined);
  const onMouseEnter = useCallback((_: any, i: number) => setActiveIndex(i), []);
  const onMouseLeave = useCallback(() => setActiveIndex(undefined), []);

  const data = portfolio.data;

  return (
    <div className="flex flex-col gap-5">
      {/* KPI cards */}
      {data && (
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          <div className="border-border bg-surface rounded-xl border p-5">
            <div className="bg-green/10 mb-3 flex h-9 w-9 items-center justify-center rounded-[10px]">
              <Wallet size={18} className="text-green" strokeWidth={1.75} />
            </div>
            <p className="font-display font-700 text-text text-[16px]">Patrimônio atual</p>
            <p className="font-money font-700 text-green mt-1 text-[20px]">
              {formatCurrency(data.currentValue / 100)}
            </p>
          </div>

          <div className="border-border bg-surface rounded-xl border p-5">
            <div className="bg-blue/10 mb-3 flex h-9 w-9 items-center justify-center rounded-[10px]">
              <BarChart2 size={18} className="text-blue" strokeWidth={1.75} />
            </div>
            <p className="font-display font-700 text-text text-[16px]">Capital investido</p>
            <p className="font-money font-700 text-text mt-1 text-[20px]">
              {formatCurrency(data.totalInvested / 100)}
            </p>
          </div>

          <div className="border-border bg-surface rounded-xl border p-5">
            <div className={cn("mb-3 flex h-9 w-9 items-center justify-center rounded-[10px]", data.totalReturn >= 0 ? "bg-cyan/10" : "bg-red/10")}>
              <TrendingUp size={18} className={data.totalReturn >= 0 ? "text-cyan" : "text-red"} strokeWidth={1.75} />
            </div>
            <p className="font-display font-700 text-text text-[16px]">Retorno total</p>
            <p className={cn("font-money font-700 mt-1 text-[20px]", data.totalReturn >= 0 ? "text-cyan" : "text-red")}>
              {data.totalReturn >= 0 ? "+" : ""}{formatCurrency(data.totalReturn / 100)}
            </p>
            <p className={cn("font-mono mt-0.5 text-[12px]", data.totalReturnPercent >= 0 ? "text-cyan" : "text-red")}>
              {data.totalReturnPercent >= 0 ? "+" : ""}{data.totalReturnPercent.toFixed(2)}%
            </p>
          </div>

          <div className="border-border bg-surface rounded-xl border p-5">
            <div className="bg-orange/10 mb-3 flex h-9 w-9 items-center justify-center rounded-[10px]">
              <ArrowUpRight size={18} className="text-orange" strokeWidth={1.75} />
            </div>
            <p className="font-display font-700 text-text text-[16px]">Ativos na carteira</p>
            <p className="font-display font-700 text-text mt-1 text-[20px]">{data.investments.length}</p>
            <p className="text-text-muted mt-0.5 text-[12px]">{data.allocations.length} classes de ativos</p>
          </div>
        </div>
      )}

      {/* Allocation breakdown */}
      {data && (
        <div className="border-border bg-surface rounded-xl border p-5">
          <SectionHeader title="Alocação por classe" subtitle="Distribuição do patrimônio entre classes de ativos" />
          <div className="flex flex-col gap-6 lg:flex-row lg:items-center">
            {/* Donut chart */}
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
                    activeIndex={activeIndex}
                    activeShape={renderActiveShape}
                    onMouseEnter={onMouseEnter}
                    onMouseLeave={onMouseLeave}
                  >
                    {data.allocations.map((alloc) => (
                      <Cell key={alloc.assetClass} fill={alloc.color} />
                    ))}
                  </Pie>
                  <Tooltip content={<DonutTooltip />} />
                </PieChart>
              </ResponsiveContainer>
            </div>

            {/* Bars + legend */}
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
        </div>
      )}

      {/* Evolution chart */}
      {evolution.data && <AnalyticsInvestmentEvolutionChart data={evolution.data} />}
    </div>
  );
}

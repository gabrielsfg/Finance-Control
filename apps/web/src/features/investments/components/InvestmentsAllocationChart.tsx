"use client";

import { useState, useCallback } from "react";
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Sector } from "recharts";
import { SectionHeader } from "@/components/shared/SectionHeader";
import { ChartEmptyState } from "@/components/shared/ChartEmptyState";
import { formatCurrency } from "@/lib/utils/formatCurrency";
import type { InvestmentPortfolio } from "@/lib/types/investments.types";

const CustomTooltip = ({ active, payload }: any) => {
  if (!active || !payload?.length) return null;
  const { name, value, payload: entry } = payload[0];
  return (
    <div className="border-border bg-surface rounded-lg border px-3 py-2 shadow-md">
      <p className="text-text mb-1 text-[13px] font-medium">{name}</p>
      <p className="font-money text-text-sub text-[13px]">{formatCurrency(value / 100)}</p>
    </div>
  );
};

const renderActiveShape = (props: any) => {
  const { cx, cy, innerRadius, outerRadius, startAngle, endAngle, fill } = props;
  return <Sector cx={cx} cy={cy} innerRadius={innerRadius} outerRadius={outerRadius + 8} startAngle={startAngle} endAngle={endAngle} fill={fill} />;
};

type Props = { summary: InvestmentPortfolio };

export const InvestmentsAllocationChart = ({ summary }: Props) => {
  const [activeIndex, setActiveIndex] = useState<number | undefined>(undefined);
  const onMouseEnter = useCallback((_: any, i: number) => setActiveIndex(i), []);
  const onMouseLeave = useCallback(() => setActiveIndex(undefined), []);

  if (summary.allocations.length === 0) {
    return (
      <div className="border-border bg-surface sticky top-5 flex flex-col rounded-xl border p-5">
        <SectionHeader title="Alocação por Classe" subtitle="Distribuição atual da carteira" />
        <ChartEmptyState message="Nenhuma posição em carteira" />
      </div>
    );
  }

  const totalLabel = formatCurrency(summary.currentValue / 100);

  return (
    <div className="border-border bg-surface sticky top-5 flex flex-col rounded-xl border p-5">
      <SectionHeader title="Alocação por Classe" subtitle="Distribuição atual da carteira" />

      <div className="relative w-full" style={{ height: 200 }}>
        <ResponsiveContainer width="100%" height="100%" minWidth={0}>
          <PieChart>
            <Pie
              data={summary.allocations}
              dataKey="value"
              nameKey="assetClass"
              cx="50%"
              cy="50%"
              innerRadius={55}
              outerRadius={80}
              paddingAngle={2}
              strokeWidth={0}
              activeIndex={activeIndex}
              activeShape={renderActiveShape}
              onMouseEnter={onMouseEnter}
              onMouseLeave={onMouseLeave}
            >
              {summary.allocations.map((entry) => (
                <Cell key={entry.assetType} fill={entry.color} />
              ))}
            </Pie>
            <Tooltip content={<CustomTooltip />} />
          </PieChart>
        </ResponsiveContainer>
        {/* Center label */}
        <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
          <span className="font-money font-600 text-text text-[13px] leading-none">{totalLabel}</span>
          <span className="text-text-muted mt-0.5 text-[10px]">total</span>
        </div>
      </div>

      <div className="mt-3 flex flex-col gap-2">
        {summary.allocations.map((alloc) => (
          <div key={alloc.assetType} className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="h-2 w-2 rounded-[2px]" style={{ backgroundColor: alloc.color }} />
              <span className="text-text-sub text-[13px]">{alloc.assetClass}</span>
            </div>
            <div className="flex items-center gap-3">
              <span className="font-money text-text text-[13px]">{formatCurrency(alloc.value / 100)}</span>
              <span className="text-text-muted w-10 text-right font-mono text-[12px]">{alloc.percent.toFixed(1)}%</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

"use client";

import { useState, useCallback, useMemo } from "react";
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Sector } from "recharts";
import { ChartEmptyState } from "@/components/shared/ChartEmptyState";
import { PillSelect } from "@/components/shared/PillSelect";
import { formatCurrency } from "@/lib/utils/formatCurrency";
import type { InvestmentPortfolio } from "@/lib/types/investments.types";

const TICKER_COLORS = [
  "#00C98D", "#4A9EFF", "#F5A623", "#7C6FE0", "#F25F5C",
  "#00D4A0", "#F5CE42", "#E05F8A", "#5FC9E0", "#A0C84A",
  "#C47AE0", "#E09B5F",
];

const CustomTooltip = ({ active, payload }: any) => {
  if (!active || !payload?.length) return null;
  const entry = payload[0];
  const isValue = typeof entry.payload.value === "number" && entry.payload.value > 1000;
  return (
    <div className="border-border bg-surface rounded-lg border px-3 py-2 shadow-md">
      <p className="text-text mb-1 text-[13px] font-medium">{entry.name}</p>
      <p className="font-money text-text-sub text-[13px]">
        {isValue ? formatCurrency(entry.value / 100) : formatCurrency(entry.value / 100)}
      </p>
    </div>
  );
};

const renderActiveShape = (props: any) => {
  const { cx, cy, innerRadius, outerRadius, startAngle, endAngle, fill } = props;
  return (
    <Sector
      cx={cx} cy={cy}
      innerRadius={innerRadius}
      outerRadius={outerRadius + 8}
      startAngle={startAngle}
      endAngle={endAngle}
      fill={fill}
    />
  );
};

type Props = { summary: InvestmentPortfolio };

export const InvestmentsAllocationChart = ({ summary }: Props) => {
  const [activeIndex, setActiveIndex]   = useState<number | undefined>(undefined);
  const [selectedClass, setSelectedClass] = useState<string>("all");

  const onMouseEnter = useCallback((_: any, i: number) => setActiveIndex(i), []);
  const onMouseLeave = useCallback(() => setActiveIndex(undefined), []);

  // Build ticker-level data for a given asset class
  const tickerData = useMemo(() => {
    if (selectedClass === "all") return null;

    const classInvestments = summary.investments.filter(
      (inv) => {
        const alloc = summary.allocations.find((a) => a.assetType === inv.assetType);
        return alloc?.assetClass === selectedClass;
      }
    );

    const totalClassValue = classInvestments.reduce((s, i) => s + i.currentValue, 0);

    return classInvestments.map((inv, idx) => ({
      name:    inv.ticker,
      value:   inv.currentValue,
      percent: totalClassValue > 0 ? (inv.currentValue / totalClassValue) * 100 : 0,
      color:   TICKER_COLORS[idx % TICKER_COLORS.length],
    }));
  }, [selectedClass, summary]);

  const chartData   = tickerData ?? summary.allocations.map((a) => ({ name: a.assetClass, value: a.value, percent: a.percent, color: a.color }));
  const centerValue = tickerData
    ? formatCurrency(tickerData.reduce((s, t) => s + t.value, 0) / 100)
    : formatCurrency(summary.currentValue / 100);
  const centerLabel = selectedClass === "all" ? "total" : selectedClass;

  const classOptions = [
    { value: "all", label: "Todas as classes" },
    ...summary.allocations.map((a) => ({ value: a.assetClass, label: a.assetClass })),
  ];

  if (summary.allocations.length === 0) {
    return (
      <div className="border-border bg-surface sticky top-5 flex flex-col rounded-xl border p-5">
        <SectionHeader title="Alocação por Classe" subtitle="Distribuição atual da carteira" />
        <ChartEmptyState message="Nenhuma posição em carteira" />
      </div>
    );
  }

  return (
    <div className="border-border bg-surface sticky top-5 flex flex-col rounded-xl border p-5">
      <div className="mb-4 flex items-center justify-between gap-3">
        <div className="min-w-0">
          <h2 className="font-display font-700 text-text text-[18px] tracking-tight truncate">
            {selectedClass === "all" ? "Alocação por Classe" : `Alocação · ${selectedClass}`}
          </h2>
          <p className="text-text-muted mt-0.5 text-[13px]">
            {selectedClass === "all" ? "Distribuição atual da carteira" : "Distribuição por ticker"}
          </p>
        </div>
        <PillSelect
          options={classOptions}
          value={selectedClass}
          onChange={(v) => { setSelectedClass(v); setActiveIndex(undefined); }}
        />
      </div>

      <div className="relative mt-4 w-full" style={{ height: 200 }}>
        <ResponsiveContainer width="100%" height="100%" minWidth={0}>
          <PieChart>
            <Pie
              data={chartData}
              dataKey="value"
              nameKey="name"
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
              {chartData.map((entry, idx) => (
                <Cell key={idx} fill={entry.color} />
              ))}
            </Pie>
            <Tooltip content={<CustomTooltip />} />
          </PieChart>
        </ResponsiveContainer>
        <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
          <span className="font-money font-600 text-text text-[13px] leading-none">{centerValue}</span>
          <span className="text-text-muted mt-0.5 text-[10px] truncate max-w-[80px] text-center">{centerLabel}</span>
        </div>
      </div>

      <div className="mt-3 flex flex-col gap-2">
        {chartData.map((item, idx) => (
          <div key={idx} className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="h-2 w-2 shrink-0 rounded-[2px]" style={{ backgroundColor: item.color }} />
              <span className="text-text-sub text-[13px]">{item.name}</span>
            </div>
            <div className="flex items-center gap-3">
              <span className="font-money text-text text-[13px]">{formatCurrency(item.value / 100)}</span>
              <span className="text-text-muted w-10 text-right font-mono text-[12px]">{item.percent.toFixed(1)}%</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

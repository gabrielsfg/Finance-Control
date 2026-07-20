"use client";

import { useState, useCallback, useMemo } from "react";
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from "recharts";
import { Card, CardHead } from "@/components/shared/Card";
import { ChartEmptyState } from "@/components/shared/ChartEmptyState";
import { PillSelect } from "@/components/shared/PillSelect";
import { formatCurrency } from "@/lib/utils/formatCurrency";
import type { InvestmentPortfolio } from "@/lib/types/investments.types";

// Token-driven palette (1=moss, 2=cobalt, 3=clay, 4=gold, 5=muted, then repeat).
const SLICE_COLORS = [
  "var(--chart-1)", "var(--chart-2)", "var(--chart-4)", "var(--brand-accent)",
  "var(--chart-3)", "var(--chart-5)", "var(--moss-lift)", "var(--cobalt-lift)",
];

const sliceColor = (i: number) => SLICE_COLORS[i % SLICE_COLORS.length];

const CustomTooltip = ({ active, payload }: any) => {
  if (!active || !payload?.length) return null;
  const entry = payload[0];
  return (
    <div className="rounded-[13px] border border-[var(--border-color)] bg-[var(--surface)] px-3 py-2" style={{ boxShadow: "var(--shadow-md)" }}>
      <div className="mb-1 flex items-center gap-1.5">
        <span className="h-2.5 w-2.5 rounded-[3px]" style={{ background: entry.payload.color }} />
        <span className="text-[13px] font-medium text-[var(--text)]">{entry.name}</span>
      </div>
      <p className="font-mono text-[13px] tabular-nums text-[var(--text-sub)]">{formatCurrency(entry.value / 100)}</p>
    </div>
  );
};

type Props = { summary: InvestmentPortfolio };

export const InvestmentsAllocationChart = ({ summary }: Props) => {
  const [activeIndex, setActiveIndex]      = useState<number | undefined>(undefined);
  const [selectedClass, setSelectedClass]  = useState<string>("all");

  const onMouseEnter = useCallback((_: any, i: number) => setActiveIndex(i), []);
  const onMouseLeave = useCallback(() => setActiveIndex(undefined), []);

  // Build ticker-level data for a given asset class
  const tickerData = useMemo(() => {
    if (selectedClass === "all") return null;

    const classInvestments = summary.investments.filter((inv) => {
      const alloc = summary.allocations.find((a) => a.assetType === inv.assetType);
      return alloc?.assetClass === selectedClass;
    });

    const totalClassValue = classInvestments.reduce((s, i) => s + i.currentValue, 0);

    return classInvestments.map((inv, idx) => ({
      name:    inv.ticker,
      value:   inv.currentValue,
      percent: totalClassValue > 0 ? (inv.currentValue / totalClassValue) * 100 : 0,
      color:   sliceColor(idx),
    }));
  }, [selectedClass, summary]);

  const chartData = tickerData ?? summary.allocations.map((a, idx) => ({
    name: a.assetClass,
    value: a.value,
    percent: a.percent,
    color: sliceColor(idx),
  }));
  const centerValue = tickerData
    ? formatCurrency(tickerData.reduce((s, t) => s + t.value, 0) / 100)
    : formatCurrency(summary.currentValue / 100);
  const centerLabel = selectedClass === "all" ? "Investido" : selectedClass;

  const classOptions = [
    { value: "all", label: "Todas as classes" },
    ...summary.allocations.map((a) => ({ value: a.assetClass, label: a.assetClass })),
  ];

  if (summary.allocations.length === 0) {
    return (
      <Card className="flex flex-col">
        <CardHead title="Alocação por classe" subtitle="Distribuição atual da carteira" />
        <ChartEmptyState message="Nenhuma posição em carteira" />
      </Card>
    );
  }

  return (
    <Card className="flex flex-col">
      <CardHead
        title={selectedClass === "all" ? "Alocação por classe" : `Alocação · ${selectedClass}`}
        subtitle={selectedClass === "all" ? "Distribuição atual da carteira" : "Distribuição por ticker"}
        right={
          <PillSelect
            options={classOptions}
            value={selectedClass}
            onChange={(v) => { setSelectedClass(v); setActiveIndex(undefined); }}
          />
        }
      />

      <div className="relative mt-1 w-full" style={{ height: 200 }}>
        <ResponsiveContainer width="100%" height="100%" minWidth={0}>
          <PieChart>
            <Pie
              data={chartData}
              dataKey="value"
              nameKey="name"
              cx="50%"
              cy="50%"
              innerRadius={58}
              outerRadius={82}
              paddingAngle={2}
              strokeWidth={0}
              onMouseEnter={onMouseEnter}
              onMouseLeave={onMouseLeave}
            >
              {chartData.map((entry, idx) => (
                <Cell
                  key={idx}
                  fill={entry.color}
                  fillOpacity={activeIndex === undefined || activeIndex === idx ? 1 : 0.32}
                />
              ))}
            </Pie>
            <Tooltip content={<CustomTooltip />} />
          </PieChart>
        </ResponsiveContainer>
        <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
          <span className="font-mono text-[15px] font-semibold tabular-nums text-[var(--text)] leading-none">{centerValue}</span>
          <span className="mt-1 max-w-[88px] truncate text-center font-mono text-[10px] uppercase tracking-[0.14em] text-[var(--text-sub)]">{centerLabel}</span>
        </div>
      </div>

      <div className="mt-4 flex flex-col gap-2">
        {chartData.map((item, idx) => (
          <div key={idx} className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="h-2 w-2 shrink-0 rounded-[3px]" style={{ background: item.color }} />
              <span className="text-[13px] text-[var(--text-sub)]">{item.name}</span>
            </div>
            <div className="flex items-center gap-3">
              <span className="font-mono text-[13px] tabular-nums text-[var(--text)]">{formatCurrency(item.value / 100)}</span>
              <span className="w-12 text-right font-mono text-[12px] tabular-nums text-[var(--text-sub)]">{item.percent.toFixed(1)}%</span>
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
};

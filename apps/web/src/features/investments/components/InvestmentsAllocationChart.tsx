"use client";

import { useState, useCallback, useMemo } from "react";
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from "recharts";
import { Card, CardHead } from "@/components/shared/Card";
import { ChartEmptyState } from "@/components/shared/ChartEmptyState";
import { PillSelect } from "@/components/shared/PillSelect";
import { formatCurrency } from "@/lib/utils/formatCurrency";
import type { InvestmentPortfolio } from "@/lib/types/investments.types";
import { pieAnim } from "@/lib/config/chartAnimation";
import { assetTypeColor, distinctColorsFor } from "@/lib/config/assetColors";

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

const ALL = "all";

type Props = { summary: InvestmentPortfolio };

export const InvestmentsAllocationChart = ({ summary }: Props) => {
  const [activeIndex, setActiveIndex]    = useState<number | undefined>(undefined);
  // Keyed by assetType, not by the class label: the label is localised display text and
  // the type is what the allocation is actually grouped by.
  const [selectedType, setSelectedType]  = useState<string>(ALL);

  const onMouseEnter = useCallback((_: any, i: number) => setActiveIndex(i), []);
  const onMouseLeave = useCallback(() => setActiveIndex(undefined), []);

  // One slice per asset type, carrying the same colour its badge has in the table.
  const classSlices = useMemo(
    () =>
      summary.allocations.map((a) => ({
        key:     a.assetType as string,
        name:    a.assetClass,
        value:   a.value,
        percent: a.percent,
        color:   assetTypeColor(a.assetType),
      })),
    [summary.allocations],
  );

  // Drilled into one type: every holding would share that type's single colour, so the
  // slices get their own palette, keyed by ticker so it survives a re-sort.
  const tickerSlices = useMemo(() => {
    if (selectedType === ALL) return null;

    const holdings = summary.investments.filter((inv) => inv.assetType === selectedType);
    const total    = holdings.reduce((s, i) => s + i.currentValue, 0);
    const colors   = distinctColorsFor(holdings.map((inv) => inv.ticker));

    return holdings.map((inv, idx) => ({
      key:     inv.ticker,
      name:    inv.ticker,
      value:   inv.currentValue,
      percent: total > 0 ? (inv.currentValue / total) * 100 : 0,
      color:   colors[idx],
    }));
  }, [selectedType, summary.investments]);

  const chartData    = tickerSlices ?? classSlices;
  const selectedName = classSlices.find((s) => s.key === selectedType)?.name;
  const isDrilled    = tickerSlices !== null;

  const centerValue = formatCurrency(
    (isDrilled ? chartData.reduce((s, t) => s + t.value, 0) : summary.currentValue) / 100,
  );
  const centerLabel = isDrilled ? selectedName ?? "" : "Investido";

  const classOptions = [
    { value: ALL, label: "Todas as classes" },
    ...classSlices.map((s) => ({ value: s.key, label: s.name })),
  ];

  const select = useCallback((type: string) => {
    setSelectedType(type);
    setActiveIndex(undefined);
  }, []);

  // Only the class-level slices lead anywhere — a ticker slice has nothing left to drill
  // into, so it stays inert rather than offering a click that does nothing.
  const drillTo = isDrilled ? undefined : (i: number) => select(chartData[i].key);

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
        title={isDrilled ? `Alocação · ${selectedName}` : "Alocação por classe"}
        subtitle={isDrilled ? "Distribuição por ticker" : "Clique em uma classe para detalhar"}
        right={<PillSelect options={classOptions} value={selectedType} onChange={select} />}
      />

      <div className="relative mt-1 w-full" style={{ height: 200 }}>
        <ResponsiveContainer width="100%" height="100%" minWidth={0}>
          <PieChart>
            <Pie
              {...pieAnim()}
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
              onClick={drillTo && ((_: unknown, i: number) => drillTo(i))}
              className={drillTo ? "cursor-pointer" : undefined}
            >
              {chartData.map((entry, idx) => (
                <Cell
                  key={entry.key}
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
        {chartData.map((item, idx) => {
          const Row = drillTo ? "button" : "div";
          return (
            <Row
              key={item.key}
              {...(drillTo
                ? {
                    type: "button" as const,
                    onClick: () => drillTo(idx),
                    onMouseEnter: () => setActiveIndex(idx),
                    onMouseLeave: () => setActiveIndex(undefined),
                  }
                : {})}
              className={[
                "-mx-1 flex items-center justify-between rounded-[9px] px-1 py-0.5 text-left transition-colors",
                drillTo ? "cursor-pointer hover:bg-[var(--surface2)]" : "",
              ].join(" ")}
            >
              <div className="flex items-center gap-2">
                <span className="h-2 w-2 shrink-0 rounded-[3px]" style={{ background: item.color }} />
                <span className="text-[13px] text-[var(--text-sub)]">{item.name}</span>
              </div>
              <div className="flex items-center gap-3">
                <span className="font-mono text-[13px] tabular-nums text-[var(--text)]">{formatCurrency(item.value / 100)}</span>
                <span className="w-12 text-right font-mono text-[12px] tabular-nums text-[var(--text-sub)]">{item.percent.toFixed(1)}%</span>
              </div>
            </Row>
          );
        })}
      </div>
    </Card>
  );
};

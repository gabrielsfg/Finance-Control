"use client";

import { useState, useCallback } from "react";
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Sector } from "recharts";
import { SectionHeader } from "@/components/shared/SectionHeader";
import { formatCurrency } from "@/lib/utils/formatCurrency";
import { formatDateMonth } from "@/lib/utils/formatDate";
import type { TopCategoryItem } from "@/lib/types/dashboard.types";

const CATEGORY_COLORS: Record<string, string> = {
  Alimentação: "#F5A623",
  Moradia: "#4A9EFF",
  Transporte: "#00C98D",
  Lazer: "#7C6FE0",
  Saúde: "#F25F5C",
  Educação: "#F5CE42",
  Investimentos: "#00D4A0",
};

const DEFAULT_COLOR = "#8A95A3";

const CustomTooltip = ({ active, payload }: any) => {
  if (!active || !payload?.length) return null;
  const { name, value, payload: entry } = payload[0];
  const color = entry?.color ?? DEFAULT_COLOR;
  return (
    <div className="border-border bg-surface rounded-lg border px-3 py-2 shadow-md">
      <p className="text-text mb-1 text-[13px] font-medium">{name}</p>
      <div className="flex items-center gap-1.5">
        <div className="h-2.5 w-2.5 rounded-[3px]" style={{ backgroundColor: color }} />
        <p className="font-money text-text-sub text-[13px]">{formatCurrency(value / 100)}</p>
      </div>
    </div>
  );
};

const renderActiveShape = (props: any) => {
  const { cx, cy, innerRadius, outerRadius, startAngle, endAngle, fill } = props;
  return (
    <Sector
      cx={cx}
      cy={cy}
      innerRadius={innerRadius}
      outerRadius={outerRadius + 8}
      startAngle={startAngle}
      endAngle={endAngle}
      fill={fill}
    />
  );
};

type Props = {
  categories: TopCategoryItem[];
};

export const CategoryDonutChart = ({ categories }: Props) => {
  const [activeIndex, setActiveIndex] = useState<number | undefined>(undefined);

  const data = categories.slice(0, 5).map((c) => ({
    name: c.categoryName,
    value: c.totalSpent,
    color: CATEGORY_COLORS[c.categoryName] ?? DEFAULT_COLOR,
  }));

  const onMouseEnter = useCallback((_: any, index: number) => setActiveIndex(index), []);
  const onMouseLeave = useCallback(() => setActiveIndex(undefined), []);

  return (
    <div className="border-border bg-surface flex h-full flex-col rounded-xl border p-5">
      <SectionHeader title="Gastos por Categoria" subtitle={formatDateMonth(new Date())} />

      <div className="w-full flex-1" style={{ minHeight: 160 }}>
        <ResponsiveContainer width="100%" height="100%" minWidth={0}>
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              innerRadius={45}
              outerRadius={70}
              paddingAngle={2}
              dataKey="value"
              strokeWidth={0}
              activeIndex={activeIndex}
              activeShape={renderActiveShape}
              onMouseEnter={onMouseEnter}
              onMouseLeave={onMouseLeave}
            >
              {data.map((entry) => (
                <Cell key={entry.name} fill={entry.color} />
              ))}
            </Pie>
            <Tooltip content={<CustomTooltip />} />
          </PieChart>
        </ResponsiveContainer>
      </div>

      <div className="mt-3 flex flex-col gap-1.5">
        {data.map((cat) => (
          <div key={cat.name} className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="h-2 w-2 rounded-[2px]" style={{ backgroundColor: cat.color }} />
              <span className="text-text-sub text-[13px]">{cat.name}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="h-2 w-2 rounded-[2px]" style={{ backgroundColor: cat.color }} />
              <span className="font-money text-text text-[13px]">
                {formatCurrency(cat.value / 100)}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

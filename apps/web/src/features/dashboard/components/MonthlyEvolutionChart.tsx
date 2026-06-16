"use client";

import { useQuery } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from "recharts";
import Link from "next/link";
import { formatCurrency, formatCurrencyCompact } from "@/lib/utils/formatCurrency";
import { SectionHeader } from "@/components/shared/SectionHeader";
import { ChartEmptyState } from "@/components/shared/ChartEmptyState";
import { analyticsApi } from "@/lib/api/analytics";

type IncomeExpenseItem = {
  month: number;
  year: number;
  label?: string;
  totalIncome: number;
  totalExpense: number;
};

const MONTH_LABELS = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"];

function getLast12MonthsRange() {
  const now = new Date();
  const end = new Date(now.getFullYear(), now.getMonth() + 1, 0);
  const start = new Date(now.getFullYear() - 1, now.getMonth() + 1, 1);
  const fmt = (d: Date) => d.toISOString().split("T")[0];
  return { startDate: fmt(start), finishDate: fmt(end) };
}

const fetchMonthlyEvolution = (): Promise<IncomeExpenseItem[]> => {
  const { startDate, finishDate } = getLast12MonthsRange();
  return analyticsApi.getIncomeExpense(startDate, finishDate);
};

const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="border-border bg-surface rounded-lg border px-3 py-2 shadow-md">
      <p className="text-text-muted mb-1.5 text-[11px]">{label}</p>
      {payload.map((entry: any) => (
        <p key={entry.name} className="font-money text-[12px]" style={{ color: entry.color }}>
          {entry.name}: {formatCurrency(entry.value / 100)}
        </p>
      ))}
    </div>
  );
};

export const MonthlyEvolutionChart = () => {
  const { data, isLoading } = useQuery({
    queryKey: ["monthly-evolution"],
    queryFn: fetchMonthlyEvolution,
    staleTime: 5 * 60 * 1000,
  });

  const chartData = data?.slice(-12).map((item) => ({
    label: item.label ?? MONTH_LABELS[item.month - 1],
    Receitas: item.totalIncome,
    Despesas: item.totalExpense,
  })) ?? [];

  return (
    <div className="border-[--border-color] bg-[--surface] flex h-full flex-col rounded-[20px] border p-[22px]">
      <div className="mb-4 flex items-center gap-[10px]">
        <h2 className="font-display text-[17px] font-bold tracking-[-0.01em] text-[--text]">Evolução Mensal</h2>
        <span className="font-mono text-[11px] text-[--text-sub]">últimos 12 meses</span>
        <Link href="/analytics" className="ml-auto font-mono text-[11px] tracking-[0.1em] uppercase text-[--brand-accent] hover:underline">
          Ver analytics
        </Link>
      </div>
      {isLoading ? (
        <div className="flex flex-1 items-center justify-center">
          <Loader2 size={18} className="text-green animate-spin" />
        </div>
      ) : chartData.length === 0 ? (
        <ChartEmptyState message="Nenhuma movimentação no período" />
      ) : (
        <>
          <div className="w-full flex-1" style={{ minHeight: 200 }}>
            <ResponsiveContainer width="100%" height="100%" minWidth={0}>
              <AreaChart data={chartData} margin={{ top: 4, right: 4, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorReceitas" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="var(--green)" stopOpacity={0.15} />
                    <stop offset="95%" stopColor="var(--green)" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="colorDespesas" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="var(--red)" stopOpacity={0.1} />
                    <stop offset="95%" stopColor="var(--red)" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid stroke="var(--border-chart)" />
                <XAxis
                  dataKey="label"
                  tick={{ fill: "var(--text-muted)", fontSize: 12, fontFamily: "DM Sans" }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  tick={{ fill: "var(--text-muted)", fontSize: 12, fontFamily: "JetBrains Mono" }}
                  axisLine={false}
                  tickLine={false}
                  tickFormatter={(v) => formatCurrencyCompact(v / 100)}
                  width={70}
                />
                <Tooltip content={<CustomTooltip />} />
                <Area
                  type="monotone"
                  dataKey="Receitas"
                  stroke="var(--green)"
                  strokeWidth={2}
                  fill="url(#colorReceitas)"
                  dot={{ r: 3, fill: "var(--green)" }}
                  activeDot={{ r: 5 }}
                />
                <Area
                  type="monotone"
                  dataKey="Despesas"
                  stroke="var(--red)"
                  strokeWidth={2}
                  fill="url(#colorDespesas)"
                  dot={{ r: 3, fill: "var(--red)" }}
                  activeDot={{ r: 5 }}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
          <div className="mt-3 flex gap-4">
            <div className="flex items-center gap-1.5">
              <div className="bg-green h-2.5 w-2.5 rounded-[2px]" />
              <span className="text-text-muted text-[12px]">Receitas</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="bg-red h-2.5 w-2.5 rounded-[2px]" />
              <span className="text-text-muted text-[12px]">Despesas</span>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

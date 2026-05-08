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
import { MOCK_ANALYTICS_MONTHLY } from "@/lib/mocks";

type IncomeExpenseItem = {
  month: number;
  year: number;
  totalIncome: number;
  totalExpense: number;
};

const MONTH_LABELS = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"];

const fetchMonthlyEvolution = (): Promise<IncomeExpenseItem[]> =>
  Promise.resolve(MOCK_ANALYTICS_MONTHLY as IncomeExpenseItem[]);

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
    <div className="border-border bg-surface flex h-full flex-col rounded-xl border p-5">
      <div className="mb-4 flex items-start justify-between">
        <div>
          <h2 className="font-display font-700 text-text text-[18px] tracking-tight">Evolução Mensal</h2>
          <p className="text-text-muted mt-0.5 text-[13px]">Receitas vs. Despesas (últimos 12 meses)</p>
        </div>
        <Link href="/analytics" className="font-500 text-text-sub hover:text-green text-[12px] transition-colors">
          Ver analytics →
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
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
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

"use client";

import { useQuery } from "@tanstack/react-query";
import { format, subMonths, startOfMonth, endOfMonth } from "date-fns";
import { Loader2 } from "lucide-react";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from "recharts";
import { api } from "@/lib/api/axios";
import { formatCurrency, formatCurrencyCompact } from "@/lib/utils/formatCurrency";
import { SectionHeader } from "@/components/shared/SectionHeader";
import { ChartEmptyState } from "@/components/shared/ChartEmptyState";

type IncomeExpenseItem = {
  month: number;
  year: number;
  totalIncome: number;
  totalExpense: number;
};

const MONTH_LABELS = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"];

const fetchMonthlyEvolution = async (): Promise<IncomeExpenseItem[]> => {
  const now = new Date();
  const startDate = format(startOfMonth(subMonths(now, 6)), "yyyy-MM-dd");
  const finishDate = format(endOfMonth(now), "yyyy-MM-dd");
  const res = await api.get<IncomeExpenseItem[]>("/analytics/income-expense", {
    params: { startDate, finishDate },
  });
  return res.data;
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

  const chartData = data?.map((item) => ({
    label: MONTH_LABELS[item.month - 1],
    Receitas: item.totalIncome,
    Despesas: item.totalExpense,
  })) ?? [];

  return (
    <div className="border-border bg-surface flex h-full flex-col rounded-xl border p-5">
      <SectionHeader
        title="Evolução Mensal"
        subtitle="Receitas vs. Despesas (últimos 7 meses)"
      />
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
              <LineChart data={chartData} margin={{ top: 4, right: 4, left: 0, bottom: 0 }}>
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
                <Line
                  type="monotone"
                  dataKey="Receitas"
                  stroke="var(--green)"
                  strokeWidth={2}
                  dot={{ r: 3, fill: "var(--green)" }}
                  activeDot={{ r: 5 }}
                />
                <Line
                  type="monotone"
                  dataKey="Despesas"
                  stroke="var(--red)"
                  strokeWidth={2}
                  dot={{ r: 3, fill: "var(--red)" }}
                  activeDot={{ r: 5 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
          <div className="mt-3 flex gap-4">
            <div className="flex items-center gap-1.5">
              <div className="bg-green h-2.5 w-2.5 rounded-[2px]" />
              <span className="text-text-muted text-[13px]">Receitas</span>
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

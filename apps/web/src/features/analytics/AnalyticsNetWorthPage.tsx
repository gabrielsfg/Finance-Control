"use client";

import { Loader2 } from "lucide-react";
import { AnalyticsHeader } from "./components/AnalyticsHeader";
import { AnalyticsNetWorthChart } from "./net-worth/components/AnalyticsNetWorthChart";
import { BalanceEvolutionChart } from "./expenses/components/BalanceEvolutionChart";
import {
  useAnalyticsMonthly,
  useAnalyticsNetWorth,
  useBalanceEvolution,
} from "./hooks/useAnalytics";
import { useAnalyticsFilter } from "./AnalyticsFilterContext";

export function AnalyticsNetWorthPage() {
  const { start, finish, activeTagIds } = useAnalyticsFilter();

  const netWorth = useAnalyticsNetWorth(start, finish);
  const monthly = useAnalyticsMonthly(start, finish, activeTagIds);
  const balanceEvolution = useBalanceEvolution(start, finish);

  if (netWorth.isLoading) {
    return (
      <div className="flex h-full items-center justify-center">
        <Loader2 size={24} className="text-green animate-spin" />
      </div>
    );
  }

  const pts = netWorth.data ?? [];
  const last = pts[pts.length - 1];
  const prev = pts[pts.length - 2];
  const monthGrowth = last && prev && prev.netWorth
    ? ((last.netWorth - prev.netWorth) / Math.abs(prev.netWorth)) * 100
    : null;
  const first = pts[0];
  const yearGrowth = last && first && first.netWorth
    ? ((last.netWorth - first.netWorth) / Math.abs(first.netWorth)) * 100
    : null;
  const mo = monthly.data ?? [];
  const totalInc = mo.reduce((s, m) => s + (m.totalIncome ?? 0), 0);
  const totalExp = mo.reduce((s, m) => s + (m.totalExpense ?? 0), 0);
  const sr = totalInc > 0 ? ((totalInc - totalExp) / totalInc) * 100 : null;

  return (
    <div className="flex flex-col gap-5">
      <AnalyticsHeader title="Patrimônio" />

      <div className="flex flex-col gap-4">
        {/* 3 KPI cards ABOVE the chart */}
        <div className="grid grid-cols-3 gap-3">
          {[
            { label: "Crescimento no mês", value: monthGrowth !== null ? `${monthGrowth >= 0 ? "+" : ""}${monthGrowth.toFixed(1)}%` : "—", color: monthGrowth !== null && monthGrowth >= 0 ? "text-green" : "text-red" },
            { label: "Crescimento em 2026", value: yearGrowth  !== null ? `${yearGrowth  >= 0 ? "+" : ""}${yearGrowth.toFixed(1)}%`  : "—", color: yearGrowth  !== null && yearGrowth  >= 0 ? "text-green" : "text-red" },
            { label: "Taxa de Poupança", value: sr !== null ? `${sr.toFixed(1)}%` : "—", color: "text-blue" },
          ].map(({ label, value, color }) => (
            <div key={label} className="border-border bg-surface rounded-xl border p-4">
              <p className="text-text-muted text-[12px]">{label}</p>
              <p className={`font-money font-600 mt-1 text-[22px] ${color}`}>{value}</p>
            </div>
          ))}
        </div>
        <AnalyticsNetWorthChart data={pts} />
        <BalanceEvolutionChart data={balanceEvolution.data ?? []} />
      </div>
    </div>
  );
}

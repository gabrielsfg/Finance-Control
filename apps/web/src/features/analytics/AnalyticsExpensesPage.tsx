"use client";

import { useState } from "react";
import { Loader2 } from "lucide-react";
import { AnalyticsHeader } from "./components/AnalyticsHeader";
import { AnalyticsSummaryCards } from "./expenses/components/AnalyticsSummaryCards";
import { AnalyticsTrendChart } from "./expenses/components/AnalyticsTrendChart";
import { AnalyticsCategoryBreakdown } from "./expenses/components/AnalyticsCategoryBreakdown";
import { AnalyticsCategoryEvolutionChart } from "./expenses/components/AnalyticsCategoryEvolutionChart";
import { AnalyticsSpendCalendar } from "./expenses/components/AnalyticsSpendCalendar";
import {
  useAnalyticsSummary,
  useAnalyticsMonthly,
  useAnalyticsHeatmap,
  useAnalyticsCategoryEvolution,
} from "./hooks/useAnalytics";
import { useAnalyticsFilter } from "./AnalyticsFilterContext";

export function AnalyticsExpensesPage() {
  const { start, finish, activeTagIds } = useAnalyticsFilter();

  const today = new Date();
  const [calendarMonth, setCalendarMonth] = useState(
    `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}`
  );
  const calendarMonthStart = calendarMonth + "-01";
  const [cmY, cmM] = calendarMonth.split("-").map(Number);
  const calendarEnd = new Date(cmY, cmM, 0).toISOString().slice(0, 10);

  function shiftCalendarMonth(delta: number) {
    const [y, m] = calendarMonth.split("-").map(Number);
    const d = new Date(y, m - 1 + delta, 1);
    setCalendarMonth(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`);
  }

  const summary = useAnalyticsSummary(start, finish, activeTagIds);
  const monthly = useAnalyticsMonthly(start, finish, activeTagIds);
  const heatmap = useAnalyticsHeatmap(calendarMonthStart, calendarEnd, activeTagIds);
  const categoryIds = summary.data?.categoryBreakdown.items.map((c) => c.categoryId) ?? [];
  const catEvol = useAnalyticsCategoryEvolution(start, finish, categoryIds, activeTagIds);

  if (summary.isLoading || monthly.isLoading) {
    return (
      <div className="flex h-full items-center justify-center">
        <Loader2 size={24} className="text-green animate-spin" />
      </div>
    );
  }

  if (summary.isError || monthly.isError || !summary.data || !monthly.data) {
    return (
      <div className="flex h-full items-center justify-center">
        <p className="text-text-sub text-[14px]">Erro ao carregar analytics. Tente novamente.</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-5">
      <AnalyticsHeader title="Gastos" />

      <AnalyticsSummaryCards summary={summary.data} />

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-[1fr_380px] lg:items-stretch">
        <AnalyticsTrendChart data={monthly.data} />
        <AnalyticsCategoryBreakdown data={summary.data.categoryBreakdown} />
      </div>

      <AnalyticsCategoryEvolutionChart
        data={catEvol.data ?? []}
        categories={summary.data.categoryBreakdown.items}
      />

      <AnalyticsSpendCalendar
        data={heatmap.data ?? []}
        month={calendarMonth}
        onPrev={() => shiftCalendarMonth(-1)}
        onNext={() => shiftCalendarMonth(1)}
      />
    </div>
  );
}

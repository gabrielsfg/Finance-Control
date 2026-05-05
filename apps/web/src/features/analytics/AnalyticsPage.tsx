"use client";

import { useState } from "react";
import { Loader2 } from "lucide-react";
import { AnalyticsSummaryCards } from "@/features/analytics/expenses/components/AnalyticsSummaryCards";
import { AnalyticsTrendChart } from "@/features/analytics/expenses/components/AnalyticsTrendChart";
import { AnalyticsCategoryBreakdown } from "@/features/analytics/expenses/components/AnalyticsCategoryBreakdown";
import { AnalyticsCategoryEvolutionChart } from "@/features/analytics/expenses/components/AnalyticsCategoryEvolutionChart";
import { AnalyticsSpendCalendar } from "@/features/analytics/expenses/components/AnalyticsSpendCalendar";
import { AnalyticsNetWorthChart } from "@/features/analytics/net-worth/components/AnalyticsNetWorthChart";
import { InvestmentOverviewTab } from "@/features/analytics/investments/overview/components/InvestmentOverviewTab";
import { AnalyticsInvestmentProfitabilityTab } from "@/features/analytics/investments/profitability/components/AnalyticsInvestmentProfitabilityTab";
import { InvestmentLaunchesTab } from "@/features/analytics/investments/launches/components/InvestmentLaunchesTab";
import { ProjectedNetWorthChart } from "@/features/analytics/projections/components/ProjectedNetWorthChart";
import { PassiveIncomeChart } from "@/features/analytics/projections/components/PassiveIncomeChart";
import { SavingsRateChart } from "@/features/analytics/projections/components/SavingsRateChart";
import { ProjectedSpendingHeatmap } from "@/features/analytics/projections/components/ProjectedSpendingHeatmap";
import { FinancialTimelineChart } from "@/features/analytics/projections/components/FinancialTimelineChart";
import { PortfolioCompositionChart } from "@/features/analytics/projections/components/PortfolioCompositionChart";
import { RealNetWorthChart } from "@/features/analytics/projections/components/RealNetWorthChart";
import { BalanceEvolutionChart } from "@/features/analytics/expenses/components/BalanceEvolutionChart";
import { BalanceProjectionChart } from "@/features/analytics/projections/components/BalanceProjectionChart";
import { FutureCommitmentsChart } from "@/features/analytics/projections/components/FutureCommitmentsChart";
import { CommitmentsImpactChart } from "@/features/analytics/projections/components/CommitmentsImpactChart";
import { AnalyticsFilters } from "@/features/analytics/components/AnalyticsFilters";
import {
  useAnalyticsSummary,
  useAnalyticsMonthly,
  useAnalyticsHeatmap,
  useAnalyticsCategoryEvolution,
  useAnalyticsNetWorth,
  useNetWorthProjection,
  useCategoryProjection,
  usePassiveIncomeProjection,
  useFinancialMilestones,
  usePortfolioCompositionProjection,
  useRealNetWorth,
  useBalanceEvolution,
  useFutureCommitments,
  useBalanceProjection,
  useCommitmentsImpact,
} from "@/features/analytics/hooks/useAnalytics";
import { cn } from "@/lib/utils";
import type { AnalyticsFilter } from "./types/filters.types";
import { defaultFilter, buildDateRange } from "./utils/filterDates";

type Tab = "gastos" | "patrimonio" | "investimentos" | "projecoes";
type InvestmentSubTab = "geral" | "rentabilidade" | "lancamentos";

const TABS: { id: Tab; label: string }[] = [
  { id: "gastos",        label: "Gastos" },
  { id: "patrimonio",    label: "Patrimônio" },
  { id: "investimentos", label: "Investimentos" },
  { id: "projecoes",     label: "Projeções" },
];

const INVESTMENT_SUBTABS: { id: InvestmentSubTab; label: string }[] = [
  { id: "geral",         label: "Geral" },
  { id: "rentabilidade", label: "Rentabilidade" },
  { id: "lancamentos",   label: "Lançamentos" },
];

export function AnalyticsPage() {
  const [activeTab, setActiveTab] = useState<Tab>("gastos");
  const [investmentSubTab, setInvestmentSubTab] = useState<InvestmentSubTab>("geral");
  const [filter, setFilter] = useState<AnalyticsFilter>(defaultFilter());

  const { start, finish } = buildDateRange(filter);

  // For the heatmap calendar: when range spans multiple months, show the last
  // month of the selection. When it's a single month, show that month.
  const calendarMonthStart = finish.slice(0, 7) + "-01";

  const summary           = useAnalyticsSummary(start, finish);
  const monthly           = useAnalyticsMonthly(start, finish);
  const heatmap           = useAnalyticsHeatmap(calendarMonthStart, finish);
  const categoryIds = summary.data?.categoryBreakdown.items.map((c) => c.categoryId) ?? [];
  const catEvol           = useAnalyticsCategoryEvolution(start, finish, categoryIds);
  const netWorth          = useAnalyticsNetWorth(start, finish);
  const netWorthProjection      = useNetWorthProjection(24);
  const categoryProjection      = useCategoryProjection(3);
  const passiveIncome           = usePassiveIncomeProjection(24);
  const milestones              = useFinancialMilestones();
  const portfolioComposition    = usePortfolioCompositionProjection(12);
  const realNetWorth            = useRealNetWorth();
  const balanceEvolution        = useBalanceEvolution(start, finish);
  const futureCommitments       = useFutureCommitments(6);
  const balanceProjection       = useBalanceProjection(30);
  const commitmentsImpact       = useCommitmentsImpact(6);

  const isLoading = summary.isLoading || monthly.isLoading;
  const isError   = summary.isError   || monthly.isError;

  if (isLoading) {
    return (
      <div className="flex h-full items-center justify-center">
        <Loader2 size={24} className="text-green animate-spin" />
      </div>
    );
  }

  if (isError || !summary.data || !monthly.data) {
    return (
      <div className="flex h-full items-center justify-center">
        <p className="text-text-sub text-[14px]">Erro ao carregar analytics. Tente novamente.</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-5">
      {/* Header: title + filters */}
      <div className="flex items-start justify-between gap-4">
        <h1 className="font-display font-700 text-text text-[22px] tracking-tight">Analytics</h1>
        <AnalyticsFilters
          filter={filter}
          onChange={setFilter}
          mode={
            activeTab === "gastos" || activeTab === "patrimonio"
              ? "expenses"
              : activeTab === "investimentos"
                ? "investments"
                : "none"
          }
        />
      </div>

      {/* Tab bar */}
      <div className="border-border flex gap-1 rounded-xl border bg-surface p-1">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={cn(
              "flex-1 rounded-[9px] py-1.5 text-[13px] font-medium transition-all",
              activeTab === tab.id
                ? "bg-surface2 text-text shadow-sm"
                : "text-text-muted hover:text-text-sub",
            )}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab: Gastos */}
      {activeTab === "gastos" && (
        <>
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
            month={calendarMonthStart.slice(0, 7)}
          />
        </>
      )}

      {/* Tab: Patrimônio */}
      {activeTab === "patrimonio" && (
        <div className="flex flex-col gap-4">
          <AnalyticsNetWorthChart data={netWorth.data ?? []} />
          <BalanceEvolutionChart data={balanceEvolution.data ?? []} />
        </div>
      )}

      {/* Tab: Investimentos */}
      {activeTab === "investimentos" && (
        <div className="flex flex-col gap-5">
          <div className="border-border flex gap-1 rounded-xl border bg-surface p-1">
            {INVESTMENT_SUBTABS.map((sub) => (
              <button
                key={sub.id}
                onClick={() => setInvestmentSubTab(sub.id)}
                className={cn(
                  "flex-1 rounded-[9px] py-1.5 text-[13px] font-medium transition-all",
                  investmentSubTab === sub.id
                    ? "bg-surface2 text-text shadow-sm"
                    : "text-text-muted hover:text-text-sub",
                )}
              >
                {sub.label}
              </button>
            ))}
          </div>

          {investmentSubTab === "geral" && <InvestmentOverviewTab startDate={start} finishDate={finish} />}
          {investmentSubTab === "rentabilidade" && <AnalyticsInvestmentProfitabilityTab startDate={start} finishDate={finish} />}
          {investmentSubTab === "lancamentos" && <InvestmentLaunchesTab startDate={start} finishDate={finish} />}
        </div>
      )}

      {/* Tab: Projeções */}
      {activeTab === "projecoes" && (
        <div className="flex flex-col gap-5">
          <ProjectedNetWorthChart data={netWorthProjection.data ?? { historical: [], projected: [], currentNetWorth: 0, monthlyAvgGrowth: 0, monthsUntilZero: null, monthsUntilTarget: null, targetAmount: null }} />
          <PortfolioCompositionChart data={portfolioComposition.data ?? { data: [], assetClasses: [] }} />
          <RealNetWorthChart data={realNetWorth.data ?? { points: [], totalNominalGrowthPct: 0, totalRealGrowthPct: 0, totalInflationPct: 0 }} />
          <PassiveIncomeChart data={passiveIncome.data ?? { history: [], projected: [], currentMonthlyPassiveIncome: 0, projectedAnnualPassiveIncome: 0, monthlyLivingCost: 0, coveragePercent: 0, monthsUntilFinancialFreedom: null }} />
          <SavingsRateChart data={monthly.data ?? []} />
          {categoryProjection.data && categoryProjection.data.length > 0 && (
            <ProjectedSpendingHeatmap data={categoryProjection.data} />
          )}
          <FinancialTimelineChart data={milestones.data ?? { timeline: [], milestones: [] }} />
          <BalanceProjectionChart data={balanceProjection.data ?? { actual: [], projected: [], projectedBalance: 0, currentBalance: 0, dailyAvgIncome: 0, dailyAvgExpense: 0 }} />
          <FutureCommitmentsChart data={futureCommitments.data ?? []} />
          <CommitmentsImpactChart data={commitmentsImpact.data ?? { months: [] }} />
        </div>
      )}
    </div>
  );
}

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
import { AnalyticsProjectionsChart } from "@/features/analytics/projections/components/AnalyticsProjectionsChart";
import {
  useAnalyticsSummary,
  useAnalyticsMonthly,
  useAnalyticsHeatmap,
  useAnalyticsCategoryEvolution,
  useAnalyticsNetWorth,
  useAnalyticsProjections,
} from "@/features/analytics/hooks/useAnalytics";
import { formatDateMonth } from "@/lib/utils/formatDate";
import { cn } from "@/lib/utils";

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

function getDateRange() {
  const today = new Date();
  const finish = today.toISOString().slice(0, 10);
  const start = new Date(today.getFullYear(), today.getMonth() - 6, 1).toISOString().slice(0, 10);
  return { start, finish };
}

export function AnalyticsPage() {
  const [activeTab, setActiveTab] = useState<Tab>("gastos");
  const [investmentSubTab, setInvestmentSubTab] = useState<InvestmentSubTab>("geral");

  const { start, finish } = getDateRange();
  const currentMonth = formatDateMonth(new Date());

  const summary     = useAnalyticsSummary();
  const monthly     = useAnalyticsMonthly(start, finish);
  const heatmap     = useAnalyticsHeatmap(finish.slice(0, 7) + "-01", finish);
  const catEvol     = useAnalyticsCategoryEvolution(start, finish, []);
  const netWorth    = useAnalyticsNetWorth(start, finish);
  const projections = useAnalyticsProjections();

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
      <div>
        <h1 className="font-display font-700 text-text text-[22px] tracking-tight">Analytics</h1>
        <p className="text-text-muted mt-0.5 text-[13px] capitalize">{currentMonth}</p>
      </div>

      {/* Tab bar — before everything else */}
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
            categories={summary.data.categoryBreakdown}
          />

          <AnalyticsSpendCalendar data={heatmap.data ?? []} month={currentMonth} />
        </>
      )}

      {/* Tab: Patrimônio */}
      {activeTab === "patrimonio" && (
        <AnalyticsNetWorthChart data={netWorth.data ?? []} />
      )}

      {/* Tab: Investimentos */}
      {activeTab === "investimentos" && (
        <div className="flex flex-col gap-5">
          {/* Sub-abas */}
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

          {investmentSubTab === "geral" && <InvestmentOverviewTab />}
          {investmentSubTab === "rentabilidade" && <AnalyticsInvestmentProfitabilityTab />}
          {investmentSubTab === "lancamentos" && <InvestmentLaunchesTab />}
        </div>
      )}

      {/* Tab: Projeções */}
      {activeTab === "projecoes" && (
        <AnalyticsProjectionsChart data={projections.data ?? []} />
      )}
    </div>
  );
}

"use client";

import { useState, useMemo } from "react";
import { Loader2, X } from "lucide-react";
import { usePageFilter } from "@/lib/hooks/usePageHeader";
import { useAccounts } from "@/features/accounts/hooks/useAccounts";
import { useSubCategories } from "@/features/transactions/hooks/useSubCategories";
import { getCategoryColor } from "@/lib/config/categoryColors";
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
import { TabChips } from "@/components/shared/TabChips";
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
import type { AnalyticsFilter } from "./types/filters.types";
import { defaultFilter, buildDateRange, presetLabel } from "./utils/filterDates";

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

const TX_TYPE_LABELS: Record<string, string> = {
  expense: "Despesas", income: "Receitas", recurring: "Recorrentes", installment: "Parceladas",
};

const ASSET_CLASS_LABELS: Record<string, string> = {
  "Renda Fixa": "Renda Fixa", "Tesouro Direto": "Tesouro Direto",
  "Renda Variável": "Ações", "FII": "FII", "Internacional": "Internacional", "Cripto": "Cripto",
};

export function AnalyticsPage() {
  const [activeTab, setActiveTab] = useState<Tab>("gastos");
  const [investmentSubTab, setInvestmentSubTab] = useState<InvestmentSubTab>("geral");
  const [filter, setFilter] = useState<AnalyticsFilter>(defaultFilter());

  const { data: accountsRaw = [] } = useAccounts();
  const { data: subcatsRaw  = [] } = useSubCategories();

  const metaAccounts = useMemo(() => accountsRaw.map(a => ({ id: a.id, name: a.name })), [accountsRaw]);
  const metaCategories = useMemo(() =>
    Array.from(
      new Map(subcatsRaw.map(s => [s.categoryId, {
        id: s.categoryId,
        name: s.categoryName,
        color: getCategoryColor(s.categoryColor, s.categoryName),
      }])).values()
    ), [subcatsRaw]);

  const filterMode = activeTab === "gastos" || activeTab === "patrimonio"
    ? "expenses"
    : activeTab === "investimentos"
      ? "investments"
      : "none";

  type Chip = { id: string; label: string; color?: string; onRemove: () => void };
  const activeChips = useMemo<Chip[]>(() => {
    const chips: Chip[] = [];

    if (filter.preset !== "last-6-months") {
      chips.push({
        id: "preset",
        label: presetLabel(filter.preset, filter.customYear),
        onRemove: () => setFilter(f => ({ ...f, preset: "last-6-months" })),
      });
    }

    if (filterMode === "expenses") {
      if (filter.transactionType !== "all") {
        chips.push({
          id: "txtype",
          label: TX_TYPE_LABELS[filter.transactionType] ?? filter.transactionType,
          onRemove: () => setFilter(f => ({ ...f, transactionType: "all" })),
        });
      }
      for (const id of filter.categoryIds) {
        const cat = metaCategories.find(c => c.id === id);
        if (cat) chips.push({
          id: `cat-${id}`,
          label: cat.name,
          color: cat.color,
          onRemove: () => setFilter(f => ({ ...f, categoryIds: f.categoryIds.filter(x => x !== id) })),
        });
      }
    }

    if (filterMode === "investments" && filter.assetClass !== "all") {
      chips.push({
        id: "assetclass",
        label: ASSET_CLASS_LABELS[filter.assetClass] ?? filter.assetClass,
        onRemove: () => setFilter(f => ({ ...f, assetClass: "all" })),
      });
    }

    if (filterMode !== "none") {
      for (const id of filter.accountIds) {
        const acc = metaAccounts.find(a => a.id === id);
        if (acc) chips.push({
          id: `acc-${id}`,
          label: acc.name,
          onRemove: () => setFilter(f => ({ ...f, accountIds: f.accountIds.filter(x => x !== id) })),
        });
      }
    }

    return chips;
  }, [filter, filterMode, metaCategories, metaAccounts]);

  usePageFilter(
    <AnalyticsFilters filter={filter} onChange={setFilter} mode={filterMode} />,
  );

  const { start, finish } = buildDateRange(filter);

  const today = new Date();
  const [calendarMonth, setCalendarMonth] = useState(
    `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}`
  );
  const calendarMonthStart = calendarMonth + "-01";

  function shiftCalendarMonth(delta: number) {
    const [y, m] = calendarMonth.split("-").map(Number);
    const d = new Date(y, m - 1 + delta, 1);
    setCalendarMonth(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`);
  }

  const summary           = useAnalyticsSummary(start, finish);
  const monthly           = useAnalyticsMonthly(start, finish);
  const [cmY, cmM] = calendarMonth.split("-").map(Number);
  const calendarEnd = new Date(cmY, cmM, 0).toISOString().slice(0, 10);
  const heatmap           = useAnalyticsHeatmap(calendarMonthStart, calendarEnd);
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
      <div>
        <h1 className="font-display font-700 text-text text-[22px] tracking-tight">Analytics</h1>
        {activeChips.length > 0 && (
          <div className="mt-2 flex flex-wrap gap-2">
            {activeChips.map(chip => (
              <div
                key={chip.id}
                className="border-border bg-surface2 flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[12px]"
              >
                {chip.color && (
                  <span className="h-2 w-2 shrink-0 rounded-full" style={{ backgroundColor: chip.color }} />
                )}
                <span className="text-text-sub">{chip.label}</span>
                <button
                  onClick={chip.onRemove}
                  className="text-text-muted hover:text-red ml-0.5 transition-colors"
                >
                  <X size={11} />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Tab bar */}
      <TabChips items={TABS} value={activeTab} onChange={setActiveTab} />

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
            month={calendarMonth}
            onPrev={() => shiftCalendarMonth(-1)}
            onNext={() => shiftCalendarMonth(1)}
          />
        </>
      )}

      {/* Tab: Patrimônio */}
      {activeTab === "patrimonio" && (
        <div className="flex flex-col gap-4">
          {/* 3 KPI cards ABOVE the chart */}
          {(() => {
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
              <div className="grid grid-cols-3 gap-3">
                {[
                  { label: "Crescimento no mês",   value: monthGrowth !== null ? `${monthGrowth >= 0 ? "+" : ""}${monthGrowth.toFixed(1)}%` : "—", color: monthGrowth !== null && monthGrowth >= 0 ? "text-green" : "text-red" },
                  { label: "Crescimento em 2026",   value: yearGrowth  !== null ? `${yearGrowth  >= 0 ? "+" : ""}${yearGrowth.toFixed(1)}%`  : "—", color: yearGrowth  !== null && yearGrowth  >= 0 ? "text-green" : "text-red" },
                  { label: "Taxa de Poupança",       value: sr          !== null ? `${sr.toFixed(1)}%` : "—", color: "text-blue" },
                ].map(({ label, value, color }) => (
                  <div key={label} className="border-border bg-surface rounded-xl border p-4">
                    <p className="text-text-muted text-[12px]">{label}</p>
                    <p className={`font-money font-600 mt-1 text-[22px] ${color}`}>{value}</p>
                  </div>
                ))}
              </div>
            );
          })()}
          <AnalyticsNetWorthChart data={netWorth.data ?? []} />
          <BalanceEvolutionChart data={balanceEvolution.data ?? []} />
        </div>
      )}

      {/* Tab: Investimentos */}
      {activeTab === "investimentos" && (
        <div className="flex flex-col gap-5">
          <TabChips
            items={INVESTMENT_SUBTABS}
            value={investmentSubTab}
            onChange={setInvestmentSubTab}
            size="sm"
          />

          {investmentSubTab === "geral" && <InvestmentOverviewTab startDate={start} finishDate={finish} />}
          {investmentSubTab === "rentabilidade" && <AnalyticsInvestmentProfitabilityTab startDate={start} finishDate={finish} />}
          {investmentSubTab === "lancamentos" && <InvestmentLaunchesTab startDate={start} finishDate={finish} />}
        </div>
      )}

      {/* Tab: Projeções */}
      {activeTab === "projecoes" && (
        <div className="flex flex-col gap-5">
          {/* 4 KPI cards */}
          {(() => {
            const bp = balanceProjection.data;
            const fw = futureCommitments.data ?? [];
            const nw = netWorthProjection.data;
            const mo = monthly.data ?? [];
            const totalInc = mo.reduce((s, m) => s + (m.totalIncome ?? 0), 0);
            const totalExp = mo.reduce((s, m) => s + (m.totalExpense ?? 0), 0);
            const annualSavingsGoal = totalInc > 0 ? (totalInc - totalExp) : 0;
            const nextCommitments  = fw.slice(0, 3).reduce((s, c: any) => s + (c.totalAmount ?? 0), 0);
            const projectedIn12m   = nw?.projected?.slice(-1)[0]?.netWorth ?? 0;

            return (
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                {[
                  { label: "Saldo proj. fim do mês", value: bp ? `${bp.projectedBalance < 0 ? "-" : ""}${(Math.abs(bp.projectedBalance) / 100).toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}` : "—", color: bp && bp.projectedBalance < 0 ? "text-red" : "text-text" },
                  { label: "Próx. compromissos",     value: nextCommitments > 0 ? `${(nextCommitments / 100).toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}` : "—", color: "text-orange" },
                  { label: "Patrimônio em 12m",      value: projectedIn12m > 0 ? `${(projectedIn12m / 100).toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}` : "—", color: "text-blue" },
                  { label: "Meta de poupança anual", value: annualSavingsGoal > 0 ? `${(annualSavingsGoal / 100).toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}` : "—", color: "text-purple" },
                ].map(({ label, value, color }) => (
                  <div key={label} className="border-border bg-surface rounded-xl border p-4">
                    <p className="text-text-muted text-[11px] uppercase tracking-[0.05em]">{label}</p>
                    <p className={`font-money font-600 mt-2 text-[18px] leading-none ${color}`}>{value}</p>
                  </div>
                ))}
              </div>
            );
          })()}

          {/* Milestones full-width */}
          <FinancialTimelineChart data={milestones.data ?? { timeline: [], milestones: [] }} />

          {/* Grid 2 colunas com os gráficos */}
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            <ProjectedNetWorthChart data={netWorthProjection.data ?? { historical: [], projected: [], currentNetWorth: 0, monthlyAvgGrowth: 0, monthsUntilZero: null, monthsUntilTarget: null, targetAmount: null }} />
            <RealNetWorthChart data={realNetWorth.data ?? { points: [], totalNominalGrowthPct: 0, totalRealGrowthPct: 0, totalInflationPct: 0 }} />
            <PassiveIncomeChart data={passiveIncome.data ?? { history: [], projected: [], currentMonthlyPassiveIncome: 0, projectedAnnualPassiveIncome: 0, monthlyLivingCost: 0, coveragePercent: 0, monthsUntilFinancialFreedom: null }} />
            <SavingsRateChart data={monthly.data ?? []} />
            <BalanceProjectionChart data={balanceProjection.data ?? { actual: [], projected: [], projectedBalance: 0, currentBalance: 0, dailyAvgIncome: 0, dailyAvgExpense: 0 }} />
            <PortfolioCompositionChart data={portfolioComposition.data ?? { data: [], assetClasses: [] }} />
          </div>

          {/* Full-width charts */}
          {categoryProjection.data && categoryProjection.data.length > 0 && (
            <ProjectedSpendingHeatmap data={categoryProjection.data} />
          )}
          <FutureCommitmentsChart data={futureCommitments.data ?? []} />
          <CommitmentsImpactChart data={commitmentsImpact.data ?? { currentBalance: 0, months: [] }} />
        </div>
      )}
    </div>
  );
}

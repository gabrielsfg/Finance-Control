"use client";

import { AnalyticsHeader } from "./components/AnalyticsHeader";
import { ProjectedNetWorthChart } from "./projections/components/ProjectedNetWorthChart";
import { PassiveIncomeChart } from "./projections/components/PassiveIncomeChart";
import { SavingsRateChart } from "./projections/components/SavingsRateChart";
import { ProjectedSpendingHeatmap } from "./projections/components/ProjectedSpendingHeatmap";
import { FinancialTimelineChart } from "./projections/components/FinancialTimelineChart";
import { PortfolioCompositionChart } from "./projections/components/PortfolioCompositionChart";
import { RealNetWorthChart } from "./projections/components/RealNetWorthChart";
import { BalanceProjectionChart } from "./projections/components/BalanceProjectionChart";
import { FutureCommitmentsChart } from "./projections/components/FutureCommitmentsChart";
import { CommitmentsImpactChart } from "./projections/components/CommitmentsImpactChart";
import {
  useAnalyticsMonthly,
  useNetWorthProjection,
  useCategoryProjection,
  usePassiveIncomeProjection,
  useFinancialMilestones,
  usePortfolioCompositionProjection,
  useRealNetWorth,
  useFutureCommitments,
  useBalanceProjection,
  useCommitmentsImpact,
} from "./hooks/useAnalytics";
import { useAnalyticsFilter } from "./AnalyticsFilterContext";

export function AnalyticsProjectionsPage() {
  const { start, finish, activeTagIds } = useAnalyticsFilter();

  const monthly                = useAnalyticsMonthly(start, finish, activeTagIds);
  const netWorthProjection     = useNetWorthProjection(24);
  const categoryProjection     = useCategoryProjection(3);
  const passiveIncome          = usePassiveIncomeProjection(24);
  const milestones             = useFinancialMilestones();
  const portfolioComposition   = usePortfolioCompositionProjection(12);
  const realNetWorth           = useRealNetWorth();
  const futureCommitments      = useFutureCommitments(6);
  const balanceProjection      = useBalanceProjection(30);
  const commitmentsImpact      = useCommitmentsImpact(6);

  const bp = balanceProjection.data;
  const fw = futureCommitments.data ?? [];
  const nw = netWorthProjection.data;
  const mo = monthly.data ?? [];
  const totalInc = mo.reduce((s, m) => s + (m.totalIncome ?? 0), 0);
  const totalExp = mo.reduce((s, m) => s + (m.totalExpense ?? 0), 0);
  const annualSavingsGoal = totalInc > 0 ? (totalInc - totalExp) : 0;
  const nextCommitments  = fw.slice(0, 3).reduce((s, c) => s + (c.totalCommitted ?? 0), 0);
  const projectedIn12m   = nw?.projected?.slice(-1)[0]?.netWorth ?? 0;

  return (
    <div className="flex flex-col gap-5">
      <AnalyticsHeader title="Projeções" />

      {/* 4 KPI cards */}
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
  );
}

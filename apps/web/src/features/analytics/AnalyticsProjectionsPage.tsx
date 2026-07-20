"use client";

import { AnalyticsHeader } from "./components/AnalyticsHeader";
import { HeroPanel } from "@/components/shared/HeroPanel";
import { BigMoney } from "@/components/shared/Money";
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
import { formatCurrency } from "@/lib/utils/formatCurrency";

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

      {/* Hero panel — projections summary */}
      <HeroPanel split>
        {/* Left — projected end-of-month balance */}
        <div>
          <div className="font-mono text-[11px] tracking-[0.18em] uppercase text-[var(--panel-muted)]">
            Saldo projetado fim do mês
          </div>
          <BigMoney
            cents={bp?.projectedBalance ?? 0}
            className={`block mt-[10px] mb-[2px] font-semibold leading-[0.96] tracking-[-0.035em] ${
              (bp?.projectedBalance ?? 0) < 0 ? "text-[var(--clay-lift)]" : ""
            }`}
            style={{ fontSize: "clamp(40px, 5.6vw, 70px)" } as React.CSSProperties}
          />
          <div className="mt-2 font-mono text-[13px] text-[var(--panel-muted)]">
            Estimativa com base no ritmo atual de gastos
          </div>
        </div>

        {/* Right — 3 secondary projections */}
        <div className="self-center">
          <div className="mb-[18px] font-mono text-[11px] tracking-[0.14em] uppercase text-[var(--panel-muted)]">
            Projeções do período
          </div>
          <div className="grid grid-cols-3 gap-6">
            {[
              { label: "Próx. compromissos", value: nextCommitments > 0 ? formatCurrency(nextCommitments / 100) : "—", color: "var(--gold)" },
              { label: "Patrimônio em 12m",  value: projectedIn12m > 0  ? formatCurrency(projectedIn12m / 100)  : "—", color: "var(--panel-foreground)" },
              { label: "Meta poupança",      value: annualSavingsGoal > 0 ? formatCurrency(annualSavingsGoal / 100) : "—", color: "var(--panel-foreground)" },
            ].map(({ label, value, color }) => (
              <div key={label}>
                <div className="font-mono text-[11px] tracking-[0.14em] uppercase text-[var(--panel-muted)] mb-[6px]">
                  {label}
                </div>
                <div className="font-mono text-[17px] font-semibold leading-snug" style={{ color }}>
                  {value}
                </div>
              </div>
            ))}
          </div>
        </div>
      </HeroPanel>

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

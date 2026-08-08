"use client";

import { HeroPanel } from "@/components/shared/HeroPanel";
import { BigMoney } from "@/components/shared/Money";
import { FlowRow } from "@/components/shared/FlowBar";
import { AnimatedCurrency } from "@/components/shared/AnimatedValue";
import type { AnalyticsSummaryResponse } from "@/lib/types/analytics.types";

type Props = { summary: AnalyticsSummaryResponse };

export const AnalyticsSummaryCards = ({ summary }: Props) => {
  const avgBalance = summary.avgMonthlyBalance;

  const bestDeviation  = summary.bestMonth.balance  - avgBalance;
  const worstDeviation = avgBalance - summary.worstMonth.balance;
  const maxDeviation   = Math.max(bestDeviation, worstDeviation, 1);
  const bestPct  = bestDeviation  / maxDeviation;
  const worstPct = worstDeviation / maxDeviation;

  return (
    <HeroPanel split>
      {/* Left — avg monthly metrics */}
      <div>
        <div className="font-mono text-[11px] tracking-[0.18em] uppercase text-[var(--panel-muted)]">
          Saldo Médio Mensal
        </div>
        <BigMoney
          cents={avgBalance}
          className={`block mt-[10px] mb-[2px] font-semibold leading-[0.96] tracking-[-0.035em] ${
            avgBalance < 0 ? "text-[var(--clay-lift)]" : ""
          }`}
          style={{ fontSize: "clamp(40px, 5.6vw, 70px)" } as React.CSSProperties}
        />
        <div className="mt-2 font-mono text-[13px] text-[var(--panel-muted)]">
          Saldo médio mensal do período
        </div>

        <div className="mt-6 flex flex-wrap gap-[26px]">
          <div>
            <div className="font-mono text-[11px] tracking-[0.18em] uppercase text-[var(--panel-muted)]">
              Receita Média
            </div>
            <div className="font-mono mt-[3px] text-[18px] font-medium text-[var(--moss-lift)]">
              <AnimatedCurrency cents={summary.avgMonthlyIncome} />
            </div>
          </div>
          <div>
            <div className="font-mono text-[11px] tracking-[0.18em] uppercase text-[var(--panel-muted)]">
              Despesa Média
            </div>
            <div className="font-mono mt-[3px] text-[18px] font-medium text-[var(--clay-lift)]">
              <AnimatedCurrency cents={summary.avgMonthlyExpense} />
            </div>
          </div>
        </div>
      </div>

      {/* Right — best vs worst month */}
      <div className="self-center">
        <div className="mb-[18px] flex items-baseline justify-between">
          <span className="font-display text-[16px] font-bold">Melhor e Pior Mês vs. Média</span>
          <span className="font-mono text-[11px] tracking-[0.1em] uppercase text-[var(--panel-muted)]">
            Desvio da média
          </span>
        </div>

        <FlowRow
          label={summary.bestMonth.label}
          dotColor="var(--moss-lift)"
          value={
            <>
              {summary.bestMonth.balance >= 0 ? "+ " : "− "}
              <AnimatedCurrency cents={summary.bestMonth.balance} absolute />
            </>
          }
          valueColor="var(--moss-lift)"
          pct={bestPct}
          variant="in"
        />
        <FlowRow
          label={summary.worstMonth.label}
          dotColor="var(--clay-lift)"
          value={
            <>
              {summary.worstMonth.balance >= 0 ? "" : "− "}
              <AnimatedCurrency cents={summary.worstMonth.balance} absolute />
            </>
          }
          valueColor="var(--clay-lift)"
          pct={worstPct}
          variant="out"
        />

        <div
          className="mt-5 flex items-center justify-between border-t pt-4"
          style={{ borderColor: "rgba(255,255,255,0.12)" }}
        >
          <span className="font-mono text-[11px] tracking-[0.16em] uppercase text-[var(--panel-muted)]">
            Média do período
          </span>
          <span
            className="font-mono text-[22px] font-semibold"
            style={{ color: avgBalance >= 0 ? "var(--moss-lift)" : "var(--clay-lift)" }}
          >
            {avgBalance >= 0 ? "+ " : "− "}
            <AnimatedCurrency cents={avgBalance} absolute />
          </span>
        </div>
      </div>
    </HeroPanel>
  );
};

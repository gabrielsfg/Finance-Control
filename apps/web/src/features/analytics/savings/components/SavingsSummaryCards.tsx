"use client";

import { HeroPanel } from "@/components/shared/HeroPanel";
import { BigMoney } from "@/components/shared/Money";
import { FlowRow } from "@/components/shared/FlowBar";
import { AnimatedCurrency } from "@/components/shared/AnimatedValue";
import type { SavingsDetailResponse } from "@/lib/types/analytics.types";

type Props = { detail: SavingsDetailResponse };

export function SavingsSummaryCards({ detail }: Props) {
  const max = Math.max(detail.income, detail.expense, 1);

  return (
    <HeroPanel split>
      {/* Left — savings hero */}
      <div>
        <div className="font-mono text-[11px] tracking-[0.18em] uppercase text-[var(--panel-muted)]">
          Economizado no período
        </div>
        <BigMoney
          cents={detail.savings}
          className={`block mt-[10px] mb-[2px] font-semibold leading-[0.96] tracking-[-0.035em] ${
            detail.savings < 0 ? "text-[var(--clay-lift)]" : ""
          }`}
          style={{ fontSize: "clamp(40px, 5.6vw, 70px)" } as React.CSSProperties}
        />
        <div className="mt-2 font-mono text-[13px] text-[var(--panel-muted)]">
          {detail.savingsRate !== null
            ? `${detail.savingsRate.toFixed(1)}% do total recebido`
            : "Sem receitas no período"}
        </div>

        <div className="mt-6 flex flex-wrap gap-[26px]">
          <div>
            <div className="font-mono text-[11px] tracking-[0.18em] uppercase text-[var(--panel-muted)]">
              Recebido
            </div>
            <div className="font-mono mt-[3px] text-[18px] font-medium text-[var(--moss-lift)]">
              <AnimatedCurrency cents={detail.income} />
            </div>
          </div>
          <div>
            <div className="font-mono text-[11px] tracking-[0.18em] uppercase text-[var(--panel-muted)]">
              Gasto
            </div>
            <div className="font-mono mt-[3px] text-[18px] font-medium text-[var(--clay-lift)]">
              <AnimatedCurrency cents={detail.expense} />
            </div>
          </div>
          {detail.plannedSavings > 0 && (
            <div>
              <div className="font-mono text-[11px] tracking-[0.18em] uppercase text-[var(--panel-muted)]">
                Meta de economia
              </div>
              <div className="font-mono mt-[3px] text-[18px] font-medium text-[var(--panel-foreground)]">
                <AnimatedCurrency cents={detail.plannedSavings} />
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Right — income vs expense flow */}
      <div className="self-center">
        <div className="mb-[18px] flex items-baseline justify-between">
          <span className="font-display text-[16px] font-bold">Entradas vs. Saídas</span>
          <span className="font-mono text-[11px] tracking-[0.1em] uppercase text-[var(--panel-muted)]">
            {detail.isCurrent ? "Mês atual" : "Período"}
          </span>
        </div>

        <FlowRow
          label="Recebido"
          dotColor="var(--moss-lift)"
          value={<AnimatedCurrency cents={detail.income} />}
          valueColor="var(--moss-lift)"
          pct={detail.income / max}
          variant="in"
        />
        <FlowRow
          label="Gasto"
          dotColor="var(--clay-lift)"
          value={<AnimatedCurrency cents={detail.expense} />}
          valueColor="var(--clay-lift)"
          pct={detail.expense / max}
          variant="out"
        />

        <div
          className="mt-5 flex items-center justify-between border-t pt-4"
          style={{ borderColor: "rgba(255,255,255,0.12)" }}
        >
          <span className="font-mono text-[11px] tracking-[0.16em] uppercase text-[var(--panel-muted)]">
            Investido
          </span>
          <span
            className="font-mono text-[22px] font-semibold"
            style={{ color: detail.invested > 0 ? "var(--moss-lift)" : "var(--panel-muted)" }}
          >
            <AnimatedCurrency cents={detail.invested} />
          </span>
        </div>
      </div>
    </HeroPanel>
  );
}

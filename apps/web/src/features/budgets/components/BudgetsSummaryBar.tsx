"use client";

import { HeroPanel } from "@/components/shared/HeroPanel";
import { BigMoney } from "@/components/shared/Money";
import { FlowRow } from "@/components/shared/FlowBar";
import { AnimatedCurrency, AnimatedCount } from "@/components/shared/AnimatedValue";
import type { Budget } from "@/lib/types/budgets.types";

type Props = {
  budgets: Budget[];
  daysInPeriod?: number;
  dayOfPeriod?: number;
};

export const BudgetsSummaryBar = ({ budgets, daysInPeriod, dayOfPeriod }: Props) => {
  const active = budgets.filter((b) => b.isActive);
  const totalAllocated = active.reduce((s, b) => s + b.totalAllocated, 0);
  const totalSpent     = active.reduce((s, b) => s + b.totalSpent,     0);
  const available      = active.reduce((s, b) => s + b.available,      0);
  const pct            = totalAllocated > 0 ? (totalSpent / totalAllocated) * 100 : 0;
  const isOver         = totalSpent > totalAllocated;

  // count of overspent active budgets
  const overrun = active.filter((b) => b.totalSpent > b.totalAllocated).length;

  const now       = new Date();
  const dim       = daysInPeriod ?? new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
  const dom       = dayOfPeriod  ?? now.getDate();
  const daysLeft  = Math.max(0, dim - dom);

  // projected overspend
  const dailyRate  = dom > 0 ? totalSpent / dom : 0;
  const projected  = dailyRate * dim;
  const willExceed = projected > totalAllocated && totalAllocated > 0 && !isOver;
  const daysToBlow = dailyRate > 0 ? Math.round((totalAllocated - totalSpent) / dailyRate) : 0;

  const spentPct = totalAllocated > 0 ? totalSpent / totalAllocated : 0;
  const availPct = totalAllocated > 0 ? Math.max(0, available) / totalAllocated : 0;

  return (
    <HeroPanel split>
      {/* Left — spend figure */}
      <div>
        <div className="font-mono text-[11px] tracking-[0.18em] uppercase text-[var(--panel-muted)]">
          Gasto no período
        </div>
        <BigMoney
          cents={totalSpent}
          className="block mt-[10px] mb-[2px] font-semibold leading-[0.96] tracking-[-0.035em]"
          style={{ fontSize: "clamp(40px, 5.6vw, 70px)" } as React.CSSProperties}
        />

        <div className="mt-2 inline-flex items-center gap-[7px] font-mono text-[13px] font-medium">
          <span
            className="inline-flex items-center gap-1 rounded-full px-[9px] py-[3px]"
            style={{
              background: isOver ? "rgba(255,138,91,0.18)" : "rgba(129,151,255,0.18)",
              color: isOver ? "var(--clay-lift)" : "var(--cobalt-lift)",
            }}
          >
            <AnimatedCount value={pct} suffix="% usado" />
          </span>
          <span className="text-[var(--panel-muted)]">
            de <AnimatedCurrency cents={totalAllocated} /> orçados
          </span>
        </div>

        <div className="mt-6 flex flex-wrap gap-[26px]">
          <div>
            <div className="font-mono text-[11px] tracking-[0.18em] uppercase text-[var(--panel-muted)]">Orçado</div>
            <div className="font-mono mt-[3px] text-[18px] font-medium">
              <AnimatedCurrency cents={totalAllocated} />
            </div>
          </div>
          <div>
            <div className="font-mono text-[11px] tracking-[0.18em] uppercase text-[var(--panel-muted)]">Disponível</div>
            <div
              className="font-mono mt-[3px] text-[18px] font-medium"
              style={{ color: available < 0 ? "var(--clay-lift)" : "var(--moss-lift)" }}
            >
              <AnimatedCurrency cents={available} />
            </div>
          </div>
          <div>
            <div className="font-mono text-[11px] tracking-[0.18em] uppercase text-[var(--panel-muted)]">
              {overrun > 0 ? "Estouradas" : "Dias restantes"}
            </div>
            <div className="font-mono mt-[3px] text-[18px] font-medium">
              <AnimatedCount value={overrun > 0 ? overrun : daysLeft} />
            </div>
          </div>
        </div>
      </div>

      {/* Right — budget usage flow */}
      <div className="self-center">
        <div className="mb-[18px] flex items-baseline justify-between">
          <span className="font-display text-[16px] font-bold">Uso do orçamento</span>
          <span className="font-mono text-[11px] tracking-[0.1em] uppercase text-[var(--panel-muted)]">
            {daysLeft > 0 ? `${daysLeft} dias restantes` : "Período encerrado"}
          </span>
        </div>

        <FlowRow
          label="Gasto"
          dotColor="var(--clay-lift)"
          value={<AnimatedCurrency cents={totalSpent} />}
          valueColor="var(--clay-lift)"
          pct={spentPct}
          variant="out"
        />
        <FlowRow
          label="Disponível"
          dotColor="var(--moss-lift)"
          value={<AnimatedCurrency cents={Math.max(0, available)} />}
          valueColor="var(--moss-lift)"
          pct={availPct}
          variant="in"
        />

        <div
          className="mt-5 flex items-center justify-between border-t pt-4"
          style={{ borderColor: "rgba(255,255,255,0.12)" }}
        >
          <span className="font-mono text-[11px] tracking-[0.16em] uppercase text-[var(--panel-muted)]">
            {isOver ? "Estourado em" : "Disponível"}
          </span>
          <span
            className="font-mono text-[22px] font-semibold"
            style={{ color: isOver ? "var(--clay-lift)" : "var(--moss-lift)" }}
          >
            {isOver ? "− " : "+ "}
            <AnimatedCurrency cents={available} absolute />
          </span>
        </div>

        {willExceed && (
          <p className="mt-2.5 font-mono text-[12px] text-[var(--clay-lift)]">
            No ritmo atual, você estoura o orçamento em ~{daysToBlow} dia{daysToBlow !== 1 ? "s" : ""}.
          </p>
        )}
      </div>
    </HeroPanel>
  );
};

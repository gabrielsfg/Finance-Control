"use client";

import { ArrowUpRight, ArrowDownRight } from "lucide-react";
import { HeroPanel } from "@/components/shared/HeroPanel";
import { BigMoney } from "@/components/shared/Money";
import { FlowRow } from "@/components/shared/FlowBar";
import { AnimatedCurrency, AnimatedCount } from "@/components/shared/AnimatedValue";

type Props = {
  totalIncome: number;
  totalExpense: number;
  balance: number;
  previousTotalIncome?: number;
  previousTotalExpense?: number;
  previousBalance?: number;
};

/** Month-over-month %. Returns undefined for any non-comparable input (no NaN/Infinity). */
function pctChange(current: number, previous: number | undefined | null): number | undefined {
  if (previous == null || !Number.isFinite(previous) || previous === 0) return undefined;
  if (!Number.isFinite(current)) return undefined;
  const pct = ((current - previous) / Math.abs(previous)) * 100;
  return Number.isFinite(pct) ? pct : undefined;
}

function ChangeChip({ pct, lowerIsBetter = false }: { pct: number | undefined; lowerIsBetter?: boolean }) {
  if (pct === undefined) return null;
  const positive = lowerIsBetter ? pct < 0 : pct > 0;
  return (
    <span
      className="inline-flex items-center gap-[4px] rounded-full px-[8px] py-[2px] font-mono text-[11px] font-medium"
      style={{
        background: positive ? "rgba(95,198,160,0.18)" : "rgba(255,138,91,0.18)",
        color: positive ? "var(--moss-lift)" : "var(--clay-lift)",
      }}
    >
      {pct >= 0 ? <ArrowUpRight size={11} strokeWidth={2.4} /> : <ArrowDownRight size={11} strokeWidth={2.4} />}
      <AnimatedCount value={Math.abs(pct)} decimals={1} suffix="%" />
    </span>
  );
}

export const TransactionsSummary = ({
  totalIncome,
  totalExpense,
  balance,
  previousTotalIncome,
  previousTotalExpense,
  previousBalance,
}: Props) => {
  const incomePct = pctChange(totalIncome, previousTotalIncome);
  const expensePct = pctChange(totalExpense, previousTotalExpense);
  const balancePct = pctChange(balance, previousBalance);

  const max = Math.max(totalIncome, totalExpense, 1);

  return (
    <HeroPanel split>
      {/* Left — balance + month-over-month */}
      <div>
        <div className="font-mono text-[11px] tracking-[0.18em] uppercase text-[var(--panel-muted)]">Saldo do mês</div>
        <BigMoney
          cents={balance}
          className={`block mt-[10px] mb-[2px] font-semibold leading-[0.96] tracking-[-0.035em] ${
            balance < 0 ? "text-[var(--clay-lift)]" : ""
          }`}
          style={{ fontSize: "clamp(40px, 5.6vw, 70px)" } as React.CSSProperties}
        />
        <div className="mt-2 inline-flex items-center gap-[7px] font-mono text-[13px] font-medium">
          <ChangeChip pct={balancePct} />
          <span className="text-[var(--panel-muted)]">vs. mês anterior</span>
        </div>

        <div className="mt-6 flex flex-wrap gap-[26px]">
          <div>
            <div className="font-mono text-[11px] tracking-[0.18em] uppercase text-[var(--panel-muted)]">Entradas</div>
            <div className="mt-[3px] flex items-center gap-2">
              <span className="font-mono text-[18px] font-medium text-[var(--moss-lift)]">
                <AnimatedCurrency cents={totalIncome} />
              </span>
              <ChangeChip pct={incomePct} />
            </div>
          </div>
          <div>
            <div className="font-mono text-[11px] tracking-[0.18em] uppercase text-[var(--panel-muted)]">Saídas</div>
            <div className="mt-[3px] flex items-center gap-2">
              <span className="font-mono text-[18px] font-medium text-[var(--clay-lift)]">
                <AnimatedCurrency cents={totalExpense} />
              </span>
              <ChangeChip pct={expensePct} lowerIsBetter />
            </div>
          </div>
        </div>
      </div>

      {/* Right — flow */}
      <div className="self-center">
        <div className="mb-[18px] flex items-baseline justify-between">
          <span className="font-display text-[16px] font-bold">Fluxo do período</span>
          <span className="font-mono text-[11px] tracking-[0.1em] uppercase text-[var(--panel-muted)]">Entradas vs. saídas</span>
        </div>

        <FlowRow
          label="Entradas"
          dotColor="var(--moss-lift)"
          value={
            <>
              {"+ "}
              <AnimatedCurrency cents={totalIncome} />
            </>
          }
          valueColor="var(--moss-lift)"
          pct={totalIncome / max}
          variant="in"
        />
        <FlowRow
          label="Saídas"
          dotColor="var(--clay-lift)"
          value={
            <>
              {"− "}
              <AnimatedCurrency cents={totalExpense} />
            </>
          }
          valueColor="var(--clay-lift)"
          pct={totalExpense / max}
          variant="out"
        />

        <div className="mt-5 flex items-center justify-between border-t pt-4" style={{ borderColor: "rgba(255,255,255,0.12)" }}>
          <span className="font-mono text-[11px] tracking-[0.16em] uppercase text-[var(--panel-muted)]">Saldo do mês</span>
          <span
            className="font-mono text-[22px] font-semibold"
            style={{ color: balance >= 0 ? "var(--moss-lift)" : "var(--clay-lift)" }}
          >
            {balance >= 0 ? "+ " : "− "}
            <AnimatedCurrency cents={balance} absolute />
          </span>
        </div>
      </div>
    </HeroPanel>
  );
};

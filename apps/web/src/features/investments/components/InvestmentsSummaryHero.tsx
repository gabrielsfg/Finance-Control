"use client";

import { formatPercentNeutral } from "@/lib/utils/formatNumber";
import { HeroPanel } from "@/components/shared/HeroPanel";
import { BigMoney } from "@/components/shared/Money";
import { FlowRow } from "@/components/shared/FlowBar";
import { AnimatedCurrency, AnimatedCount } from "@/components/shared/AnimatedValue";
import type { InvestmentPortfolio } from "@/lib/types/investments.types";

type Props = { summary: InvestmentPortfolio };

export const InvestmentsSummaryHero = ({ summary }: Props) => {
  const isPositive = summary.totalReturn >= 0;
  const returnColor = isPositive ? "var(--moss-lift)" : "var(--clay-lift)";

  // Sum the day's P/L across positions that report a previous close.
  const dayChange = summary.investments.reduce(
    (s, i) => (i.previousClose !== null && i.previousClose > 0 ? s + i.dayChangeAbs : s),
    0,
  );
  const dayPositive = dayChange >= 0;

  // Composition: invested principal vs. accumulated return, both relative to current value.
  const total = summary.currentValue;
  const investedPct = total > 0 ? Math.min(1, summary.totalInvested / total) : 0;
  const returnPct = total > 0 ? Math.max(0, summary.totalReturn) / total : 0;

  return (
    <HeroPanel split>
      {/* Left — patrimônio figure */}
      <div>
        <div className="font-mono text-[11px] tracking-[0.18em] uppercase text-[var(--panel-muted)]">
          Patrimônio investido
        </div>
        <BigMoney
          cents={summary.currentValue}
          className="block mt-[10px] mb-[2px] font-semibold leading-[0.96] tracking-[-0.035em]"
          style={{ fontSize: "clamp(40px, 5.6vw, 70px)" } as React.CSSProperties}
        />

        <div className="mt-2 inline-flex items-center gap-[7px] font-mono text-[13px] font-medium">
          <span
            className="inline-flex items-center gap-1 rounded-full px-[9px] py-[3px]"
            style={{
              background: isPositive ? "rgba(95,198,160,0.18)" : "rgba(255,138,91,0.18)",
              color: returnColor,
            }}
          >
            {isPositive ? "+ " : "− "}
            {formatPercentNeutral(Math.abs(summary.totalReturnPercent))}
          </span>
          <span className="text-[var(--panel-muted)]">
            {isPositive ? "+ " : "− "}
            <AnimatedCurrency cents={summary.totalReturn} absolute /> de retorno
          </span>
        </div>

        <div className="mt-6 flex flex-wrap gap-[26px]">
          <div>
            <div className="font-mono text-[11px] tracking-[0.18em] uppercase text-[var(--panel-muted)]">Hoje</div>
            <div
              className="font-mono mt-[3px] text-[18px] font-medium"
              style={{ color: dayPositive ? "var(--moss-lift)" : "var(--clay-lift)" }}
            >
              {dayPositive ? "+ " : "− "}
              <AnimatedCurrency cents={dayChange} absolute />
            </div>
          </div>
          <div>
            <div className="font-mono text-[11px] tracking-[0.18em] uppercase text-[var(--panel-muted)]">Investido</div>
            <div className="font-mono mt-[3px] text-[18px] font-medium">
              <AnimatedCurrency cents={summary.totalInvested} />
            </div>
          </div>
          <div>
            <div className="font-mono text-[11px] tracking-[0.18em] uppercase text-[var(--panel-muted)]">Ativos</div>
            <div className="font-mono mt-[3px] text-[18px] font-medium">
              <AnimatedCount value={summary.investments.length} />
            </div>
          </div>
        </div>
      </div>

      {/* Right — composição flow */}
      <div className="self-center">
        <div className="mb-[18px] flex items-baseline justify-between">
          <span className="font-display text-[16px] font-bold">Composição</span>
          <span className="font-mono text-[11px] tracking-[0.1em] uppercase text-[var(--panel-muted)]">
            desde o 1º aporte
          </span>
        </div>

        <FlowRow
          label="Total aportado"
          dotColor="var(--moss-lift)"
          value={<AnimatedCurrency cents={summary.totalInvested} />}
          valueColor="var(--moss-lift)"
          pct={investedPct}
          variant="in"
        />
        <FlowRow
          label="Rendimento"
          dotColor={returnColor}
          value={
            <>
              {isPositive ? "+ " : "− "}
              <AnimatedCurrency cents={summary.totalReturn} absolute />
            </>
          }
          valueColor={returnColor}
          pct={returnPct}
          variant={isPositive ? "in" : "out"}
        />

        <div
          className="mt-5 flex items-center justify-between border-t pt-4"
          style={{ borderColor: "rgba(255,255,255,0.12)" }}
        >
          <span className="font-mono text-[11px] tracking-[0.16em] uppercase text-[var(--panel-muted)]">
            Patrimônio atual
          </span>
          <span className="font-mono text-[22px] font-semibold">
            <AnimatedCurrency cents={summary.currentValue} />
          </span>
        </div>
      </div>
    </HeroPanel>
  );
};

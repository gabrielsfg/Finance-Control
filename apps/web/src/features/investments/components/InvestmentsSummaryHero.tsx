"use client";

import { formatPercentNeutral } from "@/lib/utils/formatNumber";
import { HeroPanel } from "@/components/shared/HeroPanel";
import { BigMoney } from "@/components/shared/Money";
import { FlowLabelRow, FlowSplit } from "@/components/shared/FlowBar";
import { AnimatedCurrency, AnimatedCount } from "@/components/shared/AnimatedValue";
import type { InvestmentPortfolio } from "@/lib/types/investments.types";

/**
 * The principal gets a hue of its own. Sharing `--moss-lift` with a positive return was
 * fine on two separate tracks, but on one segmented track it would draw as a single
 * undivided bar — the return only ever reads as green or clay, so the principal moves off
 * green entirely.
 */
const PRINCIPAL_COLOR = "var(--cobalt-lift)";

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

  // Principal plus return compose the current patrimônio, on one track.
  //
  //   gain: aportado + rendimento = patrimônio   (the return extends the bar)
  //   loss: aportado − prejuízo   = patrimônio   (the loss eats into the bar)
  //
  // A loss cannot be a segment *added* to a filled track, so on a loss the track is the
  // aportado and the clay segment is the bite taken out of it — what is left is the
  // patrimônio. Either way the cobalt side is the principal and the coloured side is the
  // return, so the bar always answers the same question: how did my principal move?
  const isLoss = summary.totalReturn < 0;
  const returnAbs = Math.abs(summary.totalReturn);
  const trackCaption = isLoss ? "= total aportado" : "= patrimônio atual";

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
            {trackCaption}
          </span>
        </div>

        <FlowLabelRow
          label="Total aportado"
          dotColor={PRINCIPAL_COLOR}
          value={<AnimatedCurrency cents={summary.totalInvested} />}
          valueColor={PRINCIPAL_COLOR}
        />
        <FlowLabelRow
          label={isLoss ? "Prejuízo" : "Rendimento"}
          dotColor={returnColor}
          value={
            <>
              {isPositive ? "+ " : "− "}
              <AnimatedCurrency cents={summary.totalReturn} absolute />
            </>
          }
          valueColor={returnColor}
        />

        <FlowSplit
          inValue={isLoss ? summary.currentValue : summary.totalInvested}
          outValue={returnAbs}
          inColor={PRINCIPAL_COLOR}
          outColor={returnColor}
          tick={false}
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

"use client";

import { formatCurrency } from "@/lib/utils/formatCurrency";
import { HeroPanel } from "@/components/shared/HeroPanel";
import { BigMoney } from "@/components/shared/Money";
import { FlowRow } from "@/components/shared/FlowBar";

type Props = {
  /** Net monthly recurring + installment commitment (signed cents; expenses negative). */
  committedMonthly: number;
  /** Signed annual subscription total (cents). */
  annual: number;
  /** Monthly income (cents). */
  monthlyIncome: number;
  /** Active recurrences + installments. */
  activeCount: number;
  /** Paused (inactive) recurrences. */
  pausedCount: number;
  nextDebit: { description: string; daysUntil: number } | null;
};

export const RecurrencesHero = ({
  committedMonthly,
  annual,
  monthlyIncome,
  activeCount,
  pausedCount,
  nextDebit,
}: Props) => {
  const committed = Math.abs(committedMonthly);
  const free = monthlyIncome - committed;
  const pctOfIncome = monthlyIncome > 0 ? (committed / monthlyIncome) * 100 : null;

  const outPct = monthlyIncome > 0 ? committed / monthlyIncome : 1;
  const inPct = monthlyIncome > 0 ? Math.max(0, free) / monthlyIncome : 0;

  const nextNote = nextDebit
    ? `próxima: ${nextDebit.description} ${
        nextDebit.daysUntil <= 0 ? "vence hoje" : nextDebit.daysUntil === 1 ? "vence amanhã" : `vence em ${nextDebit.daysUntil} dias`
      }`
    : "nenhum vencimento próximo";

  return (
    <HeroPanel split>
      {/* Left — committed figure */}
      <div>
        <div className="font-mono text-[11px] tracking-[0.18em] uppercase text-[var(--panel-muted)]">Comprometido por mês</div>
        <BigMoney
          cents={committed}
          className="block mt-[10px] mb-[2px] font-semibold leading-[0.96] tracking-[-0.035em]"
          style={{ fontSize: "clamp(40px, 5.6vw, 70px)" } as React.CSSProperties}
        />

        <div className="mt-2 inline-flex flex-wrap items-center gap-[7px] font-mono text-[13px] font-medium">
          {pctOfIncome !== null && (
            <span
              className="inline-flex items-center gap-1 rounded-full px-[9px] py-[3px]"
              style={{ background: "rgba(255,138,91,0.16)", color: "var(--clay-lift)" }}
            >
              {pctOfIncome.toFixed(0)}% da renda
            </span>
          )}
          <span className="text-[var(--panel-muted)]">{nextNote}</span>
        </div>

        <div className="mt-6 flex flex-wrap gap-[26px]">
          <div>
            <div className="font-mono text-[11px] tracking-[0.18em] uppercase text-[var(--panel-muted)]">Ativas</div>
            <div className="font-mono mt-[3px] text-[18px] font-medium">{activeCount}</div>
          </div>
          <div>
            <div className="font-mono text-[11px] tracking-[0.18em] uppercase text-[var(--panel-muted)]">Pausadas</div>
            <div className="font-mono mt-[3px] text-[18px] font-medium">{pausedCount}</div>
          </div>
          <div>
            <div className="font-mono text-[11px] tracking-[0.18em] uppercase text-[var(--panel-muted)]">No ano</div>
            <div className="font-mono mt-[3px] text-[18px] font-medium">{formatCurrency(Math.abs(annual) / 100)}</div>
          </div>
        </div>
      </div>

      {/* Right — income commitment flow */}
      <div className="self-center">
        <div className="mb-[18px] flex items-baseline justify-between">
          <span className="font-display text-[16px] font-bold">Renda comprometida</span>
          <span className="font-mono text-[11px] tracking-[0.1em] uppercase text-[var(--panel-muted)]">Mensal</span>
        </div>

        <FlowRow
          label="Renda livre"
          dotColor="var(--moss-lift)"
          value={monthlyIncome > 0 ? formatCurrency(Math.max(0, free) / 100) : "—"}
          valueColor="var(--moss-lift)"
          pct={inPct}
          variant="in"
        />
        <FlowRow
          label="Recorrente"
          dotColor="var(--clay-lift)"
          value={formatCurrency(committed / 100)}
          valueColor="var(--clay-lift)"
          pct={outPct}
          variant="out"
        />

        <div className="mt-5 flex items-center justify-between border-t pt-4" style={{ borderColor: "rgba(255,255,255,0.12)" }}>
          <span className="font-mono text-[11px] tracking-[0.16em] uppercase text-[var(--panel-muted)]">Sobra livre</span>
          <span
            className="font-mono text-[22px] font-semibold"
            style={{ color: free >= 0 ? "var(--moss-lift)" : "var(--clay-lift)" }}
          >
            {monthlyIncome > 0 ? `${free >= 0 ? "+ " : "− "}${formatCurrency(Math.abs(free) / 100)}` : "—"}
          </span>
        </div>
      </div>
    </HeroPanel>
  );
};

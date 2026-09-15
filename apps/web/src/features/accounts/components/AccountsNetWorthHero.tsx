"use client";

import { HeroPanel } from "@/components/shared/HeroPanel";
import { BigMoney } from "@/components/shared/Money";
import { FlowLabelRow, FlowShareChip, FlowSplit, flowShares } from "@/components/shared/FlowBar";
import { AnimatedCurrency } from "@/components/shared/AnimatedValue";
import type { AccountItem } from "@/lib/types/accounts.types";

const TYPE_LABELS: Record<string, string> = {
  Checking: "Conta corrente",
  Savings: "Poupança",
  Cash: "Carteira",
};
const TYPE_ORDER = ["Checking", "Savings", "Cash"] as const;

export const AccountsNetWorthHero = ({ accounts }: { accounts: AccountItem[] }) => {
  const netWorth = accounts.filter((a) => a.type !== "Credit").reduce((s, a) => s + a.currentAmount, 0);
  const totalInvoice = accounts.filter((a) => a.type === "Credit").reduce((s, a) => s + Math.abs(a.currentAmount), 0);
  const free = netWorth - totalInvoice;

  const byType = TYPE_ORDER.map((t) => ({
    label: TYPE_LABELS[t],
    total: accounts.filter((a) => a.type === t).reduce((s, a) => s + a.currentAmount, 0),
  }));

  // Available and invoice are opposing sides of one position, not two independent
  // magnitudes, so they share a single track: the halves are what the money is up
  // against. The 50/50 tick is the break-even — landing on it means the balance in
  // your accounts covers the open invoices exactly, and nothing more.
  const { inPct, outPct } = flowShares(netWorth, totalInvoice);

  return (
    <HeroPanel split>
      {/* Left — net worth */}
      <div>
        <div className="font-mono text-[11px] tracking-[0.18em] uppercase text-[var(--panel-muted)]">Patrimônio em contas</div>
        <BigMoney
          cents={netWorth}
          className="block mt-[10px] mb-[2px] font-semibold leading-[0.96] tracking-[-0.035em]"
          style={{ fontSize: "clamp(40px, 5.6vw, 70px)" } as React.CSSProperties}
        />
        <div className="mt-2 font-mono text-[13px] text-[var(--panel-muted)]">
          Saldo somando suas contas{totalInvoice > 0 ? " (sem cartões de crédito)" : ""}
        </div>

        {byType.length > 0 && (
          <div className="mt-6 flex flex-wrap gap-[26px]">
            {byType.map((b) => (
              <div key={b.label}>
                <div className="font-mono text-[11px] tracking-[0.18em] uppercase text-[var(--panel-muted)]">{b.label}</div>
                <div className="font-mono mt-[3px] text-[18px] font-medium">
                  <AnimatedCurrency cents={b.total} />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Right — available vs. invoice */}
      <div className="self-center">
        <div className="mb-[18px] flex items-baseline justify-between">
          <span className="font-display text-[16px] font-bold">Disponível vs. Fatura</span>
          <span className="font-mono text-[11px] tracking-[0.1em] uppercase text-[var(--panel-muted)]">
            {accounts.length} conta{accounts.length !== 1 ? "s" : ""}
          </span>
        </div>

        <FlowLabelRow
          label="Disponível"
          dotColor="var(--moss-lift)"
          value={
            <>
              <FlowShareChip pct={inPct} />
              <AnimatedCurrency cents={netWorth} />
            </>
          }
          valueColor="var(--moss-lift)"
        />
        <FlowLabelRow
          label="Fatura a pagar"
          dotColor="var(--clay-lift)"
          value={
            <>
              <FlowShareChip pct={outPct} />
              <AnimatedCurrency cents={totalInvoice} />
            </>
          }
          valueColor="var(--clay-lift)"
        />

        <FlowSplit inValue={netWorth} outValue={totalInvoice} />
        <div className="mt-[6px] text-center font-mono text-[10px] tracking-[0.14em] uppercase text-[var(--panel-muted)]">
          equilíbrio
        </div>

        <div className="mt-5 flex items-center justify-between border-t pt-4" style={{ borderColor: "rgba(255,255,255,0.12)" }}>
          <span className="font-mono text-[11px] tracking-[0.16em] uppercase text-[var(--panel-muted)]">Saldo livre</span>
          <span
            className="font-mono text-[22px] font-semibold"
            style={{ color: free >= 0 ? "var(--moss-lift)" : "var(--clay-lift)" }}
          >
            {free >= 0 ? "+ " : "− "}
            <AnimatedCurrency cents={free} absolute />
          </span>
        </div>
      </div>
    </HeroPanel>
  );
};

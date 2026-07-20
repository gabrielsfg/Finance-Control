"use client";

import { formatCurrency } from "@/lib/utils/formatCurrency";
import { HeroPanel } from "@/components/shared/HeroPanel";
import { BigMoney } from "@/components/shared/Money";
import { FlowRow } from "@/components/shared/FlowBar";
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

  const invoicePct = netWorth > 0 ? Math.min(1, totalInvoice / netWorth) : totalInvoice > 0 ? 1 : 0;

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
                <div className="font-mono mt-[3px] text-[18px] font-medium">{formatCurrency(b.total / 100)}</div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Right — available vs. invoice */}
      <div className="self-center">
        <div className="mb-[18px] flex items-baseline justify-between">
          <span className="font-display text-[16px] font-bold">Disponível vs. fatura</span>
          <span className="font-mono text-[11px] tracking-[0.1em] uppercase text-[var(--panel-muted)]">
            {accounts.length} conta{accounts.length !== 1 ? "s" : ""}
          </span>
        </div>

        <FlowRow
          label="Disponível"
          dotColor="var(--moss-lift)"
          value={formatCurrency(netWorth / 100)}
          valueColor="var(--moss-lift)"
          pct={netWorth > 0 ? 1 : 0}
          variant="in"
        />
        <FlowRow
          label="Fatura a pagar"
          dotColor="var(--clay-lift)"
          value={formatCurrency(totalInvoice / 100)}
          valueColor="var(--clay-lift)"
          pct={invoicePct}
          variant="out"
        />

        <div className="mt-5 flex items-center justify-between border-t pt-4" style={{ borderColor: "rgba(255,255,255,0.12)" }}>
          <span className="font-mono text-[11px] tracking-[0.16em] uppercase text-[var(--panel-muted)]">Saldo livre</span>
          <span
            className="font-mono text-[22px] font-semibold"
            style={{ color: free >= 0 ? "var(--moss-lift)" : "var(--clay-lift)" }}
          >
            {free >= 0 ? "+ " : "− "}
            {formatCurrency(Math.abs(free) / 100)}
          </span>
        </div>
      </div>
    </HeroPanel>
  );
};

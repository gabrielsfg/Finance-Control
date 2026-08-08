"use client";

import { Loader2 } from "lucide-react";
import { AnalyticsHeader } from "./components/AnalyticsHeader";
import { AnalyticsNetWorthChart } from "./net-worth/components/AnalyticsNetWorthChart";
import { BalanceEvolutionChart } from "./expenses/components/BalanceEvolutionChart";
import {
  useAnalyticsMonthly,
  useAnalyticsNetWorth,
  useBalanceEvolution,
} from "./hooks/useAnalytics";
import { useAnalyticsFilter } from "./AnalyticsFilterContext";
import { HeroPanel } from "@/components/shared/HeroPanel";
import { BigMoney } from "@/components/shared/Money";
import { AnimatedCount } from "@/components/shared/AnimatedValue";

export function AnalyticsNetWorthPage() {
  const { start, finish, activeTagIds } = useAnalyticsFilter();

  const netWorth = useAnalyticsNetWorth(start, finish);
  const monthly = useAnalyticsMonthly(start, finish, activeTagIds);
  const balanceEvolution = useBalanceEvolution(start, finish);

  if (netWorth.isLoading) {
    return (
      <div className="flex h-full items-center justify-center">
        <Loader2 size={24} className="text-green animate-spin" />
      </div>
    );
  }

  const pts = netWorth.data ?? [];
  const last = pts[pts.length - 1];
  const prev = pts[pts.length - 2];
  const monthGrowth = last && prev && prev.netWorth
    ? ((last.netWorth - prev.netWorth) / Math.abs(prev.netWorth)) * 100
    : null;
  const first = pts[0];
  const yearGrowth = last && first && first.netWorth
    ? ((last.netWorth - first.netWorth) / Math.abs(first.netWorth)) * 100
    : null;
  const mo = monthly.data ?? [];
  const totalInc = mo.reduce((s, m) => s + (m.totalIncome ?? 0), 0);
  const totalExp = mo.reduce((s, m) => s + (m.totalExpense ?? 0), 0);
  const sr = totalInc > 0 ? ((totalInc - totalExp) / totalInc) * 100 : null;

  const currentYear = new Date().getFullYear();

  return (
    <div className="flex flex-col gap-5">
      <AnalyticsHeader title="Patrimônio" />

      <HeroPanel split>
        {/* Left — current net worth */}
        <div>
          <div className="font-mono text-[11px] tracking-[0.18em] uppercase text-[var(--panel-muted)]">
            Patrimônio atual
          </div>
          <BigMoney
            cents={last?.netWorth ?? 0}
            className={`block mt-[10px] mb-[2px] font-semibold leading-[0.96] tracking-[-0.035em] ${
              (last?.netWorth ?? 0) < 0 ? "text-[var(--clay-lift)]" : ""
            }`}
            style={{ fontSize: "clamp(40px, 5.6vw, 70px)" } as React.CSSProperties}
          />
          <div className="mt-2 font-mono text-[13px] text-[var(--panel-muted)]">
            Patrimônio líquido das suas contas
          </div>
        </div>

        {/* Right — growth metrics grid */}
        <div className="self-center">
          <div className="mb-[18px] font-mono text-[11px] tracking-[0.14em] uppercase text-[var(--panel-muted)]">
            Variação acumulada
          </div>
          <div className="grid grid-cols-3 gap-6">
            {[
              { label: "No mês", value: monthGrowth },
              { label: `Em ${currentYear}`, value: yearGrowth },
              { label: "Tx. poupança", value: sr },
            ].map(({ label, value }) => (
              <div key={label}>
                <div className="font-mono text-[11px] tracking-[0.14em] uppercase text-[var(--panel-muted)] mb-[6px]">
                  {label}
                </div>
                <div
                  className="font-mono text-[28px] font-semibold leading-none"
                  style={{
                    color:
                      value === null
                        ? "var(--panel-muted)"
                        : label === `Em ${currentYear}` || label === "No mês"
                          ? value >= 0
                            ? "var(--moss-lift)"
                            : "var(--clay-lift)"
                          : "var(--panel-foreground)",
                  }}
                >
                  {value !== null ? (
                    <>
                      {value >= 0 ? "+" : ""}
                      <AnimatedCount value={value} decimals={1} suffix="%" />
                    </>
                  ) : (
                    "—"
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </HeroPanel>

      <div className="flex flex-col gap-4">
        <AnalyticsNetWorthChart data={pts} />
        <BalanceEvolutionChart data={balanceEvolution.data ?? []} />
      </div>
    </div>
  );
}

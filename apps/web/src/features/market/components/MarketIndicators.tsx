"use client";

import Link from "next/link";
import { TrendingUp, TrendingDown } from "lucide-react";
import { useMacroIndicators, useMarketList } from "@/features/market/hooks/useMarket";
import { formatCurrency } from "@/lib/utils/formatCurrency";
import { cn } from "@/lib/utils";
import { HeroPanel } from "@/components/shared/HeroPanel";

const PERCENT_UNIT: Record<string, string> = {
  percent: "%",
  percentperyear: "% a.a.",
  percentpermonth: "% a.m.",
  percentperday: "% a.d.",
};

function macroValue(value: number | null, unit: string | null): string {
  if (value == null) return "—";
  const formatted = value.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  const u = (unit ?? "").trim();
  if (!u) return formatted;
  const key = u.toLowerCase();
  if (key in PERCENT_UNIT) return `${formatted}${PERCENT_UNIT[key]}`;
  if (key.startsWith("percent") || u.includes("%")) return `${formatted}%`;
  return `${formatted} ${u}`;
}

type IndicatorItem = {
  key: string;
  label: string;
  value: string;
  changePct?: number | null;
  sub?: string | null;
  href?: string;
};

function TrendChip({ pct }: { pct: number }) {
  const up = pct >= 0;
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full px-[7px] py-[2px] font-mono text-[12px] font-semibold tabular-nums",
        up ? "text-[var(--moss)]" : "text-[var(--clay)]",
      )}
      style={{
        background: up
          ? "color-mix(in srgb, var(--moss) 14%, transparent)"
          : "color-mix(in srgb, var(--clay) 14%, transparent)",
      }}
    >
      {up ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
      {up ? "+" : ""}{pct.toFixed(2)}%
    </span>
  );
}

function IndicatorStat({ item }: { item: IndicatorItem }) {
  const inner = (
    <div className="flex flex-col">
      <span className="font-mono text-[10px] font-medium uppercase tracking-[0.18em] text-[var(--panel-muted)]">
        {item.label}
      </span>
      <span className="mt-[7px] font-mono text-[19px] font-semibold leading-tight tracking-[-0.02em] tabular-nums text-[var(--panel-foreground)]">
        {item.value}
      </span>
      <div className="mt-[7px] flex items-center gap-2 font-mono text-[11px] text-[var(--panel-muted)]">
        {item.changePct != null ? (
          <>
            <TrendChip pct={item.changePct} />
            <span>hoje</span>
          </>
        ) : (
          <span>{item.sub ?? ""}</span>
        )}
      </div>
    </div>
  );

  return item.href ? (
    <Link href={item.href} className="block transition-opacity hover:opacity-75">
      {inner}
    </Link>
  ) : (
    inner
  );
}

export function MarketIndicators() {
  const { data: macro = [], isLoading: macroLoading } = useMacroIndicators();
  const { data: indices = [] } = useMarketList({ type: "Index", sort: "price_desc", limit: 5 });
  const { data: currencies = [] } = useMarketList({ type: "Moeda", sort: "price_desc", limit: 10 });

  const ASSET_LABELS: Record<string, string> = {
    "^BVSP": "IBOV", IFIX: "IFIX", "USD-BRL": "USD/BRL", "EUR-BRL": "EUR/BRL",
  };

  const indexItems: IndicatorItem[] = indices
    .filter((a) => a.ticker in ASSET_LABELS)
    .map((a) => ({
      key: `idx-${a.id}`,
      label: ASSET_LABELS[a.ticker],
      value: `${(a.currentPrice / 100).toLocaleString("pt-BR", { maximumFractionDigits: 0 })} pts`,
      changePct: a.dayChangePct,
      href: `/market/${encodeURIComponent(a.ticker)}`,
    }));

  const currencyItems: IndicatorItem[] = currencies
    .filter((a) => a.ticker in ASSET_LABELS)
    .map((a) => ({
      key: `fx-${a.id}`,
      label: ASSET_LABELS[a.ticker],
      value: formatCurrency(a.currentPrice / 100),
      changePct: a.dayChangePct,
      href: `/market/${encodeURIComponent(a.ticker)}`,
    }));

  const macroItems: IndicatorItem[] = macro.map((m) => ({
    key: `macro-${m.slug}`,
    label: m.name,
    value: macroValue(m.value, m.unit),
    sub: m.previousValue != null ? `ant. ${macroValue(m.previousValue, m.unit)}` : null,
  }));

  const items = [...indexItems, ...currencyItems, ...macroItems];

  if (macroLoading && items.length === 0) {
    return <div className="h-[110px] animate-pulse rounded-[20px] border border-[var(--border-color)] bg-[var(--surface)]" />;
  }

  if (items.length === 0) return null;

  return (
    <HeroPanel>
      <div className="grid grid-cols-2 gap-x-6 gap-y-6 sm:grid-cols-3 lg:grid-cols-6 lg:divide-x lg:divide-white/10">
        {items.map((item) => (
          <div key={item.key} className="lg:px-6 lg:first:pl-0 lg:last:pr-0">
            <IndicatorStat item={item} />
          </div>
        ))}
      </div>
    </HeroPanel>
  );
}

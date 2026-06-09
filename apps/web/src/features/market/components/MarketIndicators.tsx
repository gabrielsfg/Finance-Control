"use client";

import Link from "next/link";
import { TrendingUp, TrendingDown } from "lucide-react";
import { useMacroIndicators, useMarketList } from "@/features/market/hooks/useMarket";
import { formatCurrency } from "@/lib/utils/formatCurrency";
import { cn } from "@/lib/utils";

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

function IndicatorChip({ item }: { item: IndicatorItem }) {
  const up = (item.changePct ?? 0) >= 0;

  const inner = (
    <div className="flex w-full flex-col gap-1 px-2.5 py-2">
      <span className="text-text-muted text-[11px] font-medium uppercase tracking-[0.04em]">
        {item.label}
      </span>
      <span className="font-money text-text text-[15px] font-semibold leading-none">
        {item.value}
      </span>
      {item.changePct != null ? (
        <span
          className={cn(
            "flex items-center gap-0.5 font-mono text-[11px] font-medium",
            up ? "text-green" : "text-red",
          )}
        >
          {up ? <TrendingUp size={10} /> : <TrendingDown size={10} />}
          {up ? "+" : ""}{item.changePct.toFixed(2)}%
        </span>
      ) : (
        <span className="text-text-muted font-mono text-[11px]">{item.sub ?? ""}</span>
      )}
    </div>
  );

  return item.href ? (
    <Link href={item.href} className="hover:bg-surface2 block h-full w-full rounded-lg transition-colors">
      {inner}
    </Link>
  ) : (
    <div className="h-full w-full">{inner}</div>
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
    return (
      <div className="border-border bg-surface h-[68px] animate-pulse rounded-2xl border" />
    );
  }

  if (items.length === 0) return null;

  return (
    <div className="border-border bg-surface rounded-2xl border">
      <div className="flex items-stretch overflow-x-auto">
        {items.map((item, i) => (
          <div key={item.key} className="flex min-w-0 flex-1 items-stretch">
            {i > 0 && <div className="border-border/50 my-3 w-px shrink-0 border-l" />}
            <div className="min-w-0 flex-1">
              <IndicatorChip item={item} />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

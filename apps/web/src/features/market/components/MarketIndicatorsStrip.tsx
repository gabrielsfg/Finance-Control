"use client";

import Link from "next/link";
import { useMacroIndicators, useMarketList } from "@/features/market/hooks/useMarket";
import { formatCurrency } from "@/lib/utils/formatCurrency";
import { cn } from "@/lib/utils";

const INDEX_LABELS: Record<string, string> = {
  "^BVSP": "IBOV",
  IFIX: "IFIX",
};

type Chip = {
  key: string;
  label: string;
  value: string;
  changePct?: number | null;
  href?: string;
};

function macroValue(value: number | null, unit: string | null): string {
  if (value == null) return "—";
  const formatted = value.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  const u = (unit ?? "").trim();
  if (!u) return formatted;
  return u.startsWith("%") ? `${formatted}${u}` : `${formatted} ${u}`;
}

function ChipBox({ chip }: { chip: Chip }) {
  const inner = (
    <div className="bg-surface2 flex min-w-[124px] shrink-0 flex-col gap-0.5 rounded-lg px-3.5 py-2">
      <span className="text-text-muted truncate text-[11px] uppercase tracking-[0.04em]">{chip.label}</span>
      <div className="flex items-baseline gap-1.5">
        <span className="font-money text-text text-[14px] font-semibold">{chip.value}</span>
        {chip.changePct != null && (
          <span className={cn("font-mono text-[11px]", chip.changePct >= 0 ? "text-green" : "text-red")}>
            {chip.changePct >= 0 ? "+" : ""}{chip.changePct.toFixed(2)}%
          </span>
        )}
      </div>
    </div>
  );
  return chip.href ? (
    <Link href={chip.href} className="transition-opacity hover:opacity-80">{inner}</Link>
  ) : (
    inner
  );
}

export function MarketIndicatorsStrip() {
  const { data: macro = [], isLoading: macroLoading } = useMacroIndicators();
  const { data: indices = [] } = useMarketList({ type: "Index", sort: "price_desc", limit: 5 });
  const { data: currencies = [] } = useMarketList({ type: "Moeda", sort: "price_desc", limit: 10 });

  const indexChips: Chip[] = indices
    .filter((a) => a.ticker in INDEX_LABELS)
    .map((a) => ({
      key: `idx-${a.id}`,
      label: INDEX_LABELS[a.ticker] ?? a.ticker,
      value: `${(a.currentPrice / 100).toLocaleString("pt-BR", { maximumFractionDigits: 0 })} pts`,
      changePct: a.dayChangePct,
      href: `/market/${encodeURIComponent(a.ticker)}`,
    }));

  const currencyChips: Chip[] = currencies
    .filter((a) => a.ticker === "USD-BRL" || a.ticker === "EUR-BRL")
    .map((a) => ({
      key: `fx-${a.id}`,
      label: a.ticker.replace("-", "/"),
      value: formatCurrency(a.currentPrice / 100),
      changePct: a.dayChangePct,
      href: `/market/${encodeURIComponent(a.ticker)}`,
    }));

  const macroChips: Chip[] = macro.map((m) => ({
    key: `macro-${m.slug}`,
    label: m.name,
    value: macroValue(m.value, m.unit),
  }));

  const chips = [...indexChips, ...currencyChips, ...macroChips];

  if (macroLoading && chips.length === 0) {
    return (
      <div className="border-border bg-surface flex items-stretch gap-2 overflow-x-auto rounded-xl border p-2">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="bg-surface2 h-[52px] min-w-[124px] shrink-0 animate-pulse rounded-lg" />
        ))}
      </div>
    );
  }

  // Nice-to-have: hide entirely if nothing is available yet.
  if (chips.length === 0) return null;

  return (
    <div className="border-border bg-surface flex items-stretch gap-2 overflow-x-auto rounded-xl border p-2">
      {chips.map((chip) => (
        <ChipBox key={chip.key} chip={chip} />
      ))}
    </div>
  );
}

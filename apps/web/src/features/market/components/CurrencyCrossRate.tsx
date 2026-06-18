"use client";

import { useState, useRef, useEffect } from "react";
import { ArrowLeftRight, ChevronDown, Check, Search } from "lucide-react";
import { Card } from "@/components/shared/Card";
import { useMarketList } from "@/features/market/hooks/useMarket";
import type { MarketAsset, MarketAssetDetail } from "@/lib/types/market.types";
import { cn } from "@/lib/utils";

type Props = { asset: MarketAssetDetail };

type Option = { ticker: string; code: string; name: string };

function stripDiacritics(text: string): string {
  return text.normalize("NFD").replace(/\p{Mn}/gu, "");
}

function matchesSearch(q: string, option: Option): boolean {
  const norm = stripDiacritics(q.toLowerCase());
  return (
    stripDiacritics(option.code.toLowerCase()).includes(norm) ||
    stripDiacritics(option.name.toLowerCase()).includes(norm)
  );
}

function toOptions(currencies: MarketAsset[], excludeTicker: string): Option[] {
  return currencies
    .filter((c) => c.ticker !== excludeTicker && c.currentPrice > 0)
    .map((c) => ({
      ticker: c.ticker,
      code: c.ticker.split("-")[0] ?? c.ticker,
      name: c.name,
    }));
}

function CurrencyDropdown({
  options,
  value,
  onChange,
}: {
  options: Option[];
  value: string;
  onChange: (ticker: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const ref = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const selected = options.find((o) => o.ticker === value);

  const filtered = search.trim()
    ? options.filter((o) => matchesSearch(search, o))
    : options;

  function openDropdown() {
    setOpen(true);
    setSearch("");
    setTimeout(() => inputRef.current?.focus(), 0);
  }

  function closeDropdown() {
    setOpen(false);
    setSearch("");
  }

  useEffect(() => {
    function handler(e: MouseEvent) {
      if (!ref.current?.contains(e.target as Node)) closeDropdown();
    }
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => (open ? closeDropdown() : openDropdown())}
        className={cn(
          "flex items-center gap-2 rounded-[13px] border border-[var(--border-color)] bg-[var(--surface)] px-3 py-2 transition-colors hover:border-[var(--brand-cobalt)]",
          open && "border-[var(--brand-cobalt)]",
        )}
      >
        <span className="font-mono text-[13px] font-semibold text-[var(--text)]">{selected?.code ?? "—"}</span>
        <span className="max-w-[130px] truncate text-[12px] text-[var(--text-sub)]">
          {selected?.name.split("/")[0]}
        </span>
        <ChevronDown
          size={13}
          className={cn("shrink-0 text-[var(--text-sub)] transition-transform", open && "rotate-180")}
        />
      </button>

      {open && (
        <div
          className="absolute right-0 top-[calc(100%+6px)] z-30 flex w-[230px] flex-col rounded-[13px] border border-[var(--border-color)] bg-[var(--surface)]"
          style={{ boxShadow: "var(--shadow-sm)" }}
        >
          {/* Search input */}
          <div className="flex items-center gap-2 border-b border-[var(--border-color)] px-3 py-2">
            <Search size={13} className="shrink-0 text-[var(--text-sub)]" />
            <input
              ref={inputRef}
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar moeda..."
              className="flex-1 bg-transparent text-[12px] text-[var(--text)] outline-none placeholder:text-[var(--text-sub)]"
            />
          </div>

          {/* Options list */}
          <div className="max-h-[200px] overflow-y-auto">
            {filtered.length === 0 ? (
              <p className="px-3 py-4 text-center text-[12px] text-[var(--text-sub)]">
                Nenhuma moeda encontrada
              </p>
            ) : (
              filtered.map((o) => (
                <button
                  key={o.ticker}
                  onClick={() => {
                    onChange(o.ticker);
                    closeDropdown();
                  }}
                  className={cn(
                    "flex w-full items-center gap-2.5 px-3 py-2 text-left transition-colors hover:bg-[var(--surface2)]",
                    o.ticker === value && "bg-[var(--surface2)]",
                  )}
                >
                  <span className="w-8 shrink-0 font-mono text-[13px] font-semibold text-[var(--text)]">{o.code}</span>
                  <span className="min-w-0 flex-1 truncate text-[11px] text-[var(--text-sub)]">
                    {o.name.split("/")[0]}
                  </span>
                  {o.ticker === value && <Check size={12} className="shrink-0 text-[var(--brand-accent)]" />}
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export function CurrencyCrossRate({ asset }: Props) {
  const fromCode = asset.ticker.split("-")[0] ?? asset.ticker;

  const { data: currencies = [], isLoading } = useMarketList({
    type: "Moeda",
    sort: "price_desc",
    limit: 100,
  });

  const [selectedTicker, setSelectedTicker] = useState("");

  const options = toOptions(currencies, asset.ticker);

  const effectiveTicker =
    selectedTicker ||
    options.find((o) => o.ticker === "EUR-BRL")?.ticker ||
    options[0]?.ticker ||
    "";

  const selected = currencies.find((c) => c.ticker === effectiveTicker);
  const toCode = effectiveTicker.split("-")[0] ?? "";

  const crossRate =
    selected && selected.currentPrice > 0 && asset.currentPrice > 0
      ? asset.currentPrice / selected.currentPrice
      : null;

  if (isLoading || options.length === 0) return null;

  return (
    <Card>
      <div className="mb-4 flex items-center gap-3">
        <div className="flex flex-1 items-center gap-2">
          <ArrowLeftRight size={15} className="text-[var(--text-sub)]" />
          <h3 className="font-display text-[17px] font-bold tracking-[-0.01em] text-[var(--text)]">Câmbio cruzado</h3>
        </div>
        <CurrencyDropdown
          options={options}
          value={effectiveTicker}
          onChange={setSelectedTicker}
        />
      </div>

      {crossRate !== null && (
        <div className="rounded-[13px] bg-[var(--surface2)] p-4">
          <p className="font-mono text-[28px] font-semibold leading-none tracking-[-0.01em] tabular-nums text-[var(--text)]">
            1 {fromCode} ={" "}
            {crossRate.toLocaleString("pt-BR", {
              minimumFractionDigits: 4,
              maximumFractionDigits: 4,
            })}{" "}
            {toCode}
          </p>
          <p className="mt-2 font-mono text-[12px] tabular-nums text-[var(--text-sub)]">
            1 {toCode} ={" "}
            {(1 / crossRate).toLocaleString("pt-BR", {
              minimumFractionDigits: 4,
              maximumFractionDigits: 4,
            })}{" "}
            {fromCode}
          </p>
        </div>
      )}
    </Card>
  );
}

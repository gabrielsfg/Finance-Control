"use client";

import { useState, useEffect } from "react";
import { BarChart2, Loader2 } from "lucide-react";
import { MarketSearchBar } from "@/features/market/components/MarketSearchBar";
import { MarketSearchResults } from "@/features/market/components/MarketSearchResults";
import { MarketAssetCard } from "@/features/market/components/MarketAssetCard";
import { MarketPriceChart } from "@/features/market/components/MarketPriceChart";
import { useMarketSearch, useMarketAssetDetail } from "@/features/market/hooks/useMarket";
import type { MarketAsset } from "@/lib/types/market.types";

function useDebounce<T>(value: T, delay: number): T {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(t);
  }, [value, delay]);
  return debounced;
}

export function MarketPage() {
  const [query, setQuery]               = useState("");
  const [selectedTicker, setSelectedTicker] = useState<string | null>(null);

  const debouncedQuery = useDebounce(query, 350);

  const { data: searchResults = [], isFetching: isSearching } = useMarketSearch(debouncedQuery);
  const { data: detail, isLoading: isLoadingDetail } = useMarketAssetDetail(selectedTicker ?? "");

  function handleSelect(asset: MarketAsset) {
    setSelectedTicker(asset.ticker);
  }

  const showResults = debouncedQuery.trim().length >= 1;

  return (
    <div className="flex flex-col gap-5">
      <div>
        <h1 className="font-display font-700 text-text text-[22px] tracking-tight">Mercado</h1>
        <p className="text-text-muted mt-0.5 text-[13px]">
          Acompanhe cotações e histórico dos ativos no banco de dados
        </p>
      </div>

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-[360px_1fr]">
        {/* Painel esquerdo: busca + lista */}
        <div className="flex flex-col gap-3">
          <MarketSearchBar value={query} onChange={setQuery} />

          {showResults ? (
            <div className="border-border bg-surface rounded-xl border p-3">
              <MarketSearchResults
                assets={searchResults}
                isLoading={isSearching}
                selectedTicker={selectedTicker}
                onSelect={handleSelect}
              />
            </div>
          ) : (
            <div className="border-border bg-surface flex flex-col items-center justify-center gap-3 rounded-xl border py-12">
              <div className="bg-surface2 flex h-12 w-12 items-center justify-center rounded-2xl">
                <BarChart2 size={22} className="text-text-muted" strokeWidth={1.75} />
              </div>
              <p className="text-text-muted text-center text-[13px]">
                Digite o ticker ou nome do ativo
                <br />
                para pesquisar
              </p>
            </div>
          )}
        </div>

        {/* Painel direito: card + gráfico */}
        <div className="flex flex-col gap-4">
          {isLoadingDetail ? (
            <div className="border-border bg-surface flex h-64 items-center justify-center rounded-xl border">
              <Loader2 size={22} className="text-green animate-spin" />
            </div>
          ) : detail ? (
            <>
              <MarketAssetCard asset={detail} />
              <MarketPriceChart ticker={detail.ticker} history={detail.priceHistory} />
            </>
          ) : (
            <div className="border-border bg-surface flex h-64 flex-col items-center justify-center gap-3 rounded-xl border">
              <div className="bg-surface2 flex h-12 w-12 items-center justify-center rounded-2xl">
                <BarChart2 size={22} className="text-text-muted" strokeWidth={1.75} />
              </div>
              <p className="text-text-sub text-[14px]">Selecione um ativo para ver os detalhes</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

"use client";

import { useState } from "react";
import { BarChart2, Loader2, Building2, TrendingUp, TrendingDown, ChevronRight } from "lucide-react";
import { MarketSearchResults } from "@/features/market/components/MarketSearchResults";
import { MarketAssetCard } from "@/features/market/components/MarketAssetCard";
import { MarketPriceChart } from "@/features/market/components/MarketPriceChart";
import { FundamentalsDrawer } from "@/features/market/components/FundamentalsDrawer";
import { useMarketSearch, useMarketAssetDetail, useMarketList } from "@/features/market/hooks/useMarket";
import { usePageSearch } from "@/lib/hooks/usePageHeader";
import { formatCurrency } from "@/lib/utils/formatCurrency";
import { cn } from "@/lib/utils";
import type { MarketAsset } from "@/lib/types/market.types";

const FUNDAMENTAL_TYPES = new Set([
  "Acao", "BDR", "Stock", "Reit", "ETF", "ETFInternacional", "FundoInvestimento",
]);

const ASSET_TYPE_COLORS: Record<string, string> = {
  Acao: "#00C98D", FundoInvestimento: "#4A9EFF", FII: "#F5A623",
  Cripto: "#F25F5C", Stock: "#00D4A0", Reit: "#7C6FE0",
  BDR: "#F5CE42", ETF: "#4A9EFF", ETFInternacional: "#7C6FE0",
  TesouroDireto: "#00C98D", RendaFixa: "#4A9EFF", Index: "#8A95A3", Outro: "#8A95A3",
};

type FilterTab = { label: string; type?: string; sort: string };

const TABS: FilterTab[] = [
  { label: "Maiores altas",   sort: "change_desc" },
  { label: "Maiores quedas",  sort: "change_asc" },
  { label: "Ações",           type: "Acao",    sort: "price_desc" },
  { label: "FIIs",            type: "FII",     sort: "price_desc" },
  { label: "ETFs",            type: "ETF",     sort: "price_desc" },
  { label: "Cripto",          type: "Cripto",  sort: "price_desc" },
  { label: "BDRs",            type: "BDR",     sort: "price_desc" },
];

function AssetRow({ asset, onSelect, selected }: { asset: MarketAsset; onSelect: () => void; selected: boolean }) {
  const color = ASSET_TYPE_COLORS[asset.assetType] ?? "#8A95A3";
  const isUp = (asset.dayChangePct ?? 0) >= 0;

  return (
    <button
      onClick={onSelect}
      className={cn(
        "flex w-full items-center gap-3 rounded-xl border px-4 py-3 text-left transition-colors",
        selected
          ? "border-green/40 bg-green/8"
          : "border-border bg-surface2 hover:bg-surface hover:border-border",
      )}
    >
      {asset.logoUrl ? (
        <img
          src={asset.logoUrl}
          alt={asset.ticker}
          className="h-9 w-9 shrink-0 rounded-[10px] object-contain bg-white/5"
          onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
        />
      ) : (
        <div
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[10px] text-[10px] font-bold text-white"
          style={{ backgroundColor: color }}
        >
          {asset.ticker.slice(0, 2)}
        </div>
      )}

      <div className="min-w-0 flex-1">
        <p className="text-text text-[13px] font-semibold truncate">{asset.ticker}</p>
        <p className="text-text-muted text-[11px] truncate">{asset.name}</p>
      </div>

      <div className="flex flex-col items-end shrink-0 gap-0.5">
        <span className="font-money text-text text-[13px]">
          {formatCurrency(asset.currentPrice / 100)}
        </span>
        {asset.dayChangePct !== null ? (
          <span className={cn(
            "flex items-center gap-0.5 text-[11px] font-medium font-mono",
            isUp ? "text-green" : "text-red",
          )}>
            {isUp ? <TrendingUp size={10} /> : <TrendingDown size={10} />}
            {isUp ? "+" : ""}{asset.dayChangePct.toFixed(2)}%
          </span>
        ) : (
          <span className="text-text-muted text-[11px]">—</span>
        )}
      </div>

      <ChevronRight size={14} className="text-text-muted shrink-0" />
    </button>
  );
}

function MarketOverview({ onSelect, selectedTicker }: {
  onSelect: (asset: MarketAsset) => void;
  selectedTicker: string | null;
}) {
  const [activeTab, setActiveTab] = useState(0);
  const tab = TABS[activeTab];

  const { data: assets = [], isLoading } = useMarketList({
    type: tab.type,
    sort: tab.sort,
    limit: 20,
  });

  return (
    <div className="flex flex-col gap-3">
      {/* Tab strip */}
      <div className="flex gap-1 overflow-x-auto pb-0.5">
        {TABS.map((t, i) => (
          <button
            key={i}
            onClick={() => setActiveTab(i)}
            className={cn(
              "shrink-0 rounded-lg px-3 py-1.5 text-[12px] font-medium transition-colors",
              activeTab === i
                ? "bg-green/15 text-green"
                : "text-text-muted hover:text-text-sub",
            )}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Asset list */}
      <div className="border-border bg-surface rounded-xl border p-3">
        {isLoading ? (
          <div className="flex items-center justify-center py-10">
            <Loader2 size={18} className="text-green animate-spin" />
          </div>
        ) : assets.length === 0 ? (
          <p className="text-text-muted py-10 text-center text-[13px]">Nenhum ativo disponível.</p>
        ) : (
          <div className="flex flex-col gap-1">
            {assets.map((asset) => (
              <AssetRow
                key={asset.id}
                asset={asset}
                selected={selectedTicker === asset.ticker}
                onSelect={() => onSelect(asset)}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export function MarketPage() {
  const [query, setQuery]                         = useState("");
  const [selectedTicker, setSelectedTicker]       = useState<string | null>(null);
  const [fundamentalsTicker, setFundamentalsTicker] = useState<string | null>(null);

  usePageSearch((q) => setQuery(q), "Buscar ticker ou nome...");

  const { data: searchResults = [], isFetching: isSearching } = useMarketSearch(query);
  const { data: detail, isLoading: isLoadingDetail } = useMarketAssetDetail(selectedTicker ?? "");

  const isSearching_ = query.trim().length >= 1;
  const showFundamentalsBtn = detail && FUNDAMENTAL_TYPES.has(detail.assetType);

  return (
    <div className="flex flex-col gap-5">
      <div>
        <h1 className="font-display font-700 text-text text-[22px] tracking-tight">Mercado</h1>
        <p className="text-text-muted mt-0.5 text-[13px]">
          Cotações e histórico de {isSearching_ ? "resultados da busca" : "ativos em destaque"}
        </p>
      </div>

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-[380px_1fr]">
        {/* Painel esquerdo */}
        <div className="flex flex-col gap-3">
          {isSearching_ ? (
            <div className="border-border bg-surface rounded-xl border p-3">
              <MarketSearchResults
                assets={searchResults}
                isLoading={isSearching}
                selectedTicker={selectedTicker}
                onSelect={(a) => setSelectedTicker(a.ticker)}
              />
            </div>
          ) : (
            <MarketOverview
              selectedTicker={selectedTicker}
              onSelect={(a) => setSelectedTicker(a.ticker)}
            />
          )}
        </div>

        {/* Painel direito */}
        <div className="flex flex-col gap-4">
          {isLoadingDetail ? (
            <div className="border-border bg-surface flex h-64 items-center justify-center rounded-xl border">
              <Loader2 size={22} className="text-green animate-spin" />
            </div>
          ) : detail ? (
            <>
              <MarketAssetCard asset={detail} />
              {showFundamentalsBtn && (
                <button
                  onClick={() => setFundamentalsTicker(detail.ticker)}
                  className="flex items-center gap-2 self-start rounded-lg border border-border bg-surface px-3.5 py-2 text-[13px] text-text-sub transition-colors hover:border-blue/40 hover:text-blue"
                >
                  <Building2 size={14} />
                  Ver fundamentos da empresa
                </button>
              )}
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

      <FundamentalsDrawer
        ticker={fundamentalsTicker}
        assetName={detail?.name}
        onClose={() => setFundamentalsTicker(null)}
      />
    </div>
  );
}

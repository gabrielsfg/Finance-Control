"use client";

import { Loader2 } from "lucide-react";
import { formatCurrency } from "@/lib/utils/formatCurrency";
import { cn } from "@/lib/utils";
import type { MarketAsset } from "@/lib/types/market.types";

const ASSET_TYPE_COLORS: Record<string, string> = {
  Acao:              "#00C98D",
  FundoInvestimento: "#4A9EFF",
  FII:               "#F5A623",
  Cripto:            "#F25F5C",
  Stock:             "#00D4A0",
  Reit:              "#7C6FE0",
  BDR:               "#F5CE42",
  ETF:               "#4A9EFF",
  ETFInternacional:  "#7C6FE0",
  TesouroDireto:     "#00C98D",
  RendaFixa:         "#4A9EFF",
  Outro:             "#8A95A3",
};

type Props = {
  assets: MarketAsset[];
  isLoading: boolean;
  selectedTicker: string | null;
  onSelect: (asset: MarketAsset) => void;
};

export const MarketSearchResults = ({ assets, isLoading, selectedTicker, onSelect }: Props) => {
  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 size={18} className="text-green animate-spin" />
      </div>
    );
  }

  if (assets.length === 0) {
    return (
      <p className="text-text-muted py-8 text-center text-[13px]">
        Nenhum ativo encontrado no banco de dados.
      </p>
    );
  }

  return (
    <div className="flex flex-col gap-1">
      {assets.map((asset) => {
        const color = ASSET_TYPE_COLORS[asset.assetType] ?? "#8A95A3";
        const isUp = (asset.dayChangePct ?? 0) >= 0;
        const isSelected = selectedTicker === asset.ticker;

        return (
          <button
            key={asset.id}
            onClick={() => onSelect(asset)}
            className={cn(
              "border-border flex w-full items-center justify-between rounded-xl border px-4 py-3 text-left transition-colors",
              isSelected
                ? "border-green/40 bg-green/8"
                : "bg-surface2 hover:bg-surface",
            )}
          >
            <div className="flex items-center gap-3 min-w-0">
              {asset.logoUrl ? (
                <img
                  src={asset.logoUrl}
                  alt={asset.ticker}
                  className="h-8 w-8 shrink-0 rounded-[8px] object-contain bg-white/5"
                  onError={(e) => {
                    (e.target as HTMLImageElement).style.display = "none";
                  }}
                />
              ) : (
                <div
                  className="flex h-8 w-8 shrink-0 items-center justify-center rounded-[8px] text-[10px] font-bold text-white"
                  style={{ backgroundColor: color }}
                >
                  {asset.ticker.slice(0, 2)}
                </div>
              )}
              <div className="min-w-0">
                <p className="text-text text-[13px] font-semibold truncate">{asset.ticker}</p>
                <p className="text-text-muted text-[11px] truncate">{asset.name}</p>
              </div>
            </div>

            <div className="flex flex-col items-end shrink-0 ml-3 gap-0.5">
              <span className="font-money text-text text-[13px] font-medium">
                {formatCurrency(asset.currentPrice / 100)}
              </span>
              {asset.dayChangePct !== null ? (
                <span className={cn("font-mono text-[11px] font-medium", isUp ? "text-green" : "text-red")}>
                  {isUp ? "+" : ""}{asset.dayChangePct.toFixed(2)}%
                </span>
              ) : (
                <span className="text-text-muted text-[11px]">—</span>
              )}
            </div>
          </button>
        );
      })}
    </div>
  );
};

"use client";

import { TrendingUp, TrendingDown, Clock } from "lucide-react";
import { formatCurrency } from "@/lib/utils/formatCurrency";
import { cn } from "@/lib/utils";
import type { MarketAssetDetail } from "@/lib/types/market.types";

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
  Moeda:             "#14B8A6",
  Outro:             "#8A95A3",
};

type Props = { asset: MarketAssetDetail };

export const MarketAssetCard = ({ asset }: Props) => {
  const color = ASSET_TYPE_COLORS[asset.assetType] ?? "#8A95A3";
  const isUp = (asset.dayChangePct ?? 0) >= 0;
  const dayChangeAbs = asset.previousClose !== null
    ? Math.abs(asset.currentPrice - asset.previousClose)
    : null;

  const history = asset.priceHistory;
  const weekAgo = history.length >= 5 ? history[history.length - 5] : null;
  const monthAgo = history.length >= 22 ? history[history.length - 22] : null;
  const yearAgo = history.length > 0 ? history[0] : null;

  function calcChange(from: number | undefined, to: number): number | null {
    if (!from || from === 0) return null;
    return ((to - from) / from) * 100;
  }

  const weekChg = weekAgo ? calcChange(weekAgo.price, asset.currentPrice) : null;
  const monthChg = monthAgo ? calcChange(monthAgo.price, asset.currentPrice) : null;
  const yearChg = yearAgo ? calcChange(yearAgo.price, asset.currentPrice) : null;

  const lastUpdate = asset.lastPriceUpdate
    ? new Date(asset.lastPriceUpdate).toLocaleString("pt-BR", {
        day: "2-digit", month: "2-digit", year: "numeric",
        hour: "2-digit", minute: "2-digit",
      })
    : null;

  return (
    <div className="border-border bg-surface rounded-xl border p-5">
      {/* Header: logo + nome + ticker + classe */}
      <div className="mb-5 flex items-start gap-4">
        {asset.logoUrl ? (
          <img
            src={asset.logoUrl}
            alt={asset.ticker}
            className="h-12 w-12 shrink-0 rounded-xl object-contain bg-white/5"
            onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
          />
        ) : (
          <div
            className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl text-sm font-bold text-white"
            style={{ backgroundColor: color }}
          >
            {asset.ticker.slice(0, 2)}
          </div>
        )}
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 flex-wrap">
            <h2 className="font-display font-700 text-text text-[20px] tracking-tight">{asset.ticker}</h2>
            <span
              className="rounded-full px-2 py-0.5 text-[11px] font-medium text-white"
              style={{ backgroundColor: color + "cc" }}
            >
              {asset.assetClass}
            </span>
            <span className="text-text-muted text-[12px]">{asset.currency}</span>
          </div>
          <p className="text-text-sub mt-0.5 text-[13px] truncate">{asset.name}</p>
        </div>
      </div>

      {/* Preço principal + variação dia */}
      <div className="mb-5 flex items-end gap-3 flex-wrap">
        <span className="font-money font-700 text-text text-[32px] leading-none">
          {formatCurrency(asset.currentPrice / 100)}
        </span>
        {asset.dayChangePct !== null && (
          <div className={cn(
            "flex items-center gap-1 rounded-lg px-2.5 py-1.5 mb-0.5",
            isUp ? "bg-green/10" : "bg-red/10",
          )}>
            {isUp
              ? <TrendingUp size={14} className="text-green" />
              : <TrendingDown size={14} className="text-red" />
            }
            <span className={cn("font-mono text-[13px] font-medium", isUp ? "text-green" : "text-red")}>
              {isUp ? "+" : ""}{asset.dayChangePct.toFixed(2)}%
            </span>
            {dayChangeAbs !== null && (
              <span className={cn("font-money text-[12px]", isUp ? "text-green" : "text-red")}>
                ({isUp ? "+" : "-"}{formatCurrency(dayChangeAbs / 100)})
              </span>
            )}
          </div>
        )}
      </div>

      {/* Grade de métricas */}
      <div className="border-border grid grid-cols-2 gap-px rounded-xl border overflow-hidden sm:grid-cols-4">
        {[
          { label: "Fechamento ant.", value: asset.previousClose !== null ? formatCurrency(asset.previousClose / 100) : "—", mono: true },
          { label: "Semana", value: weekChg !== null ? `${weekChg >= 0 ? "+" : ""}${weekChg.toFixed(2)}%` : "—", color: weekChg !== null ? (weekChg >= 0 ? "text-green" : "text-red") : "" },
          { label: "Mês", value: monthChg !== null ? `${monthChg >= 0 ? "+" : ""}${monthChg.toFixed(2)}%` : "—", color: monthChg !== null ? (monthChg >= 0 ? "text-green" : "text-red") : "" },
          { label: "12 meses", value: yearChg !== null ? `${yearChg >= 0 ? "+" : ""}${yearChg.toFixed(2)}%` : "—", color: yearChg !== null ? (yearChg >= 0 ? "text-green" : "text-red") : "" },
        ].map(({ label, value, mono, color: c }) => (
          <div key={label} className="bg-surface2 flex flex-col gap-1 px-4 py-3">
            <p className="text-text-muted text-[10px] uppercase tracking-[0.06em]">{label}</p>
            <p className={cn(
              "text-[14px] font-medium",
              mono ? "font-money text-text" : cn("font-mono", c || "text-text-sub"),
            )}>
              {value}
            </p>
          </div>
        ))}
      </div>

      {/* Última atualização */}
      {lastUpdate && (
        <div className="mt-3 flex items-center gap-1.5">
          <Clock size={11} className="text-text-muted" />
          <p className="text-text-muted text-[11px]">Atualizado em {lastUpdate}</p>
        </div>
      )}
    </div>
  );
};

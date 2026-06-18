"use client";

import { useState } from "react";
import type React from "react";
import { TrendingUp, TrendingDown, Clock } from "lucide-react";
import { Card } from "@/components/shared/Card";
import { Money } from "@/components/shared/Money";
import { cn } from "@/lib/utils";
import type { MarketAssetDetail } from "@/lib/types/market.types";
import { assetColor } from "@/features/market/lib/marketDisplay";

type Props = { asset: MarketAssetDetail; trailing?: React.ReactNode };

export const MarketAssetCard = ({ asset, trailing }: Props) => {
  const [logoError, setLogoError] = useState(false);
  const color = assetColor(asset.assetType);
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
    <Card>
      {/* Header: logo + nome + ticker + classe + trailing */}
      <div className="mb-5 flex items-start gap-4">
        {asset.logoUrl && !logoError ? (
          <img
            src={asset.logoUrl}
            alt={asset.ticker}
            className="h-12 w-12 shrink-0 rounded-[13px] bg-white/5 object-contain"
            onError={() => setLogoError(true)}
          />
        ) : (
          <div
            className="flex h-12 w-12 shrink-0 items-center justify-center rounded-[13px] text-sm font-bold text-white"
            style={{ backgroundColor: color }}
          >
            {asset.ticker.slice(0, 2)}
          </div>
        )}
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="font-display text-[20px] font-bold tracking-[-0.01em] text-[var(--text)]">
              {asset.coinName ?? asset.ticker}
            </h2>
            <span
              className="rounded-full px-[11px] py-[3px] font-mono text-[11px] tracking-[0.06em]"
              style={{
                background: `color-mix(in srgb, ${color} 16%, transparent)`,
                color,
              }}
            >
              {asset.assetClass}
            </span>
            <span className="font-mono text-[12px] tracking-[0.04em] text-[var(--text-sub)]">{asset.currency}</span>
          </div>
          <p className="mt-0.5 truncate text-[13px] text-[var(--text-sub)]">
            {asset.coinName ? asset.ticker : asset.name}
          </p>
        </div>
        {trailing && <div className="shrink-0">{trailing}</div>}
      </div>

      {/* Preço principal + variação dia */}
      <div className="mb-5 flex flex-wrap items-end gap-3">
        <Money cents={asset.currentPrice} className="text-[32px] font-bold leading-none" />
        {asset.dayChangePct !== null && (
          <div
            className="mb-0.5 flex items-center gap-1.5 rounded-[9px] px-2.5 py-1.5"
            style={{
              background: isUp
                ? "color-mix(in srgb, var(--moss) 12%, transparent)"
                : "color-mix(in srgb, var(--clay) 12%, transparent)",
            }}
          >
            {isUp
              ? <TrendingUp size={14} className="text-[var(--moss)]" />
              : <TrendingDown size={14} className="text-[var(--clay)]" />
            }
            <span className={cn("font-mono text-[13px] font-medium tabular-nums", isUp ? "text-[var(--moss)]" : "text-[var(--clay)]")}>
              {isUp ? "+" : ""}{asset.dayChangePct.toFixed(2)}%
            </span>
            {dayChangeAbs !== null && (
              <Money cents={dayChangeAbs} className={cn("text-[12px]", isUp ? "text-[var(--moss)]" : "text-[var(--clay)]")} />
            )}
          </div>
        )}
      </div>

      {/* Grade de métricas */}
      <div className="grid grid-cols-2 gap-px overflow-hidden rounded-[13px] border border-[var(--border-color)] sm:grid-cols-4">
        {[
          { label: "Fechamento ant.", money: asset.previousClose },
          { label: "Semana", value: weekChg },
          { label: "Mês", value: monthChg },
          { label: "12 meses", value: yearChg },
        ].map((m) => {
          const isMoney = "money" in m;
          const pct = isMoney ? null : (m as { value: number | null }).value;
          const pctColor = pct == null ? "text-[var(--text-sub)]" : pct >= 0 ? "text-[var(--moss)]" : "text-[var(--clay)]";
          return (
            <div key={m.label} className="flex flex-col gap-1 bg-[var(--surface2)] px-4 py-3">
              <p className="font-mono text-[10px] uppercase tracking-[0.12em] text-[var(--text-sub)]">{m.label}</p>
              {isMoney ? (
                (m as { money: number | null }).money !== null && (m as { money: number | null }).money !== undefined ? (
                  <Money cents={(m as { money: number | null }).money!} className="text-[14px]" />
                ) : (
                  <p className="font-mono text-[14px] font-medium text-[var(--text-sub)]">—</p>
                )
              ) : (
                <p className={cn("font-mono text-[14px] font-medium tabular-nums", pctColor)}>
                  {pct !== null ? `${pct >= 0 ? "+" : ""}${pct.toFixed(2)}%` : "—"}
                </p>
              )}
            </div>
          );
        })}
      </div>

      {/* Última atualização */}
      {lastUpdate && (
        <div className="mt-3 flex items-center gap-1.5">
          <Clock size={11} className="text-[var(--text-sub)]" />
          <p className="font-mono text-[11px] text-[var(--text-sub)]">Atualizado em {lastUpdate}</p>
        </div>
      )}
    </Card>
  );
};

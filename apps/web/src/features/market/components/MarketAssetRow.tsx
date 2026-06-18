"use client";

import { useState } from "react";
import Link from "next/link";
import { TrendingUp, TrendingDown } from "lucide-react";
import { formatCurrency } from "@/lib/utils/formatCurrency";
import { cn } from "@/lib/utils";
import type { MarketAsset } from "@/lib/types/market.types";
import {
  assetColor,
  formatBigMoney,
  formatYieldFraction,
  formatRatio,
} from "@/features/market/lib/marketDisplay";

export type RowMetric = "change" | "price" | "dy" | "marketcap" | "pl" | "pvp" | "revenue";

function AssetLogo({ asset, size = 36 }: { asset: MarketAsset; size?: number }) {
  const [imgError, setImgError] = useState(false);

  if (asset.logoUrl && !imgError) {
    return (
      <img
        src={asset.logoUrl}
        alt={asset.ticker}
        style={{ height: size, width: size }}
        className="shrink-0 rounded-[10px] bg-white/5 object-contain"
        onError={() => setImgError(true)}
      />
    );
  }
  return (
    <div
      style={{ height: size, width: size, backgroundColor: assetColor(asset.assetType) }}
      className="flex shrink-0 items-center justify-center rounded-[10px] text-[10px] font-bold text-white"
    >
      {asset.ticker.slice(0, 2)}
    </div>
  );
}

function ChangePill({ pct }: { pct: number | null }) {
  if (pct == null) return <span className="font-mono text-[11px] text-[var(--text-sub)]">—</span>;
  const up = pct >= 0;
  return (
    <span className={cn("flex items-center justify-end gap-0.5 font-mono text-[12px] font-medium tabular-nums", up ? "text-[var(--moss)]" : "text-[var(--clay)]")}>
      {up ? <TrendingUp size={11} /> : <TrendingDown size={11} />}
      {up ? "+" : ""}{pct.toFixed(2)}%
    </span>
  );
}

function MetricValue({ asset, metric }: { asset: MarketAsset; metric: RowMetric }) {
  const price = (
    <span className="font-mono text-[13px] tabular-nums text-[var(--text)]">{formatCurrency(asset.currentPrice / 100)}</span>
  );

  switch (metric) {
    case "dy":
      return (
        <div className="flex flex-col items-end gap-0.5">
          <span className="font-mono text-[13px] font-semibold tabular-nums text-[var(--moss)]">{formatYieldFraction(asset.dividendYield)}</span>
          {price}
        </div>
      );
    case "marketcap":
      return (
        <div className="flex flex-col items-end gap-0.5">
          <span className="font-mono text-[13px] font-semibold tabular-nums text-[var(--text)]">{formatBigMoney(asset.marketCap)}</span>
          {price}
        </div>
      );
    case "revenue":
      return (
        <div className="flex flex-col items-end gap-0.5">
          <span className="font-mono text-[13px] font-semibold tabular-nums text-[var(--text)]">{formatBigMoney(asset.totalRevenue)}</span>
          {price}
        </div>
      );
    case "pl":
      return (
        <div className="flex flex-col items-end gap-0.5">
          <span className="font-mono text-[13px] font-semibold tabular-nums text-[var(--text)]">{formatRatio(asset.priceToEarnings)}</span>
          {price}
        </div>
      );
    case "pvp":
      return (
        <div className="flex flex-col items-end gap-0.5">
          <span className="font-mono text-[13px] font-semibold tabular-nums text-[var(--text)]">{formatRatio(asset.priceToBook)}</span>
          {price}
        </div>
      );
    case "price":
      return <div className="flex flex-col items-end gap-0.5">{price}</div>;
    case "change":
    default:
      return (
        <div className="flex flex-col items-end gap-0.5">
          {price}
          <ChangePill pct={asset.dayChangePct} />
        </div>
      );
  }
}

type Props = {
  asset: MarketAsset;
  metric?: RowMetric;
  rank?: number;
};

export function MarketAssetRow({ asset, metric = "change", rank }: Props) {
  return (
    <Link
      href={`/market/${encodeURIComponent(asset.ticker)}`}
      className="flex w-full items-center gap-3 rounded-[13px] border border-transparent px-3.5 py-2.5 text-left transition-colors hover:border-[var(--border-color)] hover:bg-[var(--surface2)]"
    >
      {rank != null && (
        <span className="w-4 shrink-0 text-center font-mono text-[12px] tabular-nums text-[var(--text-sub)]">{rank}</span>
      )}
      <AssetLogo asset={asset} />
      <div className="min-w-0 flex-1">
        <p className="truncate font-mono text-[13px] font-semibold text-[var(--text)]">{asset.coinName ?? asset.ticker}</p>
        <p className="truncate text-[12px] text-[var(--text-sub)]">{asset.coinName ? asset.ticker : asset.name}</p>
      </div>
      <div className="shrink-0">
        <MetricValue asset={asset} metric={metric} />
      </div>
    </Link>
  );
}

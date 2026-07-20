"use client";

import type { MarketAsset } from "@/lib/types/market.types";
import { MarketAssetRow, type RowMetric } from "@/features/market/components/MarketAssetRow";

/** Vertical list of asset rows (the full-list "table" on the market type page). */
export function MarketAssetTable({
  assets,
  metric = "change",
}: {
  assets: MarketAsset[];
  metric?: RowMetric;
}) {
  return (
    <div className="flex flex-col">
      {assets.map((asset) => (
        <MarketAssetRow key={asset.ticker} asset={asset} metric={metric} />
      ))}
    </div>
  );
}

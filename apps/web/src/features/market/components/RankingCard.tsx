"use client";

import Link from "next/link";
import { Loader2, ChevronRight } from "lucide-react";
import { useMarketList } from "@/features/market/hooks/useMarket";
import { MarketAssetRow, type RowMetric } from "@/features/market/components/MarketAssetRow";

type Props = {
  title: string;
  icon?: React.ReactNode;
  sort: string;
  type?: string;
  metric: RowMetric;
  limit?: number;
};

export function RankingCard({ title, icon, sort, type, metric, limit = 6 }: Props) {
  const { data: assets = [], isLoading } = useMarketList({ type, sort, limit });

  const rankingHref = `/market/ranking/${sort}${type ? `?type=${type}` : ""}`;

  return (
    <div className="border-border bg-surface flex flex-col rounded-2xl border">
      <div className="border-border flex items-center justify-between border-b px-4 py-3">
        <div className="flex items-center gap-2">
          {icon}
          <h3 className="text-text text-[14px] font-semibold">{title}</h3>
        </div>
        <Link
          href={rankingHref}
          className="text-text-muted hover:text-green flex items-center gap-0.5 text-[12px] font-medium transition-colors"
        >
          Ver ranking
          <ChevronRight size={13} />
        </Link>
      </div>

      <div className="flex flex-col gap-1 p-2.5">
        {isLoading ? (
          <div className="flex items-center justify-center py-10">
            <Loader2 size={18} className="text-green animate-spin" />
          </div>
        ) : assets.length === 0 ? (
          <p className="text-text-muted py-10 text-center text-[12px]">Sem dados ainda.</p>
        ) : (
          assets.map((asset, i) => (
            <MarketAssetRow key={asset.id} asset={asset} metric={metric} rank={i + 1} />
          ))
        )}
      </div>
    </div>
  );
}

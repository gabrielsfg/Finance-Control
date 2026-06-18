"use client";

import Link from "next/link";
import { Loader2 } from "lucide-react";
import type { ReactNode } from "react";
import { Card } from "@/components/shared/Card";
import { useMarketList } from "@/features/market/hooks/useMarket";
import { MarketAssetRow, type RowMetric } from "@/features/market/components/MarketAssetRow";

type Props = {
  title: string;
  icon?: ReactNode;
  sort: string;
  type?: string;
  metric: RowMetric;
  limit?: number;
};

export function RankingCard({ title, icon, sort, type, metric, limit = 6 }: Props) {
  const { data: assets = [], isLoading } = useMarketList({ type, sort, limit });

  const rankingHref = `/market/ranking/${sort}${type ? `?type=${type}` : ""}`;

  return (
    <Card className="flex flex-col">
      <div className="mb-4 flex items-center gap-2.5">
        {icon && <span className="flex items-center">{icon}</span>}
        <h3 className="font-display text-[17px] font-bold tracking-[-0.01em] text-[var(--text)]">{title}</h3>
        <Link
          href={rankingHref}
          className="ml-auto font-mono text-[11px] uppercase tracking-[0.1em] text-[var(--brand-accent)] hover:underline"
        >
          Ver ranking
        </Link>
      </div>

      <div className="flex flex-col">
        {isLoading ? (
          <div className="flex items-center justify-center py-10">
            <Loader2 size={18} className="animate-spin text-[var(--brand-accent)]" />
          </div>
        ) : assets.length === 0 ? (
          <p className="py-10 text-center font-mono text-[12px] text-[var(--text-sub)]">Sem dados ainda.</p>
        ) : (
          assets.map((asset, i) => (
            <MarketAssetRow key={asset.id} asset={asset} metric={metric} rank={i + 1} />
          ))
        )}
      </div>
    </Card>
  );
}

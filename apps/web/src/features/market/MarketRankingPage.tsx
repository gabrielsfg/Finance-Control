"use client";

import { useState, Suspense } from "react";
import { useParams, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Loader2 } from "lucide-react";
import { PageTopbar } from "@/components/layout/PageTopbar";
import { Card } from "@/components/shared/Card";
import { PillSelect } from "@/components/shared/PillSelect";
import { MarketAssetRow, type RowMetric } from "@/features/market/components/MarketAssetRow";
import { useMarketList } from "@/features/market/hooks/useMarket";
import { usePageSearch, usePageFilter } from "@/lib/hooks/usePageHeader";

type RankingMeta = { title: string; metric: RowMetric; fundamental?: boolean };

const RANKING_META: Record<string, RankingMeta> = {
  change_desc:    { title: "Maiores altas",          metric: "change" },
  change_asc:     { title: "Maiores quedas",         metric: "change" },
  price_desc:     { title: "Em destaque",            metric: "change" },
  dy_desc:        { title: "Maiores dividendos",     metric: "dy",        fundamental: true },
  marketcap_desc: { title: "Maior valor de mercado", metric: "marketcap", fundamental: true },
  revenue_desc:   { title: "Maiores receitas",       metric: "revenue",   fundamental: true },
  pl_asc:         { title: "Menores P/L",            metric: "pl",        fundamental: true },
  pvp_asc:        { title: "Menores P/VP",           metric: "pvp",       fundamental: true },
};

const TYPE_OPTIONS = [
  { value: "all", label: "Todas" },
  { value: "Acao", label: "Ações" },
  { value: "FII", label: "FIIs" },
  { value: "ETF", label: "ETFs" },
  { value: "Cripto", label: "Cripto" },
  { value: "BDR", label: "BDRs" },
  { value: "Moeda", label: "Moedas" },
  { value: "TesouroDireto", label: "Tesouro" },
];

export function MarketRankingPage() {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center py-20">
          <Loader2 size={20} className="animate-spin text-[var(--brand-accent)]" />
        </div>
      }
    >
      <RankingContent />
    </Suspense>
  );
}

function RankingContent() {
  const params = useParams();
  const searchParams = useSearchParams();
  const sort = (Array.isArray(params.sort) ? params.sort[0] : params.sort) ?? "change_desc";
  const meta = RANKING_META[sort] ?? RANKING_META.change_desc;

  const initialType = searchParams.get("type") ?? "all";
  const [type, setType] = useState(initialType);
  const [search, setSearch] = useState("");

  usePageSearch(setSearch, "Buscar ticker ou nome...");
  usePageFilter(<PillSelect options={TYPE_OPTIONS} value={type} onChange={setType} />);

  const { data: assets = [], isLoading } = useMarketList({
    type: type === "all" ? undefined : type,
    sort,
    limit: 50,
  });

  const filtered = search.trim()
    ? assets.filter((a) => {
        const q = search.trim().toLowerCase();
        return a.ticker.toLowerCase().includes(q) || a.name.toLowerCase().includes(q);
      })
    : assets;

  return (
    <div className="px-[clamp(20px,3.4vw,46px)] pb-[60px]">
      <PageTopbar
        title={meta.title}
        subtitle={
          <Link href="/market" className="font-mono text-[11px] uppercase tracking-[0.08em] text-[var(--text-sub)] hover:text-[var(--brand-accent)]">
            Cotações / Ranking
          </Link>
        }
      />

      <Card className="flex flex-col p-[16px_6px_8px]">
        {isLoading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 size={20} className="animate-spin text-[var(--brand-accent)]" />
          </div>
        ) : filtered.length === 0 ? (
          <p className="py-16 text-center font-mono text-[13px] text-[var(--text-sub)]">
            {search.trim()
              ? `Nenhum resultado para "${search}"`
              : meta.fundamental
              ? "Sem dados fundamentalistas para este filtro ainda."
              : "Nenhum ativo disponível."}
          </p>
        ) : (
          <div className="flex flex-col">
            {filtered.map((asset, i) => (
              <MarketAssetRow key={asset.id} asset={asset} metric={meta.metric} rank={i + 1} />
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}

"use client";

import { useState, Suspense } from "react";
import { useParams, useSearchParams } from "next/navigation";
import { Loader2 } from "lucide-react";
import { PillSelect } from "@/components/shared/PillSelect";
import { MarketAssetRow, type RowMetric } from "@/features/market/components/MarketAssetRow";
import { useMarketList } from "@/features/market/hooks/useMarket";
import { usePageSearch } from "@/lib/hooks/usePageHeader";

type RankingMeta = { title: string; metric: RowMetric; fundamental?: boolean };

const RANKING_META: Record<string, RankingMeta> = {
  change_desc:    { title: "Maiores altas",          metric: "change" },
  change_asc:     { title: "Maiores quedas",         metric: "change" },
  price_desc:     { title: "Em destaque",            metric: "change" },
  dy_desc:        { title: "Maiores Rendimento de Dividendos", metric: "dy",        fundamental: true },
  marketcap_desc: { title: "Maior Valor de Mercado", metric: "marketcap", fundamental: true },
  revenue_desc:   { title: "Maiores Receitas",       metric: "revenue",   fundamental: true },
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
          <Loader2 size={20} className="text-green animate-spin" />
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
    <div className="flex flex-col gap-5">
      <div className="flex items-center justify-between gap-3">
        <h1 className="font-display font-700 text-text text-[22px] tracking-tight">{meta.title}</h1>
        <PillSelect options={TYPE_OPTIONS} value={type} onChange={setType} />
      </div>

      <div className="border-border bg-surface rounded-2xl border p-2.5">
        {isLoading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 size={20} className="text-green animate-spin" />
          </div>
        ) : filtered.length === 0 ? (
          <p className="text-text-muted py-16 text-center text-[13px]">
            {search.trim()
              ? `Nenhum resultado para "${search}"`
              : meta.fundamental
              ? "Sem dados fundamentalistas para este filtro ainda."
              : "Nenhum ativo disponível."}
          </p>
        ) : (
          <div className="flex flex-col gap-1">
            {filtered.map((asset, i) => (
              <MarketAssetRow key={asset.id} asset={asset} metric={meta.metric} rank={i + 1} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

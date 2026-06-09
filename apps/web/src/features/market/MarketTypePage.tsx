"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  TrendingUp,
  TrendingDown,
  Building2,
  DollarSign,
  BarChart2,
  Globe,
  Landmark,
  Coins,
  CandlestickChart,
  Search,
  Loader2,
  ChevronLeft,
  ChevronRight,
  type LucideIcon,
} from "lucide-react";
import { RankingCard } from "@/features/market/components/RankingCard";
import { MarketAssetRow } from "@/features/market/components/MarketAssetRow";
import { useMarketList } from "@/features/market/hooks/useMarket";
import { cn } from "@/lib/utils";

const PAGE_SIZE = 100;

type SlugMeta = {
  type: string;
  label: string;
  description: string;
  icon: LucideIcon;
  color: string;
};

const SLUG_META: Record<string, SlugMeta> = {
  acoes:   { type: "Acao",          label: "Ações",    description: "Ações brasileiras listadas na B3",  icon: CandlestickChart, color: "#00C98D" },
  fiis:    { type: "FII",           label: "FIIs",     description: "Fundos de Investimento Imobiliário", icon: Building2,        color: "#F5A623" },
  etfs:    { type: "ETF",           label: "ETFs",     description: "Exchange-Traded Funds",              icon: BarChart2,        color: "#4A9EFF" },
  cripto:  { type: "Cripto",        label: "Cripto",   description: "Criptomoedas",                       icon: Coins,            color: "#F5CE42" },
  moedas:  { type: "Moeda",         label: "Moedas",   description: "Câmbio e pares de moedas",          icon: DollarSign,       color: "#7C6FE0" },
  bdrs:    { type: "BDR",           label: "BDRs",     description: "Brazilian Depositary Receipts",      icon: Globe,            color: "#00D4A0" },
  tesouro: { type: "TesouroDireto", label: "Tesouro",  description: "Títulos do Tesouro Direto",         icon: Landmark,         color: "#4A9EFF" },
};

function stripDiacritics(text: string): string {
  return text.normalize("NFD").replace(/\p{Mn}/gu, "");
}

const CURRENCY_NAMES: Record<string, string> = {
  USD: "dolar americano",
  EUR: "euro",
  GBP: "libra esterlina",
  JPY: "iene japones",
  BRL: "real brasileiro",
  ARS: "peso argentino",
  CAD: "dolar canadense",
  AUD: "dolar australiano",
  CHF: "franco suico",
  CNY: "yuan chines",
  MXN: "peso mexicano",
  CLP: "peso chileno",
  COP: "peso colombiano",
  PEN: "sol peruano",
  UYU: "peso uruguaio",
  ZAR: "rand sul africano",
  RUB: "rublo russo",
  INR: "rupia indiana",
  KRW: "won coreano",
  NOK: "coroa norueguesa",
  SEK: "coroa sueca",
  DKK: "coroa dinamarquesa",
  NZD: "dolar nova zelandia",
  TRY: "lira turca",
  SGD: "dolar cingapura",
  HKD: "dolar hong kong",
  BTC: "bitcoin",
  ETH: "ethereum",
};

function matchesSearch(q: string, ticker: string, name: string): boolean {
  const norm = stripDiacritics(q.toLowerCase());
  if (stripDiacritics(ticker.toLowerCase()).includes(norm)) return true;
  if (stripDiacritics(name.toLowerCase()).includes(norm)) return true;
  return ticker.toUpperCase().split(/[-/]/).some((code) => {
    const alias = CURRENCY_NAMES[code];
    return alias ? stripDiacritics(alias).includes(norm) : false;
  });
}

export function MarketTypePage() {
  const params = useParams();
  const slug = (Array.isArray(params.slug) ? params.slug[0] : params.slug) ?? "";
  const meta = SLUG_META[slug];

  const [search, setSearch] = useState("");
  const [page, setPage] = useState(0);

  // Reset to first page whenever search or slug changes
  useEffect(() => { setPage(0); }, [search, slug]);

  // Hook must be before any early return — use fallback type when slug is unknown.
  const { data: allAssets = [], isLoading } = useMarketList({
    type: meta?.type ?? "Acao",
    sort: "price_desc",
    limit: 2000,
  });

  if (!meta) {
    return (
      <div className="flex flex-col gap-5">
        <Link
          href="/market"
          className="text-text-muted hover:text-text flex w-fit items-center gap-1.5 text-[13px] transition-colors"
        >
          <ArrowLeft size={15} />
          Voltar ao mercado
        </Link>
        <div className="border-border bg-surface flex h-64 items-center justify-center rounded-2xl border">
          <p className="text-text-sub text-[14px]">Tipo de ativo não encontrado.</p>
        </div>
      </div>
    );
  }

  const Icon = meta.icon;

  const filtered = search.trim()
    ? allAssets.filter((a) => matchesSearch(search.trim(), a.ticker, a.name))
    : allAssets;

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const safePage = Math.min(page, totalPages - 1);
  const pageItems = filtered.slice(safePage * PAGE_SIZE, (safePage + 1) * PAGE_SIZE);

  return (
    <div className="flex flex-col gap-5">
      <Link
        href="/market"
        className="text-text-muted hover:text-text flex w-fit items-center gap-1.5 text-[13px] transition-colors"
      >
        <ArrowLeft size={15} />
        Voltar ao mercado
      </Link>

      {/* Header */}
      <div className="flex items-center gap-3">
        <div
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl"
          style={{ backgroundColor: `${meta.color}18` }}
        >
          <Icon size={20} strokeWidth={1.75} style={{ color: meta.color }} />
        </div>
        <div>
          <h1 className="font-display font-700 text-text text-[22px] tracking-tight">{meta.label}</h1>
          <p className="text-text-muted text-[13px]">{meta.description}</p>
        </div>
      </div>

      {/* Rankings */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <RankingCard
          title="Maiores altas hoje"
          icon={<TrendingUp size={15} className="text-green" />}
          sort="change_desc"
          type={meta.type}
          metric="change"
          limit={6}
        />
        <RankingCard
          title="Maiores quedas hoje"
          icon={<TrendingDown size={15} className="text-red" />}
          sort="change_asc"
          type={meta.type}
          metric="change"
          limit={6}
        />
      </div>

      {/* Full list */}
      <div className="border-border bg-surface rounded-2xl border">
        {/* Header */}
        <div className="border-border flex items-center gap-3 border-b px-4 py-3">
          <h3 className="text-text flex-1 text-[14px] font-semibold">
            Todos
            {!isLoading && (
              <span className="text-text-muted ml-1.5 text-[13px] font-normal">
                {search.trim()
                  ? `(${filtered.length} de ${allAssets.length})`
                  : `(${allAssets.length})`}
              </span>
            )}
          </h3>
          <div
            className={cn(
              "border-border bg-surface2 flex items-center gap-2 rounded-lg border px-2.5 py-1.5 transition-colors",
              search && "border-green/50",
            )}
          >
            <Search size={13} className="text-text-muted shrink-0" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar ticker ou nome..."
              className="text-text placeholder:text-text-muted w-[180px] bg-transparent text-[13px] outline-none"
            />
          </div>
        </div>

        {/* Rows */}
        <div className="flex flex-col gap-1 p-2.5">
          {isLoading ? (
            <div className="flex items-center justify-center py-16">
              <Loader2 size={20} className="text-green animate-spin" />
            </div>
          ) : filtered.length === 0 ? (
            <p className="text-text-muted py-16 text-center text-[13px]">
              {search.trim()
                ? `Nenhum resultado para "${search}"`
                : "Nenhum ativo disponível."}
            </p>
          ) : (
            pageItems.map((asset) => (
              <MarketAssetRow key={asset.id} asset={asset} metric="change" />
            ))
          )}
        </div>

        {/* Pagination */}
        {!isLoading && filtered.length > PAGE_SIZE && (
          <div className="border-border flex items-center justify-between border-t px-4 py-3">
            <span className="text-text-muted text-[13px]">
              Página {safePage + 1} de {totalPages}
              <span className="ml-1.5">
                ({safePage * PAGE_SIZE + 1}–{Math.min((safePage + 1) * PAGE_SIZE, filtered.length)} de {filtered.length})
              </span>
            </span>
            <div className="flex items-center gap-1">
              <button
                onClick={() => setPage((p) => Math.max(0, p - 1))}
                disabled={safePage === 0}
                className={cn(
                  "flex h-7 w-7 items-center justify-center rounded-lg transition-colors",
                  safePage === 0
                    ? "text-text-muted cursor-not-allowed opacity-40"
                    : "text-text-sub hover:bg-surface2 hover:text-text",
                )}
              >
                <ChevronLeft size={15} />
              </button>
              <button
                onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
                disabled={safePage === totalPages - 1}
                className={cn(
                  "flex h-7 w-7 items-center justify-center rounded-lg transition-colors",
                  safePage === totalPages - 1
                    ? "text-text-muted cursor-not-allowed opacity-40"
                    : "text-text-sub hover:bg-surface2 hover:text-text",
                )}
              >
                <ChevronRight size={15} />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

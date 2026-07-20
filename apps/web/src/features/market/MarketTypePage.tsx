"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import {
  TrendingUp,
  TrendingDown,
  Building2,
  DollarSign,
  BarChart2,
  Globe,
  Landmark,
  Coins,
  CandlestickChart,
  Loader2,
  ChevronLeft,
  ChevronRight,
  Clock,
  type LucideIcon,
} from "lucide-react";
import { PageTopbar } from "@/components/layout/PageTopbar";
import { Card } from "@/components/shared/Card";
import { RankingCard } from "@/features/market/components/RankingCard";
import { MarketAssetTable } from "@/features/market/components/MarketAssetTable";
import { useMarketList } from "@/features/market/hooks/useMarket";
import { usePageSearch } from "@/lib/hooks/usePageHeader";
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
  acoes:   { type: "Acao",          label: "Ações",    description: "Ações brasileiras listadas na B3",  icon: CandlestickChart, color: "var(--moss)" },
  fiis:    { type: "FII",           label: "FIIs",     description: "Fundos de Investimento Imobiliário", icon: Building2,        color: "var(--gold)" },
  etfs:    { type: "ETF",           label: "ETFs",     description: "Exchange-Traded Funds",              icon: BarChart2,        color: "var(--brand-accent)" },
  cripto:  { type: "Cripto",        label: "Cripto",   description: "Criptomoedas",                       icon: Coins,            color: "var(--gold)" },
  moedas:  { type: "Moeda",         label: "Moedas",   description: "Câmbio e pares de moedas",          icon: DollarSign,       color: "var(--moss-lift)" },
  bdrs:    { type: "BDR",           label: "BDRs",     description: "Brazilian Depositary Receipts",      icon: Globe,            color: "var(--brand-accent)" },
  tesouro: { type: "TesouroDireto", label: "Tesouro",  description: "Títulos do Tesouro Direto",         icon: Landmark,         color: "var(--brand-accent)" },
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

  usePageSearch(setSearch, `Buscar em ${meta?.label ?? "ativos"}...`);

  // Reset to first page whenever search or slug changes
  useEffect(() => { setPage(0); }, [search, slug]);

  // Hook must be before any early return — use fallback type when slug is unknown.
  const { data: allAssets = [], isLoading } = useMarketList({
    type: meta?.type ?? "Acao",
    sort: "price_desc",
    limit: 2000,
  });

  const syncTime = (() => {
    const iso = allAssets[0]?.lastPriceUpdate;
    if (!iso) return null;
    const d = new Date(iso);
    const now = new Date();
    if (d.toDateString() === now.toDateString())
      return d.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
    return d.toLocaleString("pt-BR", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" });
  })();

  if (!meta) {
    return (
      <div className="px-[clamp(20px,3.4vw,46px)] pb-[60px]">
        <PageTopbar title="Cotações" />
        <Card className="flex h-64 items-center justify-center">
          <p className="text-[14px] text-[var(--text-sub)]">Tipo de ativo não encontrado.</p>
        </Card>
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

  const countLabel = isLoading
    ? "—"
    : search.trim()
    ? `${filtered.length} de ${allAssets.length}`
    : `${allAssets.length}`;

  return (
    <div className="px-[clamp(20px,3.4vw,46px)] pb-[60px]">
      <PageTopbar
        title={
          <span className="flex items-center gap-3">
            <span
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[13px]"
              style={{ backgroundColor: "color-mix(in srgb, " + meta.color + " 14%, transparent)" }}
            >
              <Icon size={20} strokeWidth={1.75} style={{ color: meta.color }} />
            </span>
            {meta.label}
          </span>
        }
        subtitle={
          syncTime ? (
            <span className="inline-flex items-center gap-1.5">
              <Clock size={12} strokeWidth={1.75} />
              {meta.description} · sincronizado às {syncTime}
            </span>
          ) : (
            meta.description
          )
        }
      />

      <div className="flex flex-col gap-5">
        {/* Rankings */}
        <div className="grid grid-cols-1 gap-[22px] lg:grid-cols-2">
          <RankingCard
            title="Maiores altas hoje"
            icon={<TrendingUp size={16} className="text-[var(--moss)]" />}
            sort="change_desc"
            type={meta.type}
            metric="change"
            limit={6}
          />
          <RankingCard
            title="Maiores quedas hoje"
            icon={<TrendingDown size={16} className="text-[var(--clay)]" />}
            sort="change_asc"
            type={meta.type}
            metric="change"
            limit={6}
          />
        </div>

        {/* Full list */}
        <Card className="flex flex-col p-[16px_6px_8px]">
          <div className="mb-2 flex items-center gap-2.5 px-[10px]">
            <h3 className="font-display text-[17px] font-bold tracking-[-0.01em] text-[var(--text)]">Todos</h3>
            <span className="font-mono text-[12px] tabular-nums text-[var(--text-sub)]">({countLabel})</span>
          </div>

          {isLoading ? (
            <div className="flex items-center justify-center py-16">
              <Loader2 size={20} className="animate-spin text-[var(--brand-accent)]" />
            </div>
          ) : filtered.length === 0 ? (
            <p className="py-16 text-center font-mono text-[13px] text-[var(--text-sub)]">
              {search.trim()
                ? `Nenhum resultado para "${search}"`
                : "Nenhum ativo disponível."}
            </p>
          ) : (
            <MarketAssetTable assets={pageItems} />
          )}

          {/* Pagination */}
          {!isLoading && filtered.length > PAGE_SIZE && (
            <div className="mt-3 flex items-center justify-between px-[10px] pb-1">
              <span className="font-mono text-[12px] tabular-nums text-[var(--text-sub)]">
                {safePage * PAGE_SIZE + 1}–{Math.min((safePage + 1) * PAGE_SIZE, filtered.length)} de {filtered.length}
              </span>
              <div className="flex items-center gap-1.5 font-mono text-[12px] text-[var(--text-sub)]">
                <button
                  onClick={() => setPage((p) => Math.max(0, p - 1))}
                  disabled={safePage === 0}
                  className={cn(
                    "flex h-[30px] w-[30px] items-center justify-center rounded-[9px] border border-[var(--border-color)] bg-[var(--surface)] transition-colors",
                    safePage === 0
                      ? "cursor-not-allowed opacity-40"
                      : "hover:bg-[var(--surface2)] hover:text-[var(--text)]",
                  )}
                >
                  <ChevronLeft size={15} />
                </button>
                <span className="px-1 tabular-nums">
                  {safePage + 1} / {totalPages}
                </span>
                <button
                  onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
                  disabled={safePage === totalPages - 1}
                  className={cn(
                    "flex h-[30px] w-[30px] items-center justify-center rounded-[9px] border border-[var(--border-color)] bg-[var(--surface)] transition-colors",
                    safePage === totalPages - 1
                      ? "cursor-not-allowed opacity-40"
                      : "hover:bg-[var(--surface2)] hover:text-[var(--text)]",
                  )}
                >
                  <ChevronRight size={15} />
                </button>
              </div>
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}

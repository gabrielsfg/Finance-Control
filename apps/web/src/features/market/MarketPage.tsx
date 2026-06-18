"use client";

import { useState } from "react";
import { TrendingUp, TrendingDown, Coins, Building2, Sparkles, Clock } from "lucide-react";
import { PageTopbar } from "@/components/layout/PageTopbar";
import { PillSelect } from "@/components/shared/PillSelect";
import { MarketIndicators } from "@/features/market/components/MarketIndicators";
import { RankingCard } from "@/features/market/components/RankingCard";
import { usePageSearch, usePageFilter } from "@/lib/hooks/usePageHeader";
import { useMarketList } from "@/features/market/hooks/useMarket";

function formatSyncTime(iso: string | null | undefined): string | null {
  if (!iso) return null;
  const d = new Date(iso);
  const now = new Date();
  const isToday = d.toDateString() === now.toDateString();
  if (isToday) return d.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
  return d.toLocaleString("pt-BR", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" });
}

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

// Types that carry fundamentals (DY / market cap rankings are meaningful for these).
const EQUITY_TYPES = new Set(["all", "Acao", "FII", "ETF", "BDR", "Stock", "FundoInvestimento"]);

export function MarketPage() {
  const [type, setType] = useState("all");

  usePageSearch();
  usePageFilter(<PillSelect options={TYPE_OPTIONS} value={type} onChange={setType} />);

  const { data: probe } = useMarketList({ limit: 1 });
  const syncTime = formatSyncTime(probe?.[0]?.lastPriceUpdate);

  const typeParam = type === "all" ? undefined : type;
  const showFundamentals = EQUITY_TYPES.has(type);

  const subtitle = syncTime ? (
    <span className="inline-flex items-center gap-1.5">
      <Clock size={12} strokeWidth={1.75} />
      Rankings e indicadores · sincronizado às {syncTime}
    </span>
  ) : (
    "Rankings e indicadores de ações, FIIs, ETFs, cripto, moedas e Tesouro"
  );

  return (
    <div className="px-[clamp(20px,3.4vw,46px)] pb-[60px]">
      <PageTopbar title="Cotações" subtitle={subtitle} />

      <div className="flex flex-col gap-5">
        <MarketIndicators />

        <div className="grid grid-cols-1 gap-[22px] lg:grid-cols-2">
          <RankingCard
            title="Maiores altas"
            icon={<TrendingUp size={16} className="text-[var(--moss)]" />}
            sort="change_desc"
            type={typeParam}
            metric="change"
          />
          <RankingCard
            title="Maiores quedas"
            icon={<TrendingDown size={16} className="text-[var(--clay)]" />}
            sort="change_asc"
            type={typeParam}
            metric="change"
          />

          {showFundamentals ? (
            <>
              <RankingCard
                title="Maiores dividendos"
                icon={<Coins size={16} className="text-[var(--moss)]" />}
                sort="dy_desc"
                type={typeParam}
                metric="dy"
              />
              <RankingCard
                title="Maior valor de mercado"
                icon={<Building2 size={16} className="text-[var(--brand-accent)]" />}
                sort="marketcap_desc"
                type={typeParam}
                metric="marketcap"
              />
            </>
          ) : (
            <RankingCard
              title="Em destaque"
              icon={<Sparkles size={16} className="text-[var(--gold)]" />}
              sort="price_desc"
              type={typeParam}
              metric="change"
            />
          )}
        </div>
      </div>
    </div>
  );
}

"use client";

import { useState } from "react";
import { TrendingUp, TrendingDown, Coins, Building2, Sparkles, Clock } from "lucide-react";
import { PillSelect } from "@/components/shared/PillSelect";
import { MarketIndicators } from "@/features/market/components/MarketIndicators";
import { RankingCard } from "@/features/market/components/RankingCard";
import { usePageSearch } from "@/lib/hooks/usePageHeader";
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

  const { data: probe } = useMarketList({ limit: 1 });
  const syncTime = formatSyncTime(probe?.[0]?.lastPriceUpdate);

  const typeParam = type === "all" ? undefined : type;
  const showFundamentals = EQUITY_TYPES.has(type);

  return (
    <div className="flex flex-col gap-5">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h1 className="font-display font-700 text-text text-[22px] tracking-tight">Mercado</h1>
          <p className="text-text-muted mt-0.5 text-[13px]">
            Rankings e indicadores de ações, FIIs, ETFs, cripto, moedas e Tesouro
          </p>
          {syncTime && (
            <div className="mt-1 flex items-center gap-1">
              <Clock size={11} className="text-text-muted" />
              <span className="text-text-muted text-[11px]">Última sinc. às {syncTime}</span>
            </div>
          )}
        </div>
        <PillSelect options={TYPE_OPTIONS} value={type} onChange={setType} />
      </div>

      <MarketIndicators />

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <RankingCard
          title="Maiores altas"
          icon={<TrendingUp size={15} className="text-green" />}
          sort="change_desc"
          type={typeParam}
          metric="change"
        />
        <RankingCard
          title="Maiores quedas"
          icon={<TrendingDown size={15} className="text-red" />}
          sort="change_asc"
          type={typeParam}
          metric="change"
        />

        {showFundamentals ? (
          <>
            <RankingCard
              title="Maiores Rendimento de Dividendos"
              icon={<Coins size={15} className="text-green" />}
              sort="dy_desc"
              type={typeParam}
              metric="dy"
            />
            <RankingCard
              title="Maior Valor de Mercado"
              icon={<Building2 size={15} className="text-blue" />}
              sort="marketcap_desc"
              type={typeParam}
              metric="marketcap"
            />
          </>
        ) : (
          <RankingCard
            title="Em destaque"
            icon={<Sparkles size={15} className="text-purple" />}
            sort="price_desc"
            type={typeParam}
            metric="change"
          />
        )}
      </div>
    </div>
  );
}

"use client";

import { useParams, useRouter } from "next/navigation";
import { Loader2, BarChart2, ChevronLeft } from "lucide-react";
import { MarketAssetCard } from "@/features/market/components/MarketAssetCard";
import { MarketPriceChart } from "@/features/market/components/MarketPriceChart";
import { FundamentalsPanel } from "@/features/market/components/FundamentalsPanel";
import { FiiPanel } from "@/features/market/components/FiiPanel";
import { CurrencyCrossRate } from "@/features/market/components/CurrencyCrossRate";
import { AssetAlertButton } from "@/features/market/components/AssetAlertButton";
import { useMarketAssetDetail } from "@/features/market/hooks/useMarket";
import { usePageSearch } from "@/lib/hooks/usePageHeader";

const FUNDAMENTAL_TYPES = new Set([
  "Acao", "BDR", "Stock", "Reit", "ETF", "ETFInternacional", "FundoInvestimento",
]);

export function MarketAssetPage() {
  const router = useRouter();
  const params = useParams();
  const rawTicker = Array.isArray(params.ticker) ? params.ticker[0] : params.ticker;
  const ticker = decodeURIComponent(rawTicker ?? "").toUpperCase();

  usePageSearch();

  const { data: detail, isLoading, isError } = useMarketAssetDetail(ticker);

  return (
    <div className="flex flex-col gap-5">
      <button
        type="button"
        onClick={() => router.back()}
        className="text-text-muted hover:text-text flex w-fit items-center gap-1.5 text-[13px] transition-colors"
      >
        <ChevronLeft size={15} />
        Voltar
      </button>
      {isLoading ? (
        <div className="border-border bg-surface flex h-64 items-center justify-center rounded-2xl border">
          <Loader2 size={22} className="text-green animate-spin" />
        </div>
      ) : isError || !detail ? (
        <div className="border-border bg-surface flex h-64 flex-col items-center justify-center gap-3 rounded-2xl border">
          <div className="bg-surface2 flex h-12 w-12 items-center justify-center rounded-2xl">
            <BarChart2 size={22} className="text-text-muted" strokeWidth={1.75} />
          </div>
          <p className="text-text-sub text-[14px]">Ativo &quot;{ticker}&quot; não encontrado.</p>
        </div>
      ) : (
        <>
          <MarketAssetCard
            asset={detail}
            trailing={
              <AssetAlertButton assetId={detail.id} currentPrice={detail.currentPrice} />
            }
          />
          <MarketPriceChart ticker={detail.ticker} history={detail.priceHistory} />
          {FUNDAMENTAL_TYPES.has(detail.assetType) && <FundamentalsPanel ticker={detail.ticker} />}
          {detail.assetType === "FII" && <FiiPanel ticker={detail.ticker} />}
          {detail.assetType === "Moeda" && <CurrencyCrossRate asset={detail} />}
        </>
      )}
    </div>
  );
}

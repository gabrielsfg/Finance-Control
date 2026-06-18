"use client";

import { useParams, useRouter } from "next/navigation";
import { Loader2, BarChart2, ChevronLeft } from "lucide-react";
import { PageTopbar } from "@/components/layout/PageTopbar";
import { Card } from "@/components/shared/Card";
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
    <div className="px-[clamp(20px,3.4vw,46px)] pb-[60px]">
      <PageTopbar title={ticker || "Ativo"} subtitle={detail?.name ?? "Cotação do ativo"} />

      <div className="flex flex-col gap-5">
        {/* Breadcrumb */}
        <button
          type="button"
          onClick={() => router.back()}
          className="flex w-fit items-center gap-1.5 font-mono text-[11px] uppercase tracking-[0.08em] text-[var(--text-sub)] transition-colors hover:text-[var(--brand-accent)]"
        >
          <ChevronLeft size={14} />
          Cotações
        </button>

        {isLoading ? (
          <Card className="flex h-64 items-center justify-center">
            <Loader2 size={22} className="animate-spin text-[var(--brand-accent)]" />
          </Card>
        ) : isError || !detail ? (
          <Card className="flex h-64 flex-col items-center justify-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-[14px] bg-[var(--surface2)] text-[var(--brand-accent)]">
              <BarChart2 size={22} strokeWidth={1.75} />
            </div>
            <p className="text-[14px] text-[var(--text-sub)]">Ativo &quot;{ticker}&quot; não encontrado.</p>
          </Card>
        ) : (
          <>
            <MarketAssetCard
              asset={detail}
              trailing={<AssetAlertButton assetId={detail.id} currentPrice={detail.currentPrice} />}
            />
            <MarketPriceChart ticker={detail.ticker} history={detail.priceHistory} />
            {FUNDAMENTAL_TYPES.has(detail.assetType) && <FundamentalsPanel ticker={detail.ticker} />}
            {detail.assetType === "FII" && <FiiPanel ticker={detail.ticker} />}
            {detail.assetType === "Moeda" && <CurrencyCrossRate asset={detail} />}
          </>
        )}
      </div>
    </div>
  );
}

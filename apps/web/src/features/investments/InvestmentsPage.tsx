"use client";

import { useState } from "react";
import { Loader2, TrendingUp, Gift, Plus } from "lucide-react";
import { PortfolioInsightCard } from "@/features/insights/components/PortfolioInsightCard";
import { PageTopbar } from "@/components/layout/PageTopbar";
import { ExportCsvButton } from "@/components/shared/ExportCsvButton";
import { filterInvestments } from "@/features/investments/utils/filterInvestments";
import { exportInvestmentsToCsv } from "@/features/investments/utils/investmentsCsv";
import { InvestmentsSummaryHero } from "@/features/investments/components/InvestmentsSummaryHero";
import { InvestmentsKpiCards } from "@/features/investments/components/InvestmentsKpiCards";
import { InvestmentsAllocationChart } from "@/features/investments/components/InvestmentsAllocationChart";
import { InvestmentsPriceChart } from "@/features/investments/components/InvestmentsPriceChart";
import { InvestmentsTable } from "@/features/investments/components/InvestmentsTable";
import { InvestmentTypeFilter } from "@/features/investments/components/InvestmentTypeFilter";
import { RegisterTransactionModal } from "@/features/investments/components/RegisterTransactionModal";
import { RegisterDividendModal } from "@/features/investments/components/RegisterDividendModal";
import { InvestmentDetailModal } from "@/features/investments/components/InvestmentDetailModal";
import { useInvestments } from "@/features/investments/hooks/useInvestments";
import { useInvestmentVisibility } from "@/features/investments/hooks/useInvestmentVisibility";
import { useAccounts } from "@/features/accounts/hooks/useAccounts";
import { formatPercent } from "@/lib/utils/formatNumber";
import { usePageNova, usePageSearch, usePageFilter } from "@/lib/hooks/usePageHeader";
import type { Investment } from "@/lib/types/investments.types";

export function InvestmentsPage() {
  const { data, isLoading, isError } = useInvestments();
  const { data: accounts = [] } = useAccounts();
  const { visibleTypes, allTypes, setVisibleTypes } = useInvestmentVisibility();
  const [showRegisterTx, setShowRegisterTx]         = useState(false);
  const [selectedInvestment, setSelectedInvestment] = useState<Investment | null>(null);
  const [dividendTarget, setDividendTarget]         = useState<Investment | null>(null);
  const [showDividendModal, setShowDividendModal]   = useState(false);
  const [search, setSearch]                         = useState("");

  usePageNova("Nova operação", () => setShowRegisterTx(true));
  usePageSearch((q) => setSearch(q), "Buscar ativo…");

  // No round trip: the portfolio is already loaded and already filtered on screen, so
  // the export is the same list the table is rendering.
  function handleExport() {
    const visible = filterInvestments(data?.investments ?? [], { search, visibleTypes });
    exportInvestmentsToCsv(visible);
  }

  usePageFilter(
    <div className="flex items-center gap-2">
      {/* Registrar dividendo */}
      <button
        onClick={() => setShowDividendModal(true)}
        title="Registrar dividendo"
        className="inline-flex h-9 items-center gap-2 rounded-full border border-[var(--border-color)] bg-[var(--surface)] px-[13px] text-[13px] font-medium text-[var(--text-sub)] transition-colors hover:text-[var(--text)]"
      >
        <Gift size={14} strokeWidth={1.75} />
        Dividendo
      </button>

      {/* Exportar CSV */}
      <ExportCsvButton state="idle" onClick={handleExport} />
    </div>,
  );

  if (isLoading) {
    return (
      <div className="flex h-full items-center justify-center">
        <Loader2 size={24} className="animate-spin text-[var(--brand-accent)]" />
      </div>
    );
  }

  if (isError || !data) {
    return (
      <div className="flex h-full items-center justify-center">
        <p className="text-[14px] text-[var(--text-sub)]">Erro ao carregar investimentos. Tente novamente.</p>
      </div>
    );
  }

  const hasInvestments = data.investments.length > 0;
  const count = data.investments.length;

  const subtitle = hasInvestments
    ? `${count} ${count === 1 ? "ativo" : "ativos"} · ${formatPercent(data.totalReturnPercent)} no acumulado`
    : "Nenhum ativo na carteira";

  return (
    <>
      <div className="px-[clamp(20px,3.4vw,46px)] pb-[60px]">
        <PageTopbar title="Investimentos" subtitle={subtitle} />

        <div className="flex flex-col gap-5">
          {hasInvestments ? (
            <>
              <InvestmentsSummaryHero summary={data} />

              <PortfolioInsightCard />

              {/* Evolução + alocação */}
              <div className="grid grid-cols-1 gap-[22px] lg:grid-cols-12">
                <div className="lg:col-span-7">
                  <InvestmentsPriceChart investments={data.investments} />
                </div>
                <div className="lg:col-span-5">
                  <InvestmentsAllocationChart summary={data} />
                </div>
              </div>

              {/* Posições */}
              <div className="mt-1 flex items-center gap-3">
                <h2 className="font-display text-[17px] font-bold tracking-[-0.01em] text-[var(--text)]">Posições</h2>
                <div className="h-px flex-1 bg-[var(--border-color)]" />
                <InvestmentTypeFilter
                  allTypes={allTypes}
                  visibleTypes={visibleTypes}
                  onChange={setVisibleTypes}
                />
              </div>

              <InvestmentsTable
                portfolio={data}
                search={search}
                visibleTypes={visibleTypes}
                onSelectInvestment={setSelectedInvestment}
              />
            </>
          ) : (
            <div
              className="rounded-[20px] border border-[var(--border-color)] bg-[var(--surface)] px-5 py-16 text-center"
              style={{ boxShadow: "var(--shadow-sm)" }}
            >
              <div className="mx-auto mb-3.5 flex h-12 w-12 items-center justify-center rounded-[14px] bg-[var(--surface2)] text-[var(--brand-accent)]">
                <TrendingUp size={24} strokeWidth={1.75} />
              </div>
              <h4 className="font-display text-[16px] font-bold text-[var(--text)]">Nenhum investimento cadastrado</h4>
              <p className="mx-auto mt-1.5 max-w-[340px] text-[13.5px] text-[var(--text-sub)]">
                Registre sua primeira compra para começar a acompanhar sua carteira.
              </p>
              <button
                onClick={() => setShowRegisterTx(true)}
                className="mt-5 inline-flex items-center gap-2 rounded-[13px] px-[18px] py-2.5 text-[14px] font-semibold text-white transition-transform hover:-translate-y-[1px]"
                style={{ background: "var(--brand-cobalt)", boxShadow: "0 12px 24px -12px rgba(31,60,224,0.7)" }}
              >
                <Plus size={16} strokeWidth={2} />
                Registrar primeira compra
              </button>
            </div>
          )}
        </div>
      </div>

      <RegisterTransactionModal
        open={showRegisterTx}
        onClose={() => setShowRegisterTx(false)}
        accountOptions={accounts}
      />

      {selectedInvestment && (
        <InvestmentDetailModal
          open={!!selectedInvestment}
          onClose={() => setSelectedInvestment(null)}
          investment={selectedInvestment}
        />
      )}

      <RegisterDividendModal
        open={showDividendModal || !!dividendTarget}
        onClose={() => { setShowDividendModal(false); setDividendTarget(null); }}
        investmentId={dividendTarget?.id ?? 0}
        ticker={dividendTarget?.ticker ?? ""}
        investments={data.investments.map((i) => ({ id: i.id, ticker: i.ticker, name: i.name }))}
        accountOptions={accounts}
      />
    </>
  );
}

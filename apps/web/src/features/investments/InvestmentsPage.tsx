"use client";

import { useState } from "react";
import { Loader2, TrendingUp, Download, Gift, Plus, Search, X } from "lucide-react";
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
  usePageSearch();

  usePageFilter(
    <div className="flex items-center gap-2">
      {/* Ticker / name search */}
      <div className="relative">
        <Search size={13} className="text-text-muted absolute left-2.5 top-1/2 -translate-y-1/2" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Ticker ou nome..."
          className="border-border bg-surface2 text-text placeholder:text-text-muted h-8 w-[150px] rounded-lg border py-1.5 pl-7 pr-6 text-[13px] outline-none focus:border-green/60"
        />
        {search && (
          <button onClick={() => setSearch("")} title="Limpar busca" className="absolute right-2 top-1/2 -translate-y-1/2">
            <X size={12} className="text-text-muted hover:text-text" />
          </button>
        )}
      </div>

      {/* Export */}
      <button
        onClick={() => {/* export CSV */}}
        title="Exportar CSV"
        className="text-text-sub hover:bg-surface2 hover:text-text flex h-8 w-8 items-center justify-center rounded-[8px] transition-colors"
        aria-label="Exportar"
      >
        <Download size={15} strokeWidth={1.75} />
      </button>

      {/* Dividend */}
      <button
        onClick={() => setShowDividendModal(true)}
        title="Registrar dividendo"
        className="border-border bg-surface2 text-text-sub hover:text-text flex h-7 items-center gap-1.5 rounded-full px-3 text-[12px] font-medium transition-colors"
      >
        <Gift size={12} strokeWidth={1.75} />
        Dividendo
      </button>
    </div>
  );

  if (isLoading) {
    return (
      <div className="flex h-full items-center justify-center">
        <Loader2 size={24} className="text-green animate-spin" />
      </div>
    );
  }

  if (isError || !data) {
    return (
      <div className="flex h-full items-center justify-center">
        <p className="text-text-sub text-[14px]">Erro ao carregar investimentos. Tente novamente.</p>
      </div>
    );
  }

  const hasInvestments = data.investments.length > 0;

  return (
    <div className="flex flex-col gap-5">
      <div>
        <h1 className="font-display font-700 text-text text-[22px] tracking-tight">Investimentos</h1>
        <p className="text-text-muted mt-0.5 text-[13px]">{data.investments.length} {data.investments.length === 1 ? "ativo" : "ativos"} na carteira</p>
      </div>

      {hasInvestments ? (
        <>
          <InvestmentsKpiCards summary={data} />

          {/* Gráficos: pizza de alocação + linha de preço, lado a lado */}
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-[400px_1fr]">
            <InvestmentsAllocationChart summary={data} />
            <InvestmentsPriceChart investments={data.investments} />
          </div>

          {/* Tabela dentro de card com header */}
          <div className="border-border bg-surface rounded-xl border">
            <div className="border-border flex items-center justify-between gap-3 border-b px-5 py-4">
              <h2 className="font-display font-700 text-text text-[20px] tracking-tight">Meus Ativos</h2>
              <InvestmentTypeFilter
                allTypes={allTypes}
                visibleTypes={visibleTypes}
                onChange={setVisibleTypes}
              />
            </div>
            <div className="p-4">
              <InvestmentsTable
                portfolio={data}
                search={search}
                visibleTypes={visibleTypes}
                onSelectInvestment={setSelectedInvestment}
              />
            </div>
          </div>
        </>
      ) : (
        <div className="border-border bg-surface flex flex-col items-center justify-center gap-4 rounded-2xl border py-20">
          <div className="bg-green/10 flex h-14 w-14 items-center justify-center rounded-2xl">
            <TrendingUp size={26} className="text-green" strokeWidth={1.75} />
          </div>
          <div className="text-center">
            <p className="font-display font-700 text-text text-[18px]">Nenhum investimento cadastrado</p>
            <p className="text-text-muted mt-1 text-[13px]">Registre sua primeira compra para começar a acompanhar sua carteira.</p>
          </div>
          <button
            onClick={() => setShowRegisterTx(true)}
            className="bg-green hover:bg-green/90 mt-1 flex items-center gap-2 rounded-xl px-5 py-2.5 text-[13px] font-medium text-white transition-colors"
          >
            <Plus size={15} strokeWidth={2.5} />
            Registrar primeira compra
          </button>
        </div>
      )}

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
        accountOptions={accounts}
      />
    </div>
  );
}

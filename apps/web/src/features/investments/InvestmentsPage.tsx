"use client";

import { useState } from "react";
import { Loader2, Plus, TrendingUp, Download, Gift } from "lucide-react";
import { Button } from "@/components/ui/button";
import { InvestmentsKpiCards } from "@/features/investments/components/InvestmentsKpiCards";
import { InvestmentsAllocationChart } from "@/features/investments/components/InvestmentsAllocationChart";
import { InvestmentsTable } from "@/features/investments/components/InvestmentsTable";
import { RegisterTransactionModal } from "@/features/investments/components/RegisterTransactionModal";
import { RegisterDividendModal } from "@/features/investments/components/RegisterDividendModal";
import { InvestmentDetailModal } from "@/features/investments/components/InvestmentDetailModal";
import { useInvestments } from "@/features/investments/hooks/useInvestments";
import type { Investment } from "@/lib/types/investments.types";

export function InvestmentsPage() {
  const { data, isLoading, isError } = useInvestments();
  const [showRegisterTx, setShowRegisterTx]         = useState(false);
  const [selectedInvestment, setSelectedInvestment] = useState<Investment | null>(null);
  const [dividendTarget, setDividendTarget]         = useState<Investment | null>(null);
  const [showDividendModal, setShowDividendModal]   = useState(false);

  const accountOptions = [
    { id: 1, name: "Conta Corrente Nubank" },
    { id: 2, name: "Conta XP Investimentos" },
  ];

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
      {/* Header */}
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="font-display font-700 text-text text-[22px] tracking-tight">Investimentos</h1>
          <p className="text-text-muted mt-0.5 text-[13px]">{data.investments.length} ativos na carteira</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => {/* export CSV */}}
            className="border-border bg-surface text-text-sub hover:text-text flex items-center gap-1.5 rounded-xl border px-3.5 py-2.5 text-[13px] font-medium transition-colors hover:bg-surface2"
          >
            <Download size={14} />
            Exportar
          </button>
          <button
            onClick={() => setShowDividendModal(true)}
            className="border-border bg-surface text-text-sub hover:text-text flex items-center gap-1.5 rounded-xl border px-3.5 py-2.5 text-[13px] font-medium transition-colors hover:bg-surface2"
          >
            <Gift size={14} />
            + Dividendo
          </button>
          <Button size="xl" onClick={() => setShowRegisterTx(true)}>
            <Plus />
            Nova operação
          </Button>
        </div>
      </div>

      {hasInvestments ? (
        <>
          <InvestmentsKpiCards summary={data} />

          <div className="grid grid-cols-1 items-start gap-4 lg:grid-cols-[1fr_320px]">
            <InvestmentsTable
              portfolio={data}
              onSelectInvestment={setSelectedInvestment}
            />
            <InvestmentsAllocationChart summary={data} />
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
        accountOptions={accountOptions}
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
        accountOptions={accountOptions}
      />
    </div>
  );
}

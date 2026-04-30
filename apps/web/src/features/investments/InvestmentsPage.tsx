"use client";

import { Loader2 } from "lucide-react";
import { InvestmentsSummaryHero } from "@/features/investments/components/InvestmentsSummaryHero";
import { InvestmentsAllocationChart } from "@/features/investments/components/InvestmentsAllocationChart";
import { InvestmentsTable } from "@/features/investments/components/InvestmentsTable";
import { useInvestments } from "@/features/investments/hooks/useInvestments";

export function InvestmentsPage() {
  const { data, isLoading, isError } = useInvestments();

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

  return (
    <div className="flex flex-col gap-5">
      <div>
        <h1 className="font-display font-700 text-text text-[22px] tracking-tight">Investimentos</h1>
        <p className="text-text-muted mt-0.5 text-[13px]">{data.investments.length} ativos na carteira</p>
      </div>

      <InvestmentsSummaryHero summary={data} />

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-[1fr_340px]">
        <InvestmentsTable investments={data.investments} />
        <InvestmentsAllocationChart summary={data} />
      </div>
    </div>
  );
}

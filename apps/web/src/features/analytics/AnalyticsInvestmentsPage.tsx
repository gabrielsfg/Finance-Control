"use client";

import { useState } from "react";
import { TabChips } from "@/components/shared/TabChips";
import { AnalyticsHeader } from "./components/AnalyticsHeader";
import { InvestmentOverviewTab } from "./investments/overview/components/InvestmentOverviewTab";
import { AnalyticsInvestmentProfitabilityTab } from "./investments/profitability/components/AnalyticsInvestmentProfitabilityTab";
import { InvestmentLaunchesTab } from "./investments/launches/components/InvestmentLaunchesTab";
import { useAnalyticsFilter } from "./AnalyticsFilterContext";

type InvestmentSubTab = "geral" | "rentabilidade" | "lancamentos";

const INVESTMENT_SUBTABS: { id: InvestmentSubTab; label: string }[] = [
  { id: "geral",         label: "Geral" },
  { id: "rentabilidade", label: "Rentabilidade" },
  { id: "lancamentos",   label: "Lançamentos" },
];

export function AnalyticsInvestmentsPage() {
  const { start, finish } = useAnalyticsFilter();
  const [subTab, setSubTab] = useState<InvestmentSubTab>("geral");

  return (
    <div className="flex flex-col gap-5">
      <AnalyticsHeader title="Investimentos" />

      <TabChips items={INVESTMENT_SUBTABS} value={subTab} onChange={setSubTab} size="sm" />

      {subTab === "geral" && <InvestmentOverviewTab startDate={start} finishDate={finish} />}
      {subTab === "rentabilidade" && <AnalyticsInvestmentProfitabilityTab startDate={start} finishDate={finish} />}
      {subTab === "lancamentos" && <InvestmentLaunchesTab startDate={start} finishDate={finish} />}
    </div>
  );
}

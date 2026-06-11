"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { AnalyticsExpensesPage } from "./AnalyticsExpensesPage";
import { AnalyticsSavingsPage } from "./AnalyticsSavingsPage";
import { AnalyticsNetWorthPage } from "./AnalyticsNetWorthPage";
import { AnalyticsInvestmentsPage } from "./AnalyticsInvestmentsPage";
import { AnalyticsProjectionsPage } from "./AnalyticsProjectionsPage";

/** First entry (`gastos`) is served by the bare `/analytics` route. */
const TABS = {
  gastos:        AnalyticsExpensesPage,
  economia:      AnalyticsSavingsPage,
  patrimonio:    AnalyticsNetWorthPage,
  investimentos: AnalyticsInvestmentsPage,
  projecoes:     AnalyticsProjectionsPage,
} as const;

/**
 * Serves both the bare `/analytics` route (no tab → gastos) and the
 * `/analytics/[tab]` route. Each tab is its own page, selected from the
 * sidebar submenu. Only the active page mounts, so it fetches just its data.
 */
export function AnalyticsPage() {
  const params = useParams();
  const raw = Array.isArray(params.tab) ? params.tab[0] : params.tab;
  const tab = (raw ?? "gastos") as keyof typeof TABS;
  const Page = TABS[tab];

  if (!Page) {
    return (
      <div className="flex flex-col gap-5">
        <Link
          href="/analytics"
          className="text-text-muted hover:text-text flex w-fit items-center gap-1.5 text-[13px] transition-colors"
        >
          <ArrowLeft size={15} />
          Voltar ao analytics
        </Link>
        <div className="border-border bg-surface flex h-64 items-center justify-center rounded-2xl border">
          <p className="text-text-sub text-[14px]">Página não encontrada.</p>
        </div>
      </div>
    );
  }

  return <Page />;
}

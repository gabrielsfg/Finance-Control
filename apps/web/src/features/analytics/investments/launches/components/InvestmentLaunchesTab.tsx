"use client";

import { useState } from "react";
import { ArrowDownLeft, ArrowUpRight } from "lucide-react";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from "recharts";
import { SectionHeader } from "@/components/shared/SectionHeader";
import { formatCurrency, formatCurrencyCompact } from "@/lib/utils/formatCurrency";
import { cn } from "@/lib/utils";
import {
  useInvestmentLaunches,
  useInvestmentLaunchMonthPoints,
} from "@/features/analytics/hooks/useAnalytics";
import type { InvestmentLaunch } from "@/lib/types/analytics.types";

type FilterOp = "all" | "buy" | "sell";

const ASSET_CLASS_COLORS: Record<string, string> = {
  "Renda Fixa":     "var(--blue)",
  "Renda Variável": "var(--green)",
  "FII":            "var(--orange)",
  "Internacional":  "var(--purple)",
  "Cripto":         "var(--red)",
};

function formatDate(iso: string) {
  const [y, m, d] = iso.split("-");
  return `${d}/${m}/${y}`;
}

const BarTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="border-border bg-surface rounded-lg border px-3 py-2 shadow-md">
      <p className="text-text-muted mb-1.5 text-[11px]">{label}</p>
      {payload.map((e: any) => (
        <p key={e.name} className="font-money text-[12px]" style={{ color: e.fill }}>
          {e.name}: {formatCurrency(e.value / 100)}
        </p>
      ))}
    </div>
  );
};

function LaunchRow({ launch }: { launch: InvestmentLaunch }) {
  const isBuy = launch.operation === "buy";
  return (
    <div className="border-border flex items-center gap-3 border-b py-3 last:border-0">
      <div
        className={cn(
          "flex h-8 w-8 shrink-0 items-center justify-center rounded-[8px]",
          isBuy ? "bg-green/10" : "bg-red/10",
        )}
      >
        {isBuy
          ? <ArrowDownLeft size={15} className="text-green" strokeWidth={2} />
          : <ArrowUpRight  size={15} className="text-red"   strokeWidth={2} />}
      </div>

      <div className="min-w-0 flex-1">
        <div className="flex items-baseline gap-1.5">
          <span className="font-display font-700 text-text text-[14px]">{launch.ticker}</span>
          <span className="text-text-muted truncate text-[12px]">{launch.name}</span>
        </div>
        <div className="mt-0.5 flex items-center gap-2">
          <span
            className="rounded px-1.5 py-0.5 text-[11px] font-medium"
            style={{
              color: ASSET_CLASS_COLORS[launch.assetClass] ?? "var(--text-sub)",
              backgroundColor: `${ASSET_CLASS_COLORS[launch.assetClass] ?? "var(--text-sub)"}18`,
            }}
          >
            {launch.assetClass}
          </span>
          <span className="text-text-muted text-[12px]">{formatDate(launch.date)}</span>
          {launch.broker && <span className="text-text-muted text-[12px]">· {launch.broker}</span>}
        </div>
      </div>

      <div className="text-right">
        <p className={cn("font-money font-600 text-[14px]", isBuy ? "text-green" : "text-red")}>
          {isBuy ? "+" : "-"}{formatCurrency(launch.totalValue / 100)}
        </p>
        <p className="text-text-muted mt-0.5 text-[12px]">
          {launch.quantity % 1 === 0 ? launch.quantity : launch.quantity.toFixed(4)} × {formatCurrency(launch.unitPrice / 100)}
        </p>
      </div>
    </div>
  );
}

export function InvestmentLaunchesTab() {
  const launches = useInvestmentLaunches();
  const monthPoints = useInvestmentLaunchMonthPoints();
  const [filterOp, setFilterOp] = useState<FilterOp>("all");

  const allLaunches = launches.data ?? [];
  const filtered = filterOp === "all"
    ? allLaunches
    : allLaunches.filter((l) => l.operation === filterOp);

  const sorted = [...filtered].sort((a, b) => b.date.localeCompare(a.date));

  const totalBought = allLaunches.filter((l) => l.operation === "buy").reduce((s, l) => s + l.totalValue, 0);
  const totalSold   = allLaunches.filter((l) => l.operation === "sell").reduce((s, l) => s + l.totalValue, 0);

  return (
    <div className="flex flex-col gap-5">
      {/* Summary cards */}
      <div className="grid grid-cols-2 gap-3">
        <div className="border-border bg-surface rounded-xl border p-5">
          <div className="bg-green/10 mb-3 flex h-9 w-9 items-center justify-center rounded-[10px]">
            <ArrowDownLeft size={18} className="text-green" strokeWidth={1.75} />
          </div>
          <p className="font-display font-700 text-text text-[16px]">Total comprado</p>
          <p className="font-money font-700 text-green mt-1 text-[20px]">{formatCurrency(totalBought / 100)}</p>
          <p className="text-text-muted mt-0.5 text-[12px]">
            {allLaunches.filter((l) => l.operation === "buy").length} operações
          </p>
        </div>
        <div className="border-border bg-surface rounded-xl border p-5">
          <div className="bg-red/10 mb-3 flex h-9 w-9 items-center justify-center rounded-[10px]">
            <ArrowUpRight size={18} className="text-red" strokeWidth={1.75} />
          </div>
          <p className="font-display font-700 text-text text-[16px]">Total vendido</p>
          <p className="font-money font-700 text-red mt-1 text-[20px]">{formatCurrency(totalSold / 100)}</p>
          <p className="text-text-muted mt-0.5 text-[12px]">
            {allLaunches.filter((l) => l.operation === "sell").length} operações
          </p>
        </div>
      </div>

      {/* Bar chart: bought vs sold per month */}
      <div className="border-border bg-surface rounded-xl border p-5">
        <SectionHeader
          title="Volume por mês"
          subtitle="Valor total de compras e vendas nos últimos 7 meses"
        />
        <div style={{ height: 240 }}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={monthPoints.data ?? []} margin={{ top: 4, right: 4, left: 0, bottom: 0 }} barCategoryGap="30%">
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
              <XAxis
                dataKey="label"
                tick={{ fill: "var(--text-muted)", fontSize: 12, fontFamily: "DM Sans" }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                tick={{ fill: "var(--text-muted)", fontSize: 12, fontFamily: "JetBrains Mono" }}
                axisLine={false}
                tickLine={false}
                tickFormatter={(v) => formatCurrencyCompact(v / 100)}
                width={64}
              />
              <Tooltip content={<BarTooltip />} cursor={{ fill: "var(--surface2)" }} />
              <Bar dataKey="bought" name="Comprado" fill="var(--green)" radius={[4, 4, 0, 0]} />
              <Bar dataKey="sold"   name="Vendido"  fill="var(--red)"   radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
        <div className="mt-3 flex gap-4">
          <div className="flex items-center gap-1.5">
            <div className="bg-green h-2.5 w-2.5 rounded-[2px]" />
            <span className="text-text-muted text-[13px]">Comprado</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="bg-red h-2.5 w-2.5 rounded-[2px]" />
            <span className="text-text-muted text-[13px]">Vendido</span>
          </div>
        </div>
      </div>

      {/* Launches table */}
      <div className="border-border bg-surface rounded-xl border p-5">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <h2 className="font-display font-700 text-text text-[18px] tracking-tight">Histórico de operações</h2>
            <p className="text-text-muted mt-0.5 text-[13px]">{sorted.length} lançamento{sorted.length !== 1 ? "s" : ""}</p>
          </div>
          <div className="border-border flex gap-0.5 rounded-lg border bg-surface p-0.5">
            {(["all", "buy", "sell"] as FilterOp[]).map((op) => (
              <button
                key={op}
                onClick={() => setFilterOp(op)}
                className={cn(
                  "rounded-[7px] px-3 py-1 text-[12px] font-medium transition-all",
                  filterOp === op
                    ? "bg-surface2 text-text shadow-sm"
                    : "text-text-muted hover:text-text-sub",
                )}
              >
                {op === "all" ? "Todos" : op === "buy" ? "Compras" : "Vendas"}
              </button>
            ))}
          </div>
        </div>

        {sorted.length === 0 ? (
          <div className="flex h-20 items-center justify-center">
            <p className="text-text-muted text-[13px]">Nenhum lançamento encontrado.</p>
          </div>
        ) : (
          <div>
            {sorted.map((launch) => (
              <LaunchRow key={launch.id} launch={launch} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

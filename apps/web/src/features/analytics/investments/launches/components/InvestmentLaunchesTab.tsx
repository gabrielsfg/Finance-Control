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
import { Card, CardHead } from "@/components/shared/Card";
import { ChartEmptyState } from "@/components/shared/ChartEmptyState";
import { formatCurrency, formatCurrencyCompact } from "@/lib/utils/formatCurrency";
import { cn } from "@/lib/utils";
import { useInvestmentLaunches } from "@/features/analytics/hooks/useAnalytics";

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


export function InvestmentLaunchesTab({ startDate, finishDate }: { startDate: string; finishDate: string }) {
  const { data: response } = useInvestmentLaunches(startDate, finishDate);
  const [filterOp, setFilterOp] = useState<FilterOp>("all");

  const allLaunches  = response?.launches ?? [];
  const monthPoints  = response?.monthlyPoints ?? [];
  const summary      = response?.summary;

  // launches arrive pre-filtered by date descending from the backend
  const filtered = filterOp === "all"
    ? allLaunches
    : allLaunches.filter((l) => l.operation === filterOp);

  const totalBought = summary?.totalBought ?? 0;
  const totalSold   = summary?.totalSold   ?? 0;

  return (
    <div className="flex flex-col gap-5">
      {/* Summary cards */}
      <div className="grid grid-cols-2 gap-3">
        <Card>
          <div
            className="mb-3 flex h-9 w-9 items-center justify-center rounded-[13px]"
            style={{ backgroundColor: "color-mix(in srgb, var(--moss) 14%, transparent)" }}
          >
            <ArrowDownLeft size={18} className="text-[var(--moss)]" strokeWidth={1.75} />
          </div>
          <p className="font-display text-[16px] font-bold text-[var(--text)]">Total comprado</p>
          <p className="mt-1 font-mono text-[20px] font-bold tabular-nums text-[var(--text)]">{formatCurrency(totalBought / 100)}</p>
          <p className="mt-0.5 text-[12px] text-[var(--text-sub)]">
            {summary?.buyCount ?? 0} operações
          </p>
        </Card>
        <Card>
          <div
            className="mb-3 flex h-9 w-9 items-center justify-center rounded-[13px]"
            style={{ backgroundColor: "color-mix(in srgb, var(--clay) 14%, transparent)" }}
          >
            <ArrowUpRight size={18} className="text-[var(--clay)]" strokeWidth={1.75} />
          </div>
          <p className="font-display text-[16px] font-bold text-[var(--text)]">Total vendido</p>
          <p className="mt-1 font-mono text-[20px] font-bold tabular-nums text-[var(--clay)]">{formatCurrency(totalSold / 100)}</p>
          <p className="mt-0.5 text-[12px] text-[var(--text-sub)]">
            {summary?.sellCount ?? 0} operações
          </p>
        </Card>
      </div>

      {/* Bar chart: bought vs sold per month */}
      <Card>
        <CardHead
          title="Volume por mês"
          subtitle="Valor total de compras e vendas nos últimos 7 meses"
        />
        {monthPoints.length === 0 ? (
          <ChartEmptyState message="Sem operações no período" />
        ) : (
          <>
            <div style={{ height: 240 }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={monthPoints} margin={{ top: 4, right: 4, left: 0, bottom: 0 }} barCategoryGap="30%">
                  <CartesianGrid stroke="var(--border-color)" strokeDasharray="3 5" vertical={false} />
                  <XAxis
                    dataKey="label"
                    tick={{ fill: "var(--text-sub)", fontSize: 10, fontFamily: "IBM Plex Mono" }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <YAxis
                    tick={{ fill: "var(--text-sub)", fontSize: 10, fontFamily: "IBM Plex Mono" }}
                    axisLine={false}
                    tickLine={false}
                    tickFormatter={(v) => formatCurrencyCompact(v / 100)}
                    width={64}
                  />
                  <Tooltip content={<BarTooltip />} cursor={{ fill: "var(--surface2)" }} />
                  <Bar dataKey="bought" name="Comprado" fill="var(--moss)" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="sold"   name="Vendido"  fill="var(--clay)"  radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div className="mt-3 flex gap-4">
              <div className="flex items-center gap-1.5">
                <div className="h-2.5 w-2.5 rounded-[2px] bg-[var(--moss)]" />
                <span className="text-text-muted text-[13px]">Comprado</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="h-2.5 w-2.5 rounded-[2px] bg-[var(--clay)]" />
                <span className="text-text-muted text-[13px]">Vendido</span>
              </div>
            </div>
          </>
        )}
      </Card>

      {/* Launches table */}
      <Card>
        <div className="mb-4 flex items-center justify-between gap-3 flex-wrap">
          <div>
            <h2 className="font-display text-[18px] font-bold tracking-[-0.01em] text-[var(--text)]">Histórico de operações</h2>
            <p className="mt-0.5 text-[13px] text-[var(--text-sub)]">{filtered.length} lançamento{filtered.length !== 1 ? "s" : ""}</p>
          </div>
          <div className="flex gap-0.5 rounded-[13px] border border-[var(--border-color)] bg-[var(--surface2)] p-1">
            {(["all", "buy", "sell"] as FilterOp[]).map((op) => (
              <button
                key={op}
                onClick={() => setFilterOp(op)}
                className={cn(
                  "rounded-[9px] px-3 py-1 text-[12px] font-medium transition-all",
                  filterOp === op
                    ? "bg-[var(--surface)] text-[var(--text)] shadow-sm"
                    : "text-[var(--text-sub)] hover:text-[var(--text)]",
                )}
              >
                {op === "all" ? "Todos" : op === "buy" ? "Compras" : "Vendas"}
              </button>
            ))}
          </div>
        </div>

        {filtered.length === 0 ? (
          <div className="flex h-20 items-center justify-center">
            <p className="text-text-muted text-[13px]">Nenhum lançamento encontrado.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[600px] text-[13px]">
              <thead>
                <tr className="border-border border-b">
                  <th className="text-text-muted pb-2.5 pr-3 text-left font-medium">Data</th>
                  <th className="text-text-muted pb-2.5 pr-3 text-left font-medium">Op.</th>
                  <th className="text-text-muted pb-2.5 pr-3 text-left font-medium">Ticker</th>
                  <th className="text-text-muted pb-2.5 px-3 text-right font-medium">Qtd</th>
                  <th className="text-text-muted pb-2.5 px-3 text-right font-medium">Preço</th>
                  <th className="text-text-muted pb-2.5 px-3 text-right font-medium">Total</th>
                  <th className="text-text-muted pb-2.5 pl-3 text-left font-medium">Corretora</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((launch) => {
                  const isBuy = launch.operation === "buy";
                  return (
                    <tr key={launch.id} className="border-border border-b last:border-0 hover:bg-surface2/40 transition-colors">
                      <td className="text-text-muted py-3 pr-3">{formatDate(launch.date)}</td>
                      <td className="py-3 pr-3">
                        <div className={cn(
                          "inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-[11px] font-medium",
                          isBuy ? "bg-green/10 text-green" : "bg-red/10 text-red",
                        )}>
                          {isBuy
                            ? <ArrowDownLeft size={11} strokeWidth={2.5} />
                            : <ArrowUpRight  size={11} strokeWidth={2.5} />}
                          {isBuy ? "Compra" : "Venda"}
                        </div>
                      </td>
                      <td className="py-3 pr-3">
                        <div>
                          <span className="font-display font-700 text-text">{launch.ticker}</span>
                          <span
                            className="ml-2 rounded px-1.5 py-0.5 text-[11px] font-medium"
                            style={{
                              color: ASSET_CLASS_COLORS[launch.assetClass] ?? "var(--text-sub)",
                              backgroundColor: `${ASSET_CLASS_COLORS[launch.assetClass] ?? "var(--text-sub)"}18`,
                            }}
                          >
                            {launch.assetClass}
                          </span>
                        </div>
                      </td>
                      <td className="font-money text-text py-3 px-3 text-right tabular-nums">
                        {launch.quantity % 1 === 0 ? launch.quantity : launch.quantity.toFixed(4)}
                      </td>
                      <td className="font-money text-text-sub py-3 px-3 text-right tabular-nums">
                        {formatCurrency(launch.unitPrice / 100)}
                      </td>
                      <td className={cn("font-money font-600 py-3 px-3 text-right tabular-nums", isBuy ? "text-green" : "text-red")}>
                        {isBuy ? "+" : "-"}{formatCurrency(launch.totalValue / 100)}
                      </td>
                      <td className="text-text-muted py-3 pl-3">
                        {launch.broker ?? "—"}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
}

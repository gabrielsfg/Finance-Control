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
import { HeroPanel } from "@/components/shared/HeroPanel";
import { BigMoney } from "@/components/shared/Money";
import { FlowRow } from "@/components/shared/FlowBar";

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
      {/* Hero panel — launches summary */}
      {(() => {
        const max = Math.max(totalBought, totalSold, 1);
        const netFlow = totalBought - totalSold;
        return (
          <HeroPanel split>
            {/* Left — total bought */}
            <div>
              <div className="font-mono text-[11px] tracking-[0.18em] uppercase text-[var(--panel-muted)]">
                Total comprado
              </div>
              <BigMoney
                cents={totalBought}
                className="block mt-[10px] mb-[2px] font-semibold leading-[0.96] tracking-[-0.035em]"
                style={{ fontSize: "clamp(40px, 5.6vw, 70px)" } as React.CSSProperties}
              />
              <div className="mt-2 font-mono text-[13px] text-[var(--panel-muted)]">
                {summary?.buyCount ?? 0} compra{(summary?.buyCount ?? 0) !== 1 ? "s" : ""}
              </div>

              <div className="mt-6 flex flex-wrap gap-[26px]">
                <div>
                  <div className="font-mono text-[11px] tracking-[0.18em] uppercase text-[var(--panel-muted)]">
                    Total vendido
                  </div>
                  <div className="font-mono mt-[3px] text-[18px] font-medium text-[var(--clay-lift)]">
                    {formatCurrency(totalSold / 100)}
                  </div>
                </div>
                <div>
                  <div className="font-mono text-[11px] tracking-[0.18em] uppercase text-[var(--panel-muted)]">
                    Vendas
                  </div>
                  <div className="font-mono mt-[3px] text-[18px] font-medium text-[var(--panel-foreground)]">
                    {summary?.sellCount ?? 0}
                  </div>
                </div>
              </div>
            </div>

            {/* Right — buy vs sell flow */}
            <div className="self-center">
              <div className="mb-[18px] flex items-baseline justify-between">
                <span className="font-display text-[16px] font-bold">Compras vs. Vendas</span>
                <span className="font-mono text-[11px] tracking-[0.1em] uppercase text-[var(--panel-muted)]">
                  Volume
                </span>
              </div>

              <FlowRow
                label="Comprado"
                dotColor="var(--moss-lift)"
                value={`+ ${formatCurrency(totalBought / 100)}`}
                valueColor="var(--moss-lift)"
                pct={totalBought / max}
                variant="in"
              />
              <FlowRow
                label="Vendido"
                dotColor="var(--clay-lift)"
                value={`− ${formatCurrency(totalSold / 100)}`}
                valueColor="var(--clay-lift)"
                pct={totalSold / max}
                variant="out"
              />

              <div
                className="mt-5 flex items-center justify-between border-t pt-4"
                style={{ borderColor: "rgba(255,255,255,0.12)" }}
              >
                <span className="font-mono text-[11px] tracking-[0.16em] uppercase text-[var(--panel-muted)]">
                  Fluxo líquido
                </span>
                <span
                  className="font-mono text-[22px] font-semibold"
                  style={{ color: netFlow >= 0 ? "var(--moss-lift)" : "var(--clay-lift)" }}
                >
                  {netFlow >= 0 ? "+ " : "− "}
                  {formatCurrency(Math.abs(netFlow) / 100)}
                </span>
              </div>
            </div>
          </HeroPanel>
        );
      })()}

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

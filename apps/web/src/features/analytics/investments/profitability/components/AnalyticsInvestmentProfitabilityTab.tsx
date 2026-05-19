"use client";

import { useState } from "react";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Legend,
  ReferenceLine,
} from "recharts";
import { TrendingUp, TrendingDown } from "lucide-react";
import { SectionHeader } from "@/components/shared/SectionHeader";
import { ChartEmptyState } from "@/components/shared/ChartEmptyState";
import {
  useInvestmentProfitabilityTotals,
  useInvestmentAnnualReturns,
  useInvestmentProfitabilityVsBenchmarks,
} from "@/features/analytics/hooks/useAnalytics";
import { cn } from "@/lib/utils";

type BenchmarkId = "cdi" | "ibov" | "ipca5";

const BENCHMARKS: { id: BenchmarkId; label: string; color: string; dataKey: string }[] = [
  { id: "cdi",   label: "CDI",       color: "var(--blue)",   dataKey: "cdiPct"        },
  { id: "ibov",  label: "IBOV",      color: "var(--orange)", dataKey: "ibovPct"       },
  { id: "ipca5", label: "IPCA+5%",   color: "var(--purple)", dataKey: "ipcaPlus5Pct"  },
];

const MONTH_LABELS = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"];

function formatBps(bps: number | null): string {
  if (bps === null) return "—";
  return (bps / 100).toFixed(2) + "%";
}

function formatPct(pct: number): string {
  return (pct >= 0 ? "+" : "") + pct.toFixed(2) + "%";
}

const ChartTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="border-border bg-surface rounded-lg border px-3 py-2 shadow-md min-w-[160px]">
      <p className="text-text-muted mb-1.5 text-[11px]">{label}</p>
      {payload.map((e: any) => (
        <p key={e.name} className="font-money text-[12px]" style={{ color: e.stroke ?? e.fill }}>
          {e.name}: {Number(e.value).toFixed(2)}%
        </p>
      ))}
    </div>
  );
};

export function AnalyticsInvestmentProfitabilityTab({ startDate, finishDate }: { startDate: string; finishDate: string }) {
  const [activeBenchmarks, setActiveBenchmarks] = useState<Set<BenchmarkId>>(new Set(["cdi"]));

  const totals      = useInvestmentProfitabilityTotals(startDate, finishDate);
  const annualReturns = useInvestmentAnnualReturns(startDate, finishDate);
  const benchmarks  = useInvestmentProfitabilityVsBenchmarks(startDate, finishDate);

  const t           = totals.data;
  const annualData  = annualReturns.data;
  const rows        = annualData?.rows ?? [];
  const monthlyCumulatives = annualData?.monthlyCumulatives ?? [];
  const grandTotal  = annualData?.grandTotal ?? 0;
  const points      = benchmarks.data?.points ?? [];
  const bmTotals    = benchmarks.data?.totals;

  const toggleBenchmark = (id: BenchmarkId) => {
    setActiveBenchmarks((prev) => {
      const next = new Set(prev);
      if (next.has(id)) { if (next.size > 0) next.delete(id); }
      else next.add(id);
      return next;
    });
  };

  // Build cumulative series from monthly points
  const cumulativeData = (() => {
    let portC = 1, cdiC = 1, ibovC = 1, ipca5C = 1;
    return points.map((p) => {
      portC  *= 1 + p.portfolioPct  / 100;
      cdiC   *= 1 + p.cdiPct        / 100;
      ibovC  *= 1 + (p.ibovPct  ?? 0) / 100;
      ipca5C *= 1 + (p.ipcaPlus5Pct ?? 0) / 100;
      return {
        label:       p.label,
        portfolio:   +((portC  - 1) * 100).toFixed(2),
        cdi:         +((cdiC   - 1) * 100).toFixed(2),
        ibov:        +((ibovC  - 1) * 100).toFixed(2),
        ipca5:       +((ipca5C - 1) * 100).toFixed(2),
      };
    });
  })();

  return (
    <div className="flex flex-col gap-5">

      {/* ── Hero card: portfolio result + benchmark comparisons ── */}
      {t && bmTotals && (
        <div className="border-border bg-surface rounded-xl border p-5">
          <div className="mb-4 flex items-start justify-between gap-4">
            <div>
              <p className="text-text-muted text-[12px] uppercase tracking-[0.06em]">Rentabilidade total da carteira</p>
              <p className={cn("font-money font-700 mt-1 text-[42px] leading-none", t.allTime.returnPct >= 0 ? "text-green" : "text-red")}>
                {t.allTime.returnPct >= 0 ? "+" : ""}{t.allTime.returnPct.toFixed(2)}%
              </p>
            </div>
            <div className={cn(
              "flex items-center gap-1.5 rounded-xl px-3 py-2 text-[13px] font-medium",
              t.allTime.vsCdiPct >= 0 ? "bg-green/10 text-green" : "bg-red/10 text-red"
            )}>
              {t.allTime.vsCdiPct >= 0
                ? <TrendingUp size={15} />
                : <TrendingDown size={15} />}
              {formatPct(t.allTime.vsCdiPct)} vs CDI
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {[
              { label: "Últimos 12 meses", value: t.last12Months.returnPct, vsCdi: t.last12Months.vsCdiPct },
              { label: "Último mês",       value: t.lastMonth.returnPct,    vsCdi: t.lastMonth.vsCdiPct    },
            ].map(({ label, value, vsCdi }) => (
              <div key={label} className="bg-surface2 rounded-xl p-3">
                <p className="text-text-muted text-[11px]">{label}</p>
                <p className={cn("font-money font-600 mt-1 text-[18px]", value >= 0 ? "text-green" : "text-red")}>
                  {value >= 0 ? "+" : ""}{value.toFixed(2)}%
                </p>
                <p className={cn("text-[11px] font-medium mt-0.5", vsCdi >= 0 ? "text-green" : "text-text-muted")}>
                  {vsCdi >= 0 ? "+" : ""}{vsCdi.toFixed(2)}% vs CDI
                </p>
              </div>
            ))}

            {/* vs IBOV */}
            <div className="bg-surface2 rounded-xl p-3">
              <p className="text-text-muted text-[11px]">vs IBOV (todo período)</p>
              <p className={cn("font-money font-600 mt-1 text-[18px]", bmTotals.vsIbovPct >= 0 ? "text-green" : "text-red")}>
                {formatPct(bmTotals.vsIbovPct)}
              </p>
              <p className="text-text-muted text-[11px] mt-0.5">IBOV: {bmTotals.ibovAllTimePct.toFixed(2)}%</p>
            </div>

            {/* vs IPCA+5% */}
            <div className="bg-surface2 rounded-xl p-3">
              <p className="text-text-muted text-[11px]">vs IPCA+5% (todo período)</p>
              <p className={cn("font-money font-600 mt-1 text-[18px]", bmTotals.vsIpcaPlus5Pct >= 0 ? "text-green" : "text-red")}>
                {formatPct(bmTotals.vsIpcaPlus5Pct)}
              </p>
              <p className="text-text-muted text-[11px] mt-0.5">IPCA+5%: {bmTotals.ipcaPlus5AllTimePct.toFixed(2)}%</p>
            </div>
          </div>
        </div>
      )}

      {/* ── Benchmark selector + monthly bar chart ── */}
      <div className="border-border bg-surface rounded-xl border p-5">
        <div className="mb-4 flex items-center justify-between gap-4 flex-wrap">
          <SectionHeader
            title="Rentabilidade mensal vs benchmarks"
            subtitle="Comparativo mês a mês contra os índices selecionados"
          />
          {/* Multi-select benchmark chips */}
          <div className="flex flex-wrap gap-1.5">
            {BENCHMARKS.map((bm) => (
              <button
                key={bm.id}
                onClick={() => toggleBenchmark(bm.id)}
                className={cn(
                  "flex items-center gap-1.5 rounded-full border px-3 py-1 text-[12px] font-medium transition-colors",
                  activeBenchmarks.has(bm.id)
                    ? "border-transparent text-white"
                    : "border-border text-text-muted hover:text-text",
                )}
                style={activeBenchmarks.has(bm.id) ? { backgroundColor: bm.color } : {}}
              >
                {bm.label}
              </button>
            ))}
          </div>
        </div>

        {points.length === 0 ? (
          <ChartEmptyState message="Sem dados de rentabilidade no período" />
        ) : (
          <div style={{ height: 260 }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={points} margin={{ top: 4, right: 4, left: 0, bottom: 0 }} barCategoryGap="25%">
                <CartesianGrid stroke="var(--border-chart)" />
                <XAxis dataKey="label" tick={{ fill: "var(--text-muted)", fontSize: 11, fontFamily: "DM Sans" }} axisLine={false} tickLine={false} interval="preserveStartEnd" />
                <YAxis tick={{ fill: "var(--text-muted)", fontSize: 11, fontFamily: "JetBrains Mono" }} axisLine={false} tickLine={false} tickFormatter={(v) => v.toFixed(1) + "%"} width={46} />
                <Tooltip content={<ChartTooltip />} cursor={{ fill: "var(--surface2)" }} />
                <ReferenceLine y={0} stroke="var(--border)" strokeWidth={1} />
                <Bar dataKey="portfolioPct" name="Carteira" fill="var(--green)" radius={[3, 3, 0, 0]} />
                {activeBenchmarks.has("cdi")   && <Bar dataKey="cdiPct"       name="CDI"     fill="var(--blue)"   radius={[3, 3, 0, 0]} />}
                {activeBenchmarks.has("ibov")  && <Bar dataKey="ibovPct"      name="IBOV"    fill="var(--orange)" radius={[3, 3, 0, 0]} />}
                {activeBenchmarks.has("ipca5") && <Bar dataKey="ipcaPlus5Pct" name="IPCA+5%" fill="var(--purple)" radius={[3, 3, 0, 0]} />}
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>

      {/* ── Cumulative line chart ── */}
      {cumulativeData.length > 1 && (
        <div className="border-border bg-surface rounded-xl border p-5">
          <SectionHeader
            title="Rentabilidade acumulada"
            subtitle="Evolução percentual acumulada desde o início do período"
          />
          <div style={{ height: 260 }} className="mt-4">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={cumulativeData} margin={{ top: 4, right: 4, left: 0, bottom: 0 }}>
                <CartesianGrid stroke="var(--border-chart)" />
                <XAxis dataKey="label" tick={{ fill: "var(--text-muted)", fontSize: 11, fontFamily: "DM Sans" }} axisLine={false} tickLine={false} interval="preserveStartEnd" />
                <YAxis tick={{ fill: "var(--text-muted)", fontSize: 11, fontFamily: "JetBrains Mono" }} axisLine={false} tickLine={false} tickFormatter={(v) => v.toFixed(1) + "%"} width={50} />
                <Tooltip content={<ChartTooltip />} cursor={{ stroke: "var(--border)", strokeWidth: 1, strokeDasharray: "4 4" }} />
                <ReferenceLine y={0} stroke="var(--border)" strokeWidth={1} />
                <Line type="monotone" dataKey="portfolio" name="Carteira" stroke="var(--green)" strokeWidth={2.5} dot={false} activeDot={{ r: 4 }} />
                {activeBenchmarks.has("cdi")   && <Line type="monotone" dataKey="cdi"   name="CDI"     stroke="var(--blue)"   strokeWidth={1.5} strokeDasharray="5 3" dot={false} activeDot={{ r: 4 }} />}
                {activeBenchmarks.has("ibov")  && <Line type="monotone" dataKey="ibov"  name="IBOV"    stroke="var(--orange)" strokeWidth={1.5} strokeDasharray="5 3" dot={false} activeDot={{ r: 4 }} />}
                {activeBenchmarks.has("ipca5") && <Line type="monotone" dataKey="ipca5" name="IPCA+5%" stroke="var(--purple)" strokeWidth={1.5} strokeDasharray="5 3" dot={false} activeDot={{ r: 4 }} />}
              </LineChart>
            </ResponsiveContainer>
          </div>
          <div className="mt-3 flex flex-wrap gap-4">
            <div className="flex items-center gap-1.5">
              <div className="h-2.5 w-2.5 rounded-[2px] bg-green" />
              <span className="text-text-muted text-[12px]">Carteira</span>
            </div>
            {activeBenchmarks.has("cdi")   && <div className="flex items-center gap-1.5"><div className="h-2.5 w-2.5 rounded-[2px] bg-blue"   /><span className="text-text-muted text-[12px]">CDI</span></div>}
            {activeBenchmarks.has("ibov")  && <div className="flex items-center gap-1.5"><div className="h-2.5 w-2.5 rounded-[2px] bg-orange" /><span className="text-text-muted text-[12px]">IBOV</span></div>}
            {activeBenchmarks.has("ipca5") && <div className="flex items-center gap-1.5"><div className="h-2.5 w-2.5 rounded-[2px] bg-purple" /><span className="text-text-muted text-[12px]">IPCA+5%</span></div>}
          </div>
        </div>
      )}

      {/* ── Annual returns table ── */}
      <div className="border-border bg-surface rounded-xl border p-5">
        <SectionHeader title="Rentabilidade por ano" subtitle="Retorno mensal e anual acumulado" />
        <div className="mt-4 overflow-x-auto">
          <table className="w-full min-w-[700px] text-[13px]">
            <thead>
              <tr className="border-border border-b">
                <th className="text-text-muted pb-2 pr-3 text-left font-medium">Ano</th>
                {MONTH_LABELS.map((m) => (
                  <th key={m} className="text-text-muted pb-2 px-1.5 text-right font-medium">{m}</th>
                ))}
                <th className="text-text-muted pb-2 pl-3 text-right font-medium">Total</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row, i) => (
                <tr key={row.year} className={cn("border-border border-b last:border-0", i === rows.length - 1 && "font-500")}>
                  <td className="text-text py-2.5 pr-3 font-medium">{row.year}</td>
                  {row.months.map((m) => (
                    <td
                      key={m.month}
                      className={cn(
                        "font-money px-1.5 py-2.5 text-right tabular-nums",
                        m.returnBps === null ? "text-text-muted" : m.returnBps >= 0 ? "text-green" : "text-red",
                      )}
                    >
                      {formatBps(m.returnBps)}
                    </td>
                  ))}
                  <td className={cn(
                    "font-money pl-3 py-2.5 text-right font-600 tabular-nums",
                    row.annualReturnBps === null ? "text-text-muted" : row.annualReturnBps >= 0 ? "text-green" : "text-red",
                  )}>
                    {formatBps(row.annualReturnBps)}
                  </td>
                </tr>
              ))}
              {rows.length > 0 && (
                <tr className="border-border border-t-2">
                  <td className="text-text py-2.5 pr-3 font-600">Total</td>
                  {monthlyCumulatives.map((val, idx) => (
                    <td key={idx} className={cn("font-money px-1.5 py-2.5 text-right font-600 tabular-nums", val === null ? "text-text-muted" : val >= 0 ? "text-green" : "text-red")}>
                      {formatBps(val)}
                    </td>
                  ))}
                  <td className={cn("font-money pl-3 py-2.5 text-right font-600 tabular-nums", grandTotal >= 0 ? "text-green" : "text-red")}>
                    {formatBps(grandTotal)}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* IBOV disclaimer */}
      <p className="text-text-muted text-[11px] px-1">
        * IBOV calculado com base na média histórica de longo prazo (~13% a.a.). Integração com dados reais em breve.
      </p>
    </div>
  );
}

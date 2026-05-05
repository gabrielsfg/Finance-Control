"use client";

import { useState, useMemo } from "react";
import { Target, TrendingUp, Clock, Percent, ChevronDown, ChevronUp } from "lucide-react";
import {
  ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip,
  CartesianGrid, ReferenceLine,
} from "recharts";
import { SectionHeader } from "@/components/shared/SectionHeader";
import { formatCurrency, formatCurrencyCompact } from "@/lib/utils/formatCurrency";
import { cn } from "@/lib/utils";
import { simulateMonthly, aggregateAnnual } from "../utils/taxCalc";
import type { AssetCategory, ChartGranularity } from "@/lib/types/simulation";
import { ASSET_CATEGORY_LABELS, GRANULARITY_LABELS } from "@/lib/types/simulation";

const inputCls = "border-border bg-surface2 text-text placeholder:text-text-muted w-full rounded-lg border h-9 px-3 text-[13px] outline-none focus:border-green/60 transition-colors";
const selectCls = `${inputCls} cursor-pointer`;

const CustomTooltip = ({ active, payload, label, goalCents }: any) => {
  if (!active || !payload?.length) return null;
  const gross = payload.find((p: any) => p.dataKey === "grossValue")?.value ?? 0;
  const pct = goalCents > 0 ? Math.min(100, (gross / goalCents) * 100).toFixed(1) : 0;
  return (
    <div className="border-border bg-surface rounded-lg border px-3 py-2.5 shadow-md min-w-[200px]">
      <p className="text-text-muted mb-2 text-[11px]">{label}</p>
      {payload.map((e: any) => (
        <div key={e.name} className="flex justify-between gap-4 mb-0.5">
          <span className="text-[12px]" style={{ color: e.stroke ?? e.fill }}>{e.name}</span>
          <span className="font-money text-[12px]" style={{ color: e.stroke ?? e.fill }}>
            {formatCurrency(e.value / 100)}
          </span>
        </div>
      ))}
      <p className="text-text-muted mt-1.5 border-t border-border pt-1 text-[11px]">{pct}% da meta atingida</p>
    </div>
  );
};

export const GoalProjection = () => {
  const [goalAmount, setGoalAmount]         = useState("50000");
  const [currentSavings, setCurrentSavings] = useState("5000");
  const [monthlyContrib, setMonthlyContrib] = useState("1000");
  const [annualRate, setAnnualRate]         = useState("10");
  const [assetCategory, setAssetCategory]   = useState<AssetCategory>("renda_fixa_bancaria");
  const [granularity, setGranularity]       = useState<ChartGranularity>("annual");
  const [showChart, setShowChart]           = useState(true);
  const [showBreakdown, setShowBreakdown]   = useState(false);
  const [breakdownPage, setBreakdownPage]   = useState(0);

  const result = useMemo(() => {
    const goal    = parseFloat(goalAmount.replace(",", ".")) * 100 || 0;
    const current = parseFloat(currentSavings.replace(",", ".")) * 100 || 0;
    const monthly = parseFloat(monthlyContrib.replace(",", ".")) * 100 || 0;
    const rate    = parseFloat(annualRate.replace(",", ".")) || 0;

    if (goal <= 0 || monthly <= 0 || rate <= 0) return null;

    // Find how many months until we hit goal
    const monthlyRate = rate / 100 / 12;
    let value  = current;
    let months = 0;
    while (value < goal && months < 1200) {
      value = value * (1 + monthlyRate) + monthly;
      months++;
    }
    if (months === 0) return null;

    // Full monthly simulation for those N months
    const all     = simulateMonthly(current, monthly, rate, months, assetCategory);
    const last    = all[all.length - 1];
    const annual  = aggregateAnnual(all);
    const chart   = granularity === "annual" ? annual : all;

    return {
      months,
      years:            Math.floor(months / 12),
      remainingMonths:  months % 12,
      goalCents:        goal,
      all,
      annual,
      chart,
      last,
    };
  }, [goalAmount, currentSavings, monthlyContrib, annualRate, assetCategory, granularity]);

  const PAGE_SIZE  = 10;
  const annualRows = result?.annual ?? [];
  const totalPages = Math.ceil(annualRows.length / PAGE_SIZE);
  const visibleRows = annualRows.slice(breakdownPage * PAGE_SIZE, (breakdownPage + 1) * PAGE_SIZE);

  return (
    <div className="border-border bg-surface rounded-xl border p-5">
      <SectionHeader title="Projeção de Meta" subtitle="Tempo, rendimento bruto e líquido até atingir o objetivo" />

      <div className="grid grid-cols-2 gap-3 mb-4">
        <div>
          <label className="text-text-muted mb-1.5 block text-[12px]">Meta (R$)</label>
          <input className={inputCls} value={goalAmount} onChange={(e) => setGoalAmount(e.target.value)} placeholder="50000" />
        </div>
        <div>
          <label className="text-text-muted mb-1.5 block text-[12px]">Guardado hoje (R$)</label>
          <input className={inputCls} value={currentSavings} onChange={(e) => setCurrentSavings(e.target.value)} placeholder="5000" />
        </div>
        <div>
          <label className="text-text-muted mb-1.5 block text-[12px]">Aporte mensal (R$)</label>
          <input className={inputCls} value={monthlyContrib} onChange={(e) => setMonthlyContrib(e.target.value)} placeholder="1000" />
        </div>
        <div>
          <label className="text-text-muted mb-1.5 block text-[12px]">Taxa anual (%)</label>
          <input className={inputCls} value={annualRate} onChange={(e) => setAnnualRate(e.target.value)} placeholder="10" />
        </div>
      </div>

      <div className="mb-5">
        <label className="text-text-muted mb-1.5 block text-[12px]">Tipo de ativo (para cálculo de IR)</label>
        <select className={selectCls} value={assetCategory} onChange={(e) => setAssetCategory(e.target.value as AssetCategory)}>
          {(Object.entries(ASSET_CATEGORY_LABELS) as [AssetCategory, string][]).map(([k, v]) => (
            <option key={k} value={k}>{v}</option>
          ))}
        </select>
      </div>

      {result ? (
        <>
          {/* KPI cards */}
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 mb-4">
            <div className="border-border bg-surface2 rounded-xl border p-4">
              <div className="bg-green/10 mb-3 flex h-9 w-9 items-center justify-center rounded-[10px]">
                <Clock size={18} className="text-green" strokeWidth={1.75} />
              </div>
              <p className="font-display font-700 text-text text-[13px]">Tempo estimado</p>
              <p className="font-display font-700 text-text mt-1 text-[17px]">
                {result.years > 0 ? `${result.years}a ` : ""}
                {result.remainingMonths > 0 ? `${result.remainingMonths}m` : result.years === 0 ? "< 1 mês" : ""}
              </p>
              <p className="text-text-muted mt-0.5 text-[11px]">{result.months} meses</p>
            </div>

            <div className="border-border bg-surface2 rounded-xl border p-4">
              <div className="bg-blue/10 mb-3 flex h-9 w-9 items-center justify-center rounded-[10px]">
                <Target size={18} className="text-blue" strokeWidth={1.75} />
              </div>
              <p className="font-display font-700 text-text text-[13px]">Total investido</p>
              <p className="font-money font-700 text-text mt-1 text-[17px]">
                {formatCurrency(result.last.invested / 100)}
              </p>
            </div>

            <div className="border-border bg-surface2 rounded-xl border p-4">
              <div className="bg-green/10 mb-3 flex h-9 w-9 items-center justify-center rounded-[10px]">
                <TrendingUp size={18} className="text-green" strokeWidth={1.75} />
              </div>
              <p className="font-display font-700 text-text text-[13px]">Ganho líquido</p>
              <p className="font-money font-700 text-green mt-1 text-[17px]">
                +{formatCurrency(result.last.netGain / 100)}
              </p>
              <p className="text-text-muted mt-0.5 text-[11px]">Bruto: +{formatCurrency(result.last.grossGain / 100)}</p>
            </div>

            <div className="border-border bg-surface2 rounded-xl border p-4">
              <div className="bg-orange/10 mb-3 flex h-9 w-9 items-center justify-center rounded-[10px]">
                <Percent size={18} className="text-orange" strokeWidth={1.75} />
              </div>
              <p className="font-display font-700 text-text text-[13px]">Imposto total</p>
              <p className="font-money font-700 text-orange mt-1 text-[17px]">
                {formatCurrency(result.last.totalTax / 100)}
              </p>
              <p className="text-text-muted mt-0.5 text-[11px]">Alíq. {(result.last.irRate * 100).toFixed(1)}% — {result.last.irRateLabel}</p>
            </div>
          </div>

          {/* Full flow summary */}
          <div className="border-border bg-surface2/60 mb-4 rounded-xl border p-4">
            <p className="text-text-muted mb-3 text-[11px] font-medium uppercase tracking-wider">Fluxo financeiro completo</p>
            <div className="grid grid-cols-2 gap-x-6 gap-y-2 sm:grid-cols-4 text-[12px]">
              {[
                { label: "Aporte inicial", value: parseFloat(currentSavings) * 100, color: "text-text" },
                { label: "Aportes mensais totais", value: result.last.invested - parseFloat(currentSavings) * 100, color: "text-text" },
                { label: "Total aportado", value: result.last.invested, color: "text-blue" },
                { label: "Patrimônio bruto", value: result.last.grossValue, color: "text-text" },
                { label: "Rendimento bruto", value: result.last.grossGain, color: "text-green" },
                { label: "IR a pagar", value: result.last.irAmount, color: "text-orange" },
                { label: "IOF a pagar", value: result.last.iofAmount, color: "text-red" },
                { label: "Patrimônio líquido", value: result.last.netValue, color: "text-green" },
              ].map(({ label, value, color }) => (
                <div key={label}>
                  <p className="text-text-muted text-[11px]">{label}</p>
                  <p className={cn("font-money font-600 text-[14px]", color)}>{formatCurrency(value / 100)}</p>
                </div>
              ))}
            </div>
            <div className="mt-3 border-t border-border pt-3 flex flex-wrap gap-4 text-[12px]">
              <span className="text-text-muted">Renda gerada no último mês (bruto):</span>
              <span className="font-money text-text">{formatCurrency(result.last.monthlyGrossIncome / 100)}/mês</span>
              <span className="text-text-muted">Renda líquida:</span>
              <span className="font-money text-green">{formatCurrency(result.last.monthlyNetIncome / 100)}/mês</span>
            </div>
          </div>

          {/* Chart */}
          <div className="mb-3 flex items-center justify-between">
            <button
              onClick={() => setShowChart((p) => !p)}
              className="flex items-center gap-1 text-[12px] text-blue hover:underline"
            >
              {showChart ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
              {showChart ? "Ocultar gráfico" : "Mostrar evolução"}
            </button>
            {showChart && (
              <div className="flex gap-1.5">
                {(Object.entries(GRANULARITY_LABELS) as [ChartGranularity, string][]).map(([g, lbl]) => (
                  <button
                    key={g}
                    onClick={() => setGranularity(g)}
                    className={cn(
                      "rounded-md px-2.5 py-1 text-[11px] font-medium transition-colors",
                      granularity === g ? "bg-green/15 text-green" : "text-text-muted hover:text-text"
                    )}
                  >
                    {lbl}
                  </button>
                ))}
              </div>
            )}
          </div>

          {showChart && (
            <div style={{ minHeight: 220 }}>
              <ResponsiveContainer width="100%" height={220}>
                <AreaChart data={result.chart} margin={{ top: 4, right: 4, left: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id="gp_gradGross" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="var(--green)" stopOpacity={0.2} />
                      <stop offset="95%" stopColor="var(--green)" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="gp_gradNet" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="var(--cyan)" stopOpacity={0.15} />
                      <stop offset="95%" stopColor="var(--cyan)" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="gp_gradInv" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="var(--blue)" stopOpacity={0.15} />
                      <stop offset="95%" stopColor="var(--blue)" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                  <XAxis dataKey="shortLabel" tick={{ fill: "var(--text-muted)", fontSize: 11, fontFamily: "DM Sans" }} axisLine={false} tickLine={false} interval="preserveStartEnd" />
                  <YAxis tick={{ fill: "var(--text-muted)", fontSize: 11, fontFamily: "JetBrains Mono" }} axisLine={false} tickLine={false} tickFormatter={(v) => formatCurrencyCompact(v / 100)} width={72} />
                  <Tooltip content={<CustomTooltip goalCents={result.goalCents} />} />
                  <ReferenceLine
                    y={result.goalCents}
                    stroke="var(--orange)"
                    strokeDasharray="5 3"
                    label={{ value: "Meta", fill: "var(--orange)", fontSize: 11, position: "insideTopRight" }}
                  />
                  <Area type="monotone" dataKey="grossValue" name="Patrimônio bruto"   stroke="var(--green)" strokeWidth={2} fill="url(#gp_gradGross)" />
                  <Area type="monotone" dataKey="netValue"   name="Patrimônio líquido" stroke="var(--cyan)"  strokeWidth={1.5} strokeDasharray="4 2" fill="url(#gp_gradNet)" />
                  <Area type="monotone" dataKey="invested"   name="Investido"          stroke="var(--blue)"  strokeWidth={2} fill="url(#gp_gradInv)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          )}

          {/* Annual breakdown table */}
          <div className="mt-4">
            <button
              onClick={() => setShowBreakdown((p) => !p)}
              className="mb-3 flex items-center gap-1.5 text-[12px] text-blue hover:underline"
            >
              {showBreakdown ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
              {showBreakdown ? "Ocultar" : "Ver"} detalhamento por ano
            </button>

            {showBreakdown && (
              <>
                <div className="overflow-x-auto rounded-xl border border-border">
                  <table className="w-full text-[12px] min-w-[600px]">
                    <thead>
                      <tr className="border-b border-border bg-surface2/40">
                        <th className="text-text-muted px-3 py-2.5 text-left font-medium">Ano</th>
                        <th className="text-text-muted px-3 py-2.5 text-right font-medium">Aportes acum.</th>
                        <th className="text-text-muted px-3 py-2.5 text-right font-medium">Patrimônio bruto</th>
                        <th className="text-text-muted px-3 py-2.5 text-right font-medium">IR acumulado</th>
                        <th className="text-text-muted px-3 py-2.5 text-right font-medium">Patrimônio líquido</th>
                        <th className="text-text-muted px-3 py-2.5 text-right font-medium">Renda/mês (líq.)</th>
                        <th className="text-text-muted px-3 py-2.5 text-right font-medium">% da meta</th>
                      </tr>
                    </thead>
                    <tbody>
                      {visibleRows.map((r) => {
                        const pct = Math.min(100, (r.grossValue / result.goalCents) * 100);
                        return (
                          <tr key={r.year} className="border-b border-border last:border-0 hover:bg-surface2/30 transition-colors">
                            <td className="px-3 py-2.5 font-medium text-text">Ano {r.year}</td>
                            <td className="px-3 py-2.5 text-right font-money text-text-muted">{formatCurrency(r.invested / 100)}</td>
                            <td className="px-3 py-2.5 text-right font-money text-text">{formatCurrency(r.grossValue / 100)}</td>
                            <td className="px-3 py-2.5 text-right font-money text-orange">{formatCurrency(r.irAmount / 100)}</td>
                            <td className="px-3 py-2.5 text-right font-money text-cyan">{formatCurrency(r.netValue / 100)}</td>
                            <td className="px-3 py-2.5 text-right font-money text-green">{formatCurrency(r.monthlyNetIncome / 100)}</td>
                            <td className="px-3 py-2.5 text-right">
                              <div className="flex items-center justify-end gap-2">
                                <div className="h-1.5 w-16 overflow-hidden rounded-full bg-surface2">
                                  <div className="h-full rounded-full bg-green/70" style={{ width: `${pct}%` }} />
                                </div>
                                <span className={cn("font-mono text-[11px]", pct >= 100 ? "text-green" : "text-text-muted")}>
                                  {pct.toFixed(0)}%
                                </span>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
                {totalPages > 1 && (
                  <div className="mt-2 flex items-center justify-between px-1">
                    <button disabled={breakdownPage === 0} onClick={() => setBreakdownPage((p) => p - 1)} className="text-[11px] text-blue disabled:opacity-30 hover:underline">← Anterior</button>
                    <span className="text-text-muted text-[11px]">Página {breakdownPage + 1} / {totalPages}</span>
                    <button disabled={breakdownPage >= totalPages - 1} onClick={() => setBreakdownPage((p) => p + 1)} className="text-[11px] text-blue disabled:opacity-30 hover:underline">Próxima →</button>
                  </div>
                )}
              </>
            )}
          </div>
        </>
      ) : (
        <div className="bg-surface2 flex h-24 items-center justify-center rounded-xl">
          <p className="text-text-muted text-[13px]">Preencha os campos para ver a projeção</p>
        </div>
      )}
    </div>
  );
};

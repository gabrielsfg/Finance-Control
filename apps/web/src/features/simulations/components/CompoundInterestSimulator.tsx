"use client";

import { useState, useMemo } from "react";
import {
  ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid,
} from "recharts";
import { SectionHeader } from "@/components/shared/SectionHeader";
import { formatCurrency, formatCurrencyCompact } from "@/lib/utils/formatCurrency";
import { cn } from "@/lib/utils";
import { Info, ChevronDown, ChevronUp } from "lucide-react";
import { simulateMonthly, aggregateAnnual } from "../utils/taxCalc";
import type { AssetCategory, ChartGranularity } from "@/lib/types/simulation";
import { ASSET_CATEGORY_LABELS, GRANULARITY_LABELS } from "@/lib/types/simulation";

const inputCls = "border-border bg-surface2 text-text placeholder:text-text-muted w-full rounded-lg border h-9 px-3 text-[13px] outline-none focus:border-green/60 transition-colors";
const selectCls = `${inputCls} cursor-pointer`;

type ViewMode = "gross" | "net";

const TAX_NOTES: Record<AssetCategory, string> = {
  renda_fixa_bancaria: "IR regressivo: 22,5% (até 6m) → 15% (acima de 2 anos) + IOF nos primeiros 30 dias",
  tesouro_direto:      "IR regressivo: 22,5% (até 6m) → 15% (acima de 2 anos) + IOF nos primeiros 30 dias",
  fundo_curto_prazo:   "Come-cotas semestral (20%) descontado na cota a cada maio/novembro",
  fundo_longo_prazo:   "Come-cotas semestral (15%) descontado na cota a cada maio/novembro",
  acoes:               "15% sobre ganho de capital no resgate (isenção até R$ 20.000/mês em vendas)",
  fii:                 "20% sobre ganho de capital na venda. Dividendos mensais isentos para PF",
  cripto:              "15% sobre ganho (ganhos acima de R$ 5 milhões têm alíquotas maiores)",
  internacional:       "15% sobre ganho de capital na venda",
};

const PERIOD_PRESETS = [
  { label: "1 ano",  months: 12  },
  { label: "2 anos", months: 24  },
  { label: "5 anos", months: 60  },
  { label: "10 anos",months: 120 },
  { label: "20 anos",months: 240 },
  { label: "30 anos",months: 360 },
];

const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
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
    </div>
  );
};

export const CompoundInterestSimulator = () => {
  const [initialAmount, setInitialAmount]   = useState("10000");
  const [monthlyContrib, setMonthlyContrib] = useState("500");
  const [annualRate, setAnnualRate]         = useState("12");
  const [customMonths, setCustomMonths]     = useState("");
  const [presetMonths, setPresetMonths]     = useState(120);
  const [assetCategory, setAssetCategory]   = useState<AssetCategory>("renda_fixa_bancaria");
  const [viewMode, setViewMode]             = useState<ViewMode>("gross");
  const [granularity, setGranularity]       = useState<ChartGranularity>("annual");
  const [showBreakdown, setShowBreakdown]   = useState(false);
  const [breakdownPage, setBreakdownPage]   = useState(0);

  const totalMonths = customMonths ? (parseInt(customMonths) || 0) : presetMonths;

  const { allPoints, chartPoints, last } = useMemo(() => {
    const initial = parseFloat(initialAmount.replace(",", ".")) * 100 || 0;
    const monthly = parseFloat(monthlyContrib.replace(",", ".")) * 100 || 0;
    const rate    = parseFloat(annualRate.replace(",", ".")) || 0;
    if (!totalMonths || !rate) return { allPoints: [], chartPoints: [], last: null };

    const all    = simulateMonthly(initial, monthly, rate, totalMonths, assetCategory);
    const chart  = granularity === "annual" ? aggregateAnnual(all) : all;
    return { allPoints: all, chartPoints: chart, last: all[all.length - 1] ?? null };
  }, [initialAmount, monthlyContrib, annualRate, totalMonths, assetCategory, granularity]);

  // Breakdown table pagination (annual rows)
  const annualRows = useMemo(() => aggregateAnnual(allPoints), [allPoints]);
  const PAGE_SIZE  = 10;
  const totalPages = Math.ceil(annualRows.length / PAGE_SIZE);
  const visibleRows = annualRows.slice(breakdownPage * PAGE_SIZE, (breakdownPage + 1) * PAGE_SIZE);

  const displayValue  = last ? (viewMode === "net" ? last.netValue    : last.grossValue) : 0;
  const displayGain   = last ? (viewMode === "net" ? last.netGain     : last.grossGain)  : 0;
  const displayTax    = last ? last.totalTax   : 0;
  const investedTotal = last ? last.invested   : 0;

  // monthly income that hits your pocket right now (last month's yield)
  const lastMonthGross = last?.monthlyGrossIncome ?? 0;
  const lastMonthNet   = last?.monthlyNetIncome   ?? 0;

  return (
    <div className="border-border bg-surface rounded-xl border p-5">
      <SectionHeader title="Juros Compostos" subtitle="Simulação com tributação por tipo de ativo" />

      {/* Inputs */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 mb-4">
        <div>
          <label className="text-text-muted mb-1.5 block text-[12px]">Valor inicial (R$)</label>
          <input className={inputCls} value={initialAmount} onChange={(e) => setInitialAmount(e.target.value)} placeholder="10000" />
        </div>
        <div>
          <label className="text-text-muted mb-1.5 block text-[12px]">Aporte mensal (R$)</label>
          <input className={inputCls} value={monthlyContrib} onChange={(e) => setMonthlyContrib(e.target.value)} placeholder="500" />
        </div>
        <div>
          <label className="text-text-muted mb-1.5 block text-[12px]">Taxa anual (%)</label>
          <input className={inputCls} value={annualRate} onChange={(e) => setAnnualRate(e.target.value)} placeholder="12" />
        </div>
        <div>
          <label className="text-text-muted mb-1.5 block text-[12px]">Meses (personalizado)</label>
          <input className={inputCls} value={customMonths} onChange={(e) => { setCustomMonths(e.target.value); }} placeholder="ex: 84" />
        </div>
      </div>

      {/* Period presets */}
      <div className="mb-4">
        <label className="text-text-muted mb-1.5 block text-[12px]">Período rápido</label>
        <div className="flex flex-wrap gap-1.5">
          {PERIOD_PRESETS.map((p) => (
            <button
              key={p.months}
              onClick={() => { setPresetMonths(p.months); setCustomMonths(""); }}
              className={cn(
                "rounded-lg border px-3 py-1.5 text-[12px] font-medium transition-colors",
                (!customMonths && presetMonths === p.months)
                  ? "bg-green/15 text-green border-green/30"
                  : "text-text-muted border-border hover:text-text"
              )}
            >
              {p.label}
            </button>
          ))}
        </div>
      </div>

      {/* Asset type */}
      <div className="mb-5">
        <label className="text-text-muted mb-1.5 block text-[12px]">Tipo de ativo</label>
        <select className={selectCls} value={assetCategory} onChange={(e) => setAssetCategory(e.target.value as AssetCategory)}>
          {(Object.entries(ASSET_CATEGORY_LABELS) as [AssetCategory, string][]).map(([k, v]) => (
            <option key={k} value={k}>{v}</option>
          ))}
        </select>
        <p className="text-text-muted mt-1.5 flex items-start gap-1 text-[11px] leading-relaxed">
          <Info size={11} className="mt-0.5 shrink-0 text-blue/70" />
          {TAX_NOTES[assetCategory]}
        </p>
      </div>

      {last && (
        <>
          {/* View toggle */}
          <div className="mb-4 flex gap-1.5">
            {(["gross", "net"] as ViewMode[]).map((mode) => (
              <button
                key={mode}
                onClick={() => setViewMode(mode)}
                className={cn(
                  "rounded-lg px-3 py-1.5 text-[12px] font-medium transition-colors",
                  viewMode === mode ? "bg-green/15 text-green" : "text-text-muted hover:text-text"
                )}
              >
                {mode === "gross" ? "Bruto" : "Líquido (após IR/IOF)"}
              </button>
            ))}
          </div>

          {/* KPI grid — 6 cards */}
          <div className="bg-surface2 mb-2 grid grid-cols-2 gap-3 rounded-xl p-4 sm:grid-cols-3">
            <div>
              <p className="text-text-muted text-[11px]">Patrimônio {viewMode === "net" ? "líquido" : "bruto"} final</p>
              <p className="font-money font-600 text-green text-[20px]">{formatCurrency(displayValue / 100)}</p>
            </div>
            <div>
              <p className="text-text-muted text-[11px]">Total investido (aportes)</p>
              <p className="font-money font-600 text-text text-[20px]">{formatCurrency(investedTotal / 100)}</p>
            </div>
            <div>
              <p className="text-text-muted text-[11px]">Rendimento {viewMode === "net" ? "líquido" : "bruto"}</p>
              <p className="font-money font-600 text-blue text-[20px]">{formatCurrency(displayGain / 100)}</p>
            </div>
            <div>
              <p className="text-text-muted text-[11px]">Imposto total estimado</p>
              <p className="font-money font-600 text-orange text-[20px]">{formatCurrency(displayTax / 100)}</p>
              <p className="text-text-muted text-[10px]">
                IR: {formatCurrency(last.irAmount / 100)}
                {last.iofAmount > 0 ? ` · IOF: ${formatCurrency(last.iofAmount / 100)}` : ""}
              </p>
            </div>
            <div>
              <p className="text-text-muted text-[11px]">Rendimento bruto/mês (no {totalMonths}º mês)</p>
              <p className="font-money font-600 text-cyan text-[20px]">+{formatCurrency(lastMonthGross / 100)}</p>
              <p className="text-text-muted text-[10px]">Líquido: +{formatCurrency(lastMonthNet / 100)}</p>
            </div>
            <div>
              <p className="text-text-muted text-[11px]">Retorno total / Taxa efetiva IR</p>
              <p className="font-money font-600 text-purple text-[20px]">{last.returnPct.toFixed(2)}%</p>
              <p className="text-text-muted text-[10px]">{last.irRateLabel}</p>
            </div>
          </div>

          {/* Breakdown bar */}
          {last.grossGain > 0 && (
            <div className="mb-4">
              <p className="text-text-muted mb-1.5 text-[11px]">Composição do patrimônio bruto</p>
              <div className="flex h-5 overflow-hidden rounded-full">
                <div
                  style={{ width: `${(last.invested / last.grossValue) * 100}%`, backgroundColor: "var(--blue)" }}
                  className="h-full"
                  title={`Aportes: ${formatCurrency(last.invested / 100)}`}
                />
                <div
                  style={{ width: `${(last.irAmount / last.grossValue) * 100}%`, backgroundColor: "var(--orange)" }}
                  className="h-full"
                  title={`IR: ${formatCurrency(last.irAmount / 100)}`}
                />
                {last.iofAmount > 0 && (
                  <div
                    style={{ width: `${(last.iofAmount / last.grossValue) * 100}%`, backgroundColor: "var(--red)" }}
                    className="h-full"
                    title={`IOF: ${formatCurrency(last.iofAmount / 100)}`}
                  />
                )}
                <div
                  style={{ width: `${(last.netGain / last.grossValue) * 100}%`, backgroundColor: "var(--green)" }}
                  className="h-full"
                  title={`Lucro líquido: ${formatCurrency(last.netGain / 100)}`}
                />
              </div>
              <div className="mt-1.5 flex flex-wrap gap-3">
                {[
                  { color: "var(--blue)",   label: "Aportes",      value: last.invested   },
                  { color: "var(--green)",  label: "Lucro líquido",value: last.netGain    },
                  { color: "var(--orange)", label: "IR",            value: last.irAmount   },
                  ...(last.iofAmount > 0 ? [{ color: "var(--red)", label: "IOF", value: last.iofAmount }] : []),
                ].map(({ color, label, value }) => (
                  <div key={label} className="flex items-center gap-1.5">
                    <div className="h-2 w-2 rounded-sm" style={{ backgroundColor: color }} />
                    <span className="text-text-muted text-[11px]">{label}: </span>
                    <span className="font-money text-[11px] text-text">{formatCurrency(value / 100)}</span>
                    <span className="text-text-muted text-[10px]">({((value / last.grossValue) * 100).toFixed(1)}%)</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}

      {/* Chart controls */}
      <div className="mb-3 flex items-center justify-between">
        <p className="text-text-muted text-[12px]">Evolução patrimonial</p>
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
      </div>

      <div style={{ minHeight: 240 }}>
        <ResponsiveContainer width="100%" height={240}>
          <AreaChart data={chartPoints} margin={{ top: 4, right: 4, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id="cis_gradTotal" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="var(--green)"  stopOpacity={0.2} />
                <stop offset="95%" stopColor="var(--green)" stopOpacity={0}   />
              </linearGradient>
              <linearGradient id="cis_gradNet" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="var(--cyan)"  stopOpacity={0.2} />
                <stop offset="95%" stopColor="var(--cyan)" stopOpacity={0}   />
              </linearGradient>
              <linearGradient id="cis_gradInv" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="var(--blue)"  stopOpacity={0.15} />
                <stop offset="95%" stopColor="var(--blue)" stopOpacity={0}    />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
            <XAxis dataKey="shortLabel" tick={{ fill: "var(--text-muted)", fontSize: 11, fontFamily: "DM Sans" }} axisLine={false} tickLine={false} interval="preserveStartEnd" />
            <YAxis tick={{ fill: "var(--text-muted)", fontSize: 11, fontFamily: "JetBrains Mono" }} axisLine={false} tickLine={false} tickFormatter={(v) => formatCurrencyCompact(v / 100)} width={72} />
            <Tooltip content={<CustomTooltip />} />
            <Area type="monotone" dataKey="grossValue" name="Patrimônio bruto" stroke="var(--green)" strokeWidth={2} fill="url(#cis_gradTotal)" />
            <Area type="monotone" dataKey="netValue"   name="Patrimônio líquido" stroke="var(--cyan)" strokeWidth={1.5} strokeDasharray="4 2" fill="url(#cis_gradNet)" />
            <Area type="monotone" dataKey="invested"   name="Investido" stroke="var(--blue)" strokeWidth={2} fill="url(#cis_gradInv)" />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      <div className="mt-2 flex flex-wrap gap-4">
        {[
          ["var(--green)", "Patrimônio bruto"],
          ["var(--cyan)",  "Patrimônio líquido"],
          ["var(--blue)",  "Investido"],
        ].map(([color, label]) => (
          <div key={label} className="flex items-center gap-1.5">
            <div className="h-2.5 w-2.5 rounded-[2px]" style={{ backgroundColor: color }} />
            <span className="text-text-muted text-[13px]">{label}</span>
          </div>
        ))}
      </div>

      {/* Annual breakdown table */}
      {annualRows.length > 0 && (
        <div className="mt-5">
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
                <table className="w-full text-[12px] min-w-[640px]">
                  <thead>
                    <tr className="border-b border-border bg-surface2/40">
                      <th className="text-text-muted px-3 py-2.5 text-left font-medium">Ano</th>
                      <th className="text-text-muted px-3 py-2.5 text-right font-medium">Aportes acum.</th>
                      <th className="text-text-muted px-3 py-2.5 text-right font-medium">Patrimônio bruto</th>
                      <th className="text-text-muted px-3 py-2.5 text-right font-medium">Rendimento bruto</th>
                      <th className="text-text-muted px-3 py-2.5 text-right font-medium">IR acumulado</th>
                      <th className="text-text-muted px-3 py-2.5 text-right font-medium">Patrimônio líquido</th>
                      <th className="text-text-muted px-3 py-2.5 text-right font-medium">Renda bruta/mês</th>
                      <th className="text-text-muted px-3 py-2.5 text-right font-medium">Renda líq./mês</th>
                    </tr>
                  </thead>
                  <tbody>
                    {visibleRows.map((r) => (
                      <tr key={r.year} className="border-b border-border last:border-0 hover:bg-surface2/30 transition-colors">
                        <td className="px-3 py-2.5 font-medium text-text">Ano {r.year}</td>
                        <td className="px-3 py-2.5 text-right font-money text-text-muted">{formatCurrency(r.invested / 100)}</td>
                        <td className="px-3 py-2.5 text-right font-money text-text">{formatCurrency(r.grossValue / 100)}</td>
                        <td className="px-3 py-2.5 text-right font-money text-green">+{formatCurrency(r.grossGain / 100)}</td>
                        <td className="px-3 py-2.5 text-right font-money text-orange">{formatCurrency(r.irAmount / 100)}</td>
                        <td className="px-3 py-2.5 text-right font-money text-cyan">{formatCurrency(r.netValue / 100)}</td>
                        <td className="px-3 py-2.5 text-right font-money text-text">{formatCurrency(r.monthlyGrossIncome / 100)}</td>
                        <td className="px-3 py-2.5 text-right font-money text-green">{formatCurrency(r.monthlyNetIncome / 100)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {totalPages > 1 && (
                <div className="mt-2 flex items-center justify-between px-1">
                  <button
                    disabled={breakdownPage === 0}
                    onClick={() => setBreakdownPage((p) => p - 1)}
                    className="text-[11px] text-blue disabled:opacity-30 hover:underline"
                  >
                    ← Anterior
                  </button>
                  <span className="text-text-muted text-[11px]">Página {breakdownPage + 1} / {totalPages}</span>
                  <button
                    disabled={breakdownPage >= totalPages - 1}
                    onClick={() => setBreakdownPage((p) => p + 1)}
                    className="text-[11px] text-blue disabled:opacity-30 hover:underline"
                  >
                    Próxima →
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
};

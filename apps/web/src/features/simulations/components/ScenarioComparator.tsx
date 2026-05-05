"use client";

import { useState, useMemo } from "react";
import {
  ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid,
} from "recharts";
import { SectionHeader } from "@/components/shared/SectionHeader";
import { formatCurrency, formatCurrencyCompact } from "@/lib/utils/formatCurrency";
import { cn } from "@/lib/utils";
import { Plus, Trash2, Info, Search, ChevronDown, ChevronUp } from "lucide-react";
import { useBenchmarkRates } from "../hooks/useSimulation";
import { simulateMonthly, aggregateAnnual } from "../utils/taxCalc";
import type {
  AssetCategory, SimulationScenario, ChartGranularity,
  PresetAsset, PresetAssetGroup,
} from "@/lib/types/simulation";
import {
  ASSET_CATEGORY_LABELS, GRANULARITY_LABELS,
  PRESET_ASSETS, PRESET_ASSET_GROUPS,
} from "@/lib/types/simulation";

const inputCls = "border-border bg-surface2 text-text placeholder:text-text-muted w-full rounded-lg border h-9 px-3 text-[13px] outline-none focus:border-green/60 transition-colors";
const selectCls = `${inputCls} cursor-pointer`;

const SCENARIO_COLORS = [
  "var(--green)", "var(--blue)", "var(--purple)", "var(--orange)",
];

const PERIOD_PRESETS = [
  { label: "1a",   months: 12  },
  { label: "2a",   months: 24  },
  { label: "5a",   months: 60  },
  { label: "10a",  months: 120 },
  { label: "20a",  months: 240 },
  { label: "30a",  months: 360 },
];

function uid() {
  return `s${Date.now()}${Math.random().toString(36).slice(2, 6)}`;
}

const DEFAULT_SCENARIOS: SimulationScenario[] = [
  { id: "s1", label: "CDB 100% CDI",    annualRate: 10.5,  assetCategory: "renda_fixa_bancaria", color: SCENARIO_COLORS[0], presetId: "cdi_100",   isStub: false, rateSource: "BACEN (dinâmico)" },
  { id: "s2", label: "Tesouro IPCA+",   annualRate: 8.5,   assetCategory: "tesouro_direto",       color: SCENARIO_COLORS[1], presetId: "tesouro_ipca_2029", isStub: true  },
  { id: "s3", label: "Ibovespa (avg)",  annualRate: 13.0,  assetCategory: "acoes",                color: SCENARIO_COLORS[2], presetId: "ibovespa_avg",     isStub: true  },
];

// ——— Asset Picker Modal ————————————————————————————————————————————————
function AssetPicker({
  onSelect,
  onClose,
  rates,
}: {
  onSelect: (asset: PresetAsset) => void;
  onClose: () => void;
  rates?: { cdiAnnual: number; selicAnnual: number };
}) {
  const [search, setSearch] = useState("");
  const [activeGroup, setActiveGroup] = useState<PresetAssetGroup | "all">("all");

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return PRESET_ASSETS.filter((a) => {
      const matchGroup = activeGroup === "all" || a.group === activeGroup;
      const matchSearch = !q || a.label.toLowerCase().includes(q) || (a.ticker?.toLowerCase().includes(q) ?? false) || a.description.toLowerCase().includes(q);
      return matchGroup && matchSearch;
    });
  }, [search, activeGroup]);

  // Resolve live rate for CDI/SELIC-linked presets
  function effectiveRate(asset: PresetAsset): number {
    if (!rates) return asset.annualRate;
    if (asset.id === "cdi_100")    return rates.cdiAnnual;
    if (asset.id === "cdi_110")    return Math.round(rates.cdiAnnual * 1.1 * 100) / 100;
    if (asset.id === "lci_95")     return Math.round(rates.cdiAnnual * 0.95 * 100) / 100;
    if (asset.id === "tesouro_selic") return rates.selicAnnual;
    if (asset.id === "poupanca")   return Math.round(rates.selicAnnual * 0.7 * 100) / 100;
    return asset.annualRate;
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4" onClick={onClose}>
      <div
        className="border-border bg-surface w-full max-w-2xl rounded-2xl border shadow-2xl flex flex-col max-h-[85vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="border-b border-border px-5 py-4 flex items-center justify-between">
          <div>
            <p className="text-text font-medium text-[15px]">Escolher ativo</p>
            <p className="text-text-muted text-[12px]">Taxa baseada em médias históricas ou dados reais do BACEN</p>
          </div>
          <button onClick={onClose} className="text-text-muted hover:text-text text-[20px] leading-none">×</button>
        </div>

        {/* Search */}
        <div className="px-5 py-3 border-b border-border">
          <div className="relative">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" />
            <input
              className={cn(inputCls, "pl-8")}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar ativo ou ticker..."
              autoFocus
            />
          </div>
        </div>

        {/* Group tabs */}
        <div className="flex gap-1.5 overflow-x-auto px-5 py-2.5 border-b border-border">
          <button
            onClick={() => setActiveGroup("all")}
            className={cn("shrink-0 rounded-md px-2.5 py-1 text-[11px] font-medium transition-colors",
              activeGroup === "all" ? "bg-green/15 text-green" : "text-text-muted hover:text-text")}
          >
            Todos
          </button>
          {(Object.entries(PRESET_ASSET_GROUPS) as [PresetAssetGroup, string][]).map(([g, lbl]) => (
            <button
              key={g}
              onClick={() => setActiveGroup(g)}
              className={cn("shrink-0 rounded-md px-2.5 py-1 text-[11px] font-medium transition-colors",
                activeGroup === g ? "bg-green/15 text-green" : "text-text-muted hover:text-text")}
            >
              {lbl}
            </button>
          ))}
        </div>

        {/* Asset list */}
        <div className="overflow-y-auto flex-1 px-3 py-2">
          {filtered.length === 0 ? (
            <p className="text-text-muted text-center py-8 text-[13px]">Nenhum ativo encontrado</p>
          ) : (
            <div className="grid grid-cols-1 gap-1 sm:grid-cols-2">
              {filtered.map((asset) => {
                const rate = effectiveRate(asset);
                return (
                  <button
                    key={asset.id}
                    onClick={() => { onSelect({ ...asset, annualRate: rate }); onClose(); }}
                    className="text-left rounded-xl border border-border bg-surface2/50 hover:bg-surface2 hover:border-green/30 p-3 transition-all"
                  >
                    <div className="flex items-start justify-between gap-2 mb-1">
                      <div>
                        <span className="text-text text-[13px] font-medium">{asset.label}</span>
                        {asset.ticker && (
                          <span className="ml-1.5 text-[10px] text-text-muted bg-surface2 border border-border rounded px-1 py-0.5">{asset.ticker}</span>
                        )}
                      </div>
                      <div className="text-right shrink-0">
                        <span className="font-money text-[14px] text-green font-600">{rate.toFixed(2)}%</span>
                        <span className="text-text-muted text-[10px] block">a.a.</span>
                      </div>
                    </div>
                    <p className="text-text-muted text-[11px] leading-snug">{asset.description}</p>
                    <div className="mt-1.5 flex items-center gap-1">
                      {asset.isStub && (
                        <span className="text-[10px] bg-orange/10 text-orange rounded px-1.5 py-0.5">estimado</span>
                      )}
                      <span className="text-[10px] text-text-muted">{asset.rateSource}</span>
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ——— Main component ————————————————————————————————————————————————————
const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="border-border bg-surface rounded-lg border px-3 py-2.5 shadow-md min-w-[220px]">
      <p className="text-text-muted mb-2 text-[11px]">{label}</p>
      {payload.map((e: any) => (
        <div key={e.name} className="flex items-center justify-between gap-4 mb-0.5">
          <span className="text-[12px]" style={{ color: e.stroke }}>{e.name}</span>
          <span className="font-money text-[12px]" style={{ color: e.stroke }}>
            {formatCurrency(e.value / 100)}
          </span>
        </div>
      ))}
    </div>
  );
};

export const ScenarioComparator = () => {
  const [scenarios, setScenarios]           = useState<SimulationScenario[]>(DEFAULT_SCENARIOS);
  const [initialAmount, setInitialAmount]   = useState("10000");
  const [monthlyContrib, setMonthlyContrib] = useState("500");
  const [presetMonths, setPresetMonths]     = useState(120);
  const [customMonths, setCustomMonths]     = useState("");
  const [showAfterTax, setShowAfterTax]     = useState(false);
  const [granularity, setGranularity]       = useState<ChartGranularity>("annual");
  const [pickerFor, setPickerFor]           = useState<string | null>(null); // scenario id

  const { data: rates } = useBenchmarkRates();

  const totalMonths = customMonths ? (parseInt(customMonths) || 0) : presetMonths;
  const initial     = parseFloat(initialAmount.replace(",", ".")) * 100 || 0;
  const monthly     = parseFloat(monthlyContrib.replace(",", ".")) * 100 || 0;

  // Resolve live CDI/SELIC rates into scenarios
  const liveScenarios = useMemo(() => {
    if (!rates) return scenarios;
    return scenarios.map((s) => {
      if (s.presetId === "cdi_100")      return { ...s, annualRate: rates.cdiAnnual };
      if (s.presetId === "cdi_110")      return { ...s, annualRate: Math.round(rates.cdiAnnual * 1.1 * 100) / 100 };
      if (s.presetId === "lci_95")       return { ...s, annualRate: Math.round(rates.cdiAnnual * 0.95 * 100) / 100 };
      if (s.presetId === "tesouro_selic") return { ...s, annualRate: rates.selicAnnual };
      if (s.presetId === "poupanca")     return { ...s, annualRate: Math.round(rates.selicAnnual * 0.7 * 100) / 100 };
      return s;
    });
  }, [scenarios, rates]);

  const scenarioResults = useMemo(() => {
    return liveScenarios.map((s) => {
      const all   = simulateMonthly(initial, monthly, s.annualRate, totalMonths, s.assetCategory);
      const last  = all[all.length - 1] ?? null;
      const chart = granularity === "annual" ? aggregateAnnual(all) : all;
      return { scenario: s, all, chart, last };
    });
  }, [liveScenarios, initial, monthly, totalMonths, granularity]);

  // Merge chart rows by shortLabel
  const chartData = useMemo(() => {
    if (scenarioResults.length === 0) return [];
    const base = scenarioResults[0].chart;
    return base.map((pt, i) => {
      const row: Record<string, number | string> = { label: pt.shortLabel };
      for (const sr of scenarioResults) {
        const p = sr.chart[i];
        if (p) row[sr.scenario.label] = showAfterTax ? p.netValue : p.grossValue;
      }
      return row;
    });
  }, [scenarioResults, showAfterTax]);

  const addScenario = () => {
    if (scenarios.length >= 4) return;
    setScenarios((prev) => [
      ...prev,
      {
        id:            uid(),
        label:         `Cenário ${prev.length + 1}`,
        annualRate:    8,
        assetCategory: "renda_fixa_bancaria",
        color:         SCENARIO_COLORS[prev.length] ?? SCENARIO_COLORS[0],
      },
    ]);
  };

  const removeScenario  = (id: string) => setScenarios((prev) => prev.filter((s) => s.id !== id));
  const updateScenario  = (id: string, patch: Partial<SimulationScenario>) =>
    setScenarios((prev) => prev.map((s) => (s.id === id ? { ...s, ...patch } : s)));

  const handlePickerSelect = (asset: PresetAsset) => {
    if (!pickerFor) return;
    updateScenario(pickerFor, {
      label:         asset.label,
      annualRate:    asset.annualRate,
      assetCategory: asset.assetCategory,
      presetId:      asset.id,
      ticker:        asset.ticker,
      isStub:        asset.isStub,
      rateSource:    asset.rateSource,
    });
    setPickerFor(null);
  };

  return (
    <>
      {pickerFor && (
        <AssetPicker
          rates={rates ? { cdiAnnual: rates.cdiAnnual, selicAnnual: rates.selicAnnual } : undefined}
          onSelect={handlePickerSelect}
          onClose={() => setPickerFor(null)}
        />
      )}

      <div className="border-border bg-surface rounded-xl border p-5">
        <SectionHeader title="Comparador de Cenários" subtitle="Compare até 4 estratégias de investimento lado a lado" />

        {/* Global params */}
        <div className="grid grid-cols-2 gap-3 mb-4 sm:grid-cols-3">
          <div>
            <label className="text-text-muted mb-1.5 block text-[12px]">Valor inicial (R$)</label>
            <input className={inputCls} value={initialAmount} onChange={(e) => setInitialAmount(e.target.value)} placeholder="10000" />
          </div>
          <div>
            <label className="text-text-muted mb-1.5 block text-[12px]">Aporte mensal (R$)</label>
            <input className={inputCls} value={monthlyContrib} onChange={(e) => setMonthlyContrib(e.target.value)} placeholder="500" />
          </div>
          <div>
            <label className="text-text-muted mb-1.5 block text-[12px]">Meses (personalizado)</label>
            <input className={inputCls} value={customMonths} onChange={(e) => setCustomMonths(e.target.value)} placeholder="ex: 84" />
          </div>
        </div>

        {/* Period presets */}
        <div className="mb-5 flex flex-wrap gap-1.5">
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

        {/* Live rates hint */}
        {rates && (
          <div className="mb-4 flex flex-wrap gap-2">
            {[
              { label: "CDI",  value: rates.cdiAnnual.toFixed(2)        },
              { label: "SELIC",value: rates.selicAnnual.toFixed(2)       },
              { label: "IPCA 12m", value: rates.ipcaTrailing12m.toFixed(2) },
            ].map((r) => (
              <div key={r.label} className="border-border rounded-lg border px-2.5 py-1.5 flex items-center gap-1.5">
                <span className="text-text-muted text-[11px]">{r.label}:</span>
                <span className="text-green font-medium text-[12px]">{r.value}% a.a.</span>
              </div>
            ))}
            <div className="border-border rounded-lg border px-2.5 py-1.5 flex items-center gap-1">
              <Info size={11} className="text-blue/60" />
              <span className="text-text-muted text-[11px]">Banco Central (tempo real)</span>
            </div>
          </div>
        )}

        {/* Scenario cards */}
        <div className="mb-5 grid grid-cols-1 gap-3 sm:grid-cols-2">
          {liveScenarios.map((s, idx) => (
            <div key={s.id} className="border-border bg-surface2 rounded-xl border p-3">
              {/* Header row */}
              <div className="mb-2.5 flex items-center justify-between gap-2">
                <div className="flex items-center gap-2 min-w-0">
                  <div className="h-3 w-3 shrink-0 rounded-full" style={{ backgroundColor: s.color }} />
                  <input
                    className="bg-transparent text-[13px] font-medium text-text outline-none border-b border-transparent focus:border-border min-w-0 w-full"
                    value={s.label}
                    onChange={(e) => updateScenario(s.id, { label: e.target.value })}
                  />
                </div>
                <div className="flex items-center gap-1.5 shrink-0">
                  <button
                    onClick={() => setPickerFor(s.id)}
                    className="rounded-md border border-border px-2 py-1 text-[11px] text-text-muted hover:text-green hover:border-green/30 transition-colors"
                  >
                    Trocar ativo
                  </button>
                  {scenarios.length > 1 && (
                    <button onClick={() => removeScenario(s.id)} className="text-text-muted hover:text-red transition-colors">
                      <Trash2 size={13} />
                    </button>
                  )}
                </div>
              </div>

              {/* Preset info */}
              {s.rateSource && (
                <p className="text-text-muted text-[10px] mb-2 flex items-center gap-1">
                  {s.isStub && <span className="bg-orange/10 text-orange rounded px-1">estimado</span>}
                  {s.ticker && <span className="bg-surface text-text-muted border border-border rounded px-1">{s.ticker}</span>}
                  {s.rateSource}
                </p>
              )}

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-text-muted mb-1 block text-[11px]">Taxa anual (%)</label>
                  <input
                    className={inputCls}
                    value={s.annualRate}
                    onChange={(e) => updateScenario(s.id, { annualRate: parseFloat(e.target.value) || 0, presetId: undefined })}
                    placeholder="10"
                  />
                </div>
                <div>
                  <label className="text-text-muted mb-1 block text-[11px]">Tipo de ativo (IR)</label>
                  <select
                    className={selectCls}
                    value={s.assetCategory}
                    onChange={(e) => updateScenario(s.id, { assetCategory: e.target.value as AssetCategory })}
                  >
                    {(Object.entries(ASSET_CATEGORY_LABELS) as [AssetCategory, string][]).map(([k, v]) => (
                      <option key={k} value={k}>{v}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
          ))}

          {scenarios.length < 4 && (
            <button
              onClick={addScenario}
              className="border-border flex items-center justify-center gap-2 rounded-xl border border-dashed py-8 text-[13px] text-text-muted transition-colors hover:border-green/40 hover:text-green"
            >
              <Plus size={16} />
              Adicionar cenário
            </button>
          )}
        </div>

        {/* Chart controls */}
        <div className="mb-3 flex items-center justify-between flex-wrap gap-2">
          <p className="text-text-muted text-[12px]">Evolução patrimonial — {totalMonths} meses</p>
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
            {(["gross", "net"] as const).map((mode) => (
              <button
                key={mode}
                onClick={() => setShowAfterTax(mode === "net")}
                className={cn(
                  "rounded-md px-2.5 py-1 text-[11px] font-medium transition-colors border-l border-border ml-1 pl-2.5",
                  (showAfterTax ? mode === "net" : mode === "gross")
                    ? "text-green"
                    : "text-text-muted hover:text-text"
                )}
              >
                {mode === "gross" ? "Bruto" : "Líquido"}
              </button>
            ))}
          </div>
        </div>

        <div style={{ minHeight: 260 }}>
          <ResponsiveContainer width="100%" height={260}>
            <LineChart data={chartData} margin={{ top: 4, right: 4, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
              <XAxis dataKey="label" tick={{ fill: "var(--text-muted)", fontSize: 11, fontFamily: "DM Sans" }} axisLine={false} tickLine={false} interval="preserveStartEnd" />
              <YAxis tick={{ fill: "var(--text-muted)", fontSize: 11, fontFamily: "JetBrains Mono" }} axisLine={false} tickLine={false} tickFormatter={(v) => formatCurrencyCompact(v / 100)} width={72} />
              <Tooltip content={<CustomTooltip />} />
              {liveScenarios.map((s) => (
                <Line key={s.id} type="monotone" dataKey={s.label} stroke={s.color} strokeWidth={2} dot={false} />
              ))}
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Comparison table */}
        <div className="mt-5 overflow-hidden rounded-xl border border-border">
          <div className="border-b border-border bg-surface2/30 px-4 py-2.5 flex items-center justify-between">
            <p className="text-text text-[13px] font-medium">
              Resultado após {Math.floor(totalMonths / 12)} anos e {totalMonths % 12} meses
            </p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-[12px] min-w-[700px]">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-text-muted px-4 py-2.5 text-left font-medium">Cenário</th>
                  <th className="text-text-muted px-4 py-2.5 text-right font-medium">Taxa</th>
                  <th className="text-text-muted px-4 py-2.5 text-right font-medium">Patrimônio {showAfterTax ? "líquido" : "bruto"}</th>
                  <th className="text-text-muted px-4 py-2.5 text-right font-medium">Rendimento</th>
                  <th className="text-text-muted px-4 py-2.5 text-right font-medium">Imposto total</th>
                  <th className="text-text-muted px-4 py-2.5 text-right font-medium">Renda bruta/mês</th>
                  <th className="text-text-muted px-4 py-2.5 text-right font-medium">Renda líq./mês</th>
                  <th className="text-text-muted px-4 py-2.5 text-right font-medium">Retorno total</th>
                </tr>
              </thead>
              <tbody>
                {scenarioResults.map(({ scenario, last }) => {
                  if (!last) return null;
                  const finalVal  = showAfterTax ? last.netValue  : last.grossValue;
                  const gain      = showAfterTax ? last.netGain   : last.grossGain;
                  const retPct    = last.invested > 0
                    ? ((finalVal - last.invested) / last.invested * 100).toFixed(2)
                    : "—";

                  return (
                    <tr key={scenario.id} className="border-b border-border last:border-0 hover:bg-surface2/20 transition-colors">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <div className="h-2.5 w-2.5 rounded-full shrink-0" style={{ backgroundColor: scenario.color }} />
                          <div>
                            <span className="text-text font-medium">{scenario.label}</span>
                            {scenario.ticker && (
                              <span className="ml-1.5 text-[10px] text-text-muted bg-surface2 border border-border rounded px-1">{scenario.ticker}</span>
                            )}
                            {scenario.isStub && (
                              <span className="ml-1 text-[10px] bg-orange/10 text-orange rounded px-1">estimado</span>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-right font-mono text-text-muted">
                        {scenario.annualRate.toFixed(2)}% a.a.
                      </td>
                      <td className="px-4 py-3 text-right font-money text-text">
                        {formatCurrency(finalVal / 100)}
                      </td>
                      <td className="px-4 py-3 text-right font-money text-green">
                        +{formatCurrency(gain / 100)}
                      </td>
                      <td className="px-4 py-3 text-right font-money text-orange">
                        {formatCurrency(last.totalTax / 100)}
                        <p className="text-[10px] text-text-muted">{(last.irRate * 100).toFixed(1)}% IR</p>
                      </td>
                      <td className="px-4 py-3 text-right font-money text-text">
                        {formatCurrency(last.monthlyGrossIncome / 100)}
                      </td>
                      <td className="px-4 py-3 text-right font-money text-green">
                        {formatCurrency(last.monthlyNetIncome / 100)}
                      </td>
                      <td className="px-4 py-3 text-right font-money text-blue">
                        {retPct}%
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {scenarioResults[0]?.last && (
            <div className="border-t border-border bg-surface2/30 px-4 py-2 flex flex-wrap items-center gap-4 text-[11px]">
              <span className="text-text-muted">Total aportado (igual para todos):</span>
              <span className="font-money text-text">{formatCurrency(scenarioResults[0].last.invested / 100)}</span>
              <span className="text-text-muted">Aporte inicial: {formatCurrency(initial / 100)}</span>
              <span className="text-text-muted">Aporte mensal: {formatCurrency(monthly / 100)}</span>
            </div>
          )}
        </div>
      </div>
    </>
  );
};

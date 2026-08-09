"use client";

import { useState, useMemo, useRef, useEffect } from "react";
import {
  ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid,
} from "recharts";
import { Card, CardHead } from "@/components/shared/Card";
import { formatCurrency, formatCurrencyCompact } from "@/lib/utils/formatCurrency";
import { cn, matchesSearch } from "@/lib/utils";
import { Plus, Trash2, Info, Search, ChevronDown, Check, Trophy, BarChart2 } from "lucide-react";
import { useBenchmarkRates, useAssetRates } from "../hooks/useSimulation";
import type { AssetRate } from "@/lib/api/simulation";
import { simulateMonthly, aggregateAnnual } from "../utils/taxCalc";
import type {
  AssetCategory, SimulationScenario,
  PresetAsset, PresetAssetGroup,
} from "@/lib/types/simulation";
import {
  ASSET_CATEGORY_LABELS,
  PRESET_ASSETS, PRESET_ASSET_GROUPS,
} from "@/lib/types/simulation";
import { CHART_GRID, axisTick, SERIES, PresetPill, SegRow, SegOption } from "./simShared";
import { chartAnim } from "@/lib/config/chartAnimation";

/** Tokenised `.field` input — mono, bordered, cobalt focus halo. */
const inputCls =
  "h-9 w-full rounded-[13px] border border-[var(--border-color)] bg-[var(--surface)] px-3 font-mono text-[13px] tabular-nums text-[var(--text)] outline-none transition-[border-color,box-shadow] placeholder:text-[var(--text-sub)]/60 focus:border-[var(--brand-cobalt)] focus:shadow-[0_0_0_3px_color-mix(in_srgb,var(--brand-cobalt)_12%,transparent)]";

const SCENARIO_COLORS = [
  SERIES.moss, SERIES.cobalt, SERIES.violet, SERIES.gold,
];

const PERIOD_PRESETS = [
  { label: "1a",  months: 12  },
  { label: "2a",  months: 24  },
  { label: "5a",  months: 60  },
  { label: "10a", months: 120 },
  { label: "20a", months: 240 },
  { label: "30a", months: 360 },
];

function uid() {
  return `s${Date.now()}${Math.random().toString(36).slice(2, 6)}`;
}

// All Brapi-queryable tickers across preset assets (ticker or brapiTicker).
// Collected once so the hook query key is stable.
const ALL_PRESET_BRAPI_TICKERS = [
  ...new Set(
    PRESET_ASSETS
      .map((a) => a.brapiTicker ?? a.ticker)
      .filter((t): t is string => !!t)
  ),
];

// Resolves the effective annual rate for a preset given live Brapi data.
function resolveRate(
  asset: PresetAsset,
  assetRateMap: Map<string, AssetRate>,
  bacenRates?: { cdiAnnual: number; selicAnnual: number },
): { rate: number; isStub: boolean; rateSource: string } {
  // BACEN-driven presets always use live rates
  if (bacenRates) {
    if (asset.id === "cdi_100")       return { rate: bacenRates.cdiAnnual,                                    isStub: false, rateSource: "BACEN (dinâmico)" };
    if (asset.id === "cdi_110")       return { rate: Math.round(bacenRates.cdiAnnual * 1.1 * 100) / 100,      isStub: false, rateSource: "CDI × 1,1 (BACEN)" };
    if (asset.id === "lci_95")        return { rate: Math.round(bacenRates.cdiAnnual * 0.95 * 100) / 100,     isStub: false, rateSource: "CDI × 0,95 (BACEN)" };
    if (asset.id === "tesouro_selic") return { rate: bacenRates.selicAnnual,                                   isStub: false, rateSource: "BACEN (dinâmico)" };
    if (asset.id === "poupanca")      return { rate: Math.round(bacenRates.selicAnnual * 0.7 * 100) / 100,    isStub: false, rateSource: "Regra legal (SELIC atual)" };
  }

  // Brapi CAGR: try brapiTicker first, then ticker
  const brapiKey = asset.brapiTicker ?? asset.ticker;
  if (brapiKey) {
    const real = assetRateMap.get(brapiKey);
    if (real?.isReal) {
      return { rate: real.annualReturnPct, isStub: false, rateSource: real.rateSource };
    }
  }

  return { rate: asset.annualRate, isStub: asset.isStub, rateSource: asset.rateSource };
}

const DEFAULT_SCENARIOS: SimulationScenario[] = [
  { id: "s1", label: "CDB 100% CDI",   annualRate: 10.5, assetCategory: "renda_fixa_bancaria", color: SCENARIO_COLORS[0], presetId: "cdi_100",          isStub: false, rateSource: "BACEN (dinâmico)" },
  { id: "s2", label: "Tesouro IPCA+",  annualRate: 8.5,  assetCategory: "tesouro_direto",       color: SCENARIO_COLORS[1], presetId: "tesouro_ipca_2029", isStub: true  },
  { id: "s3", label: "Ibovespa (avg)", annualRate: 13.0, assetCategory: "acoes",                color: SCENARIO_COLORS[2], presetId: "ibovespa_avg",      isStub: true  },
];

// ── Asset Picker ─────────────────────────────────────────────────────────────
function AssetPicker({
  onSelect,
  onClose,
  rates,
  assetRateMap,
}: {
  onSelect: (asset: PresetAsset) => void;
  onClose: () => void;
  rates?: { cdiAnnual: number; selicAnnual: number };
  assetRateMap: Map<string, AssetRate>;
}) {
  const [search, setSearch]           = useState("");
  const [activeGroup, setActiveGroup] = useState<PresetAssetGroup | "all">("all");

  const filtered = useMemo(() => {
    return PRESET_ASSETS.filter((a) => {
      const matchGroup  = activeGroup === "all" || a.group === activeGroup;
      const matchSearch = matchesSearch(
        search,
        a.label,
        a.ticker,
        a.description,
        ASSET_CATEGORY_LABELS[a.assetCategory],
        PRESET_ASSET_GROUPS[a.group],
      );
      return matchGroup && matchSearch;
    });
  }, [search, activeGroup]);

  return (
    <div className="anim-fade fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4" onClick={onClose}>
      <div
        style={{ background: "var(--surface)", borderColor: "var(--border-color)" }}
        className="anim-pop flex max-h-[85vh] w-full max-w-2xl flex-col rounded-[20px] border shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-[var(--border-color)] px-5 py-4">
          <div>
            <p className="font-display text-[15px] font-bold tracking-[-0.01em] text-[var(--text)]">Escolher ativo</p>
            <p className="text-[12px] text-[var(--text-sub)]">Taxa baseada em médias históricas ou dados reais do BACEN</p>
          </div>
          <button onClick={onClose} className="text-[20px] leading-none text-[var(--text-sub)] hover:text-[var(--text)]">×</button>
        </div>

        <div className="border-b border-[var(--border-color)] px-5 py-3">
          <div className="relative">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-sub)]" />
            <input
              className={cn(inputCls, "pl-8")}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar ativo ou ticker..."
              autoFocus
            />
          </div>
        </div>

        <div className="flex gap-1.5 overflow-x-auto border-b border-[var(--border-color)] px-5 py-2.5">
          <button
            onClick={() => setActiveGroup("all")}
            className={cn("shrink-0 rounded-full px-2.5 py-1 text-[11px] font-medium transition-colors",
              activeGroup === "all" ? "bg-[color-mix(in_srgb,var(--brand-accent)_14%,transparent)] text-[var(--brand-accent)]" : "text-[var(--text-sub)] hover:text-[var(--text)]")}
          >
            Todos
          </button>
          {(Object.entries(PRESET_ASSET_GROUPS) as [PresetAssetGroup, string][]).map(([g, lbl]) => (
            <button
              key={g}
              onClick={() => setActiveGroup(g)}
              className={cn("shrink-0 rounded-full px-2.5 py-1 text-[11px] font-medium transition-colors",
                activeGroup === g ? "bg-[color-mix(in_srgb,var(--brand-accent)_14%,transparent)] text-[var(--brand-accent)]" : "text-[var(--text-sub)] hover:text-[var(--text)]")}
            >
              {lbl}
            </button>
          ))}
        </div>

        <div className="flex-1 overflow-y-auto px-3 py-2">
          {filtered.length === 0 ? (
            <p className="py-8 text-center text-[13px] text-[var(--text-sub)]">Nenhum ativo encontrado</p>
          ) : (
            <div className="grid grid-cols-1 gap-1 sm:grid-cols-2">
              {filtered.map((asset) => {
                const resolved = resolveRate(asset, assetRateMap, rates);
                return (
                  <button
                    key={asset.id}
                    onClick={() => { onSelect({ ...asset, annualRate: resolved.rate, isStub: resolved.isStub, rateSource: resolved.rateSource }); onClose(); }}
                    className="rounded-[13px] border border-[var(--border-color)] bg-[var(--surface2)] p-3 text-left transition-all hover:border-[var(--brand-accent)]/40"
                  >
                    <div className="mb-1 flex items-start justify-between gap-2">
                      <div>
                        <span className="text-[13px] font-medium text-[var(--text)]">{asset.label}</span>
                        {asset.ticker && (
                          <span className="ml-1.5 rounded border border-[var(--border-color)] bg-[var(--surface)] px-1 py-0.5 font-mono text-[10px] text-[var(--text-sub)]">{asset.ticker}</span>
                        )}
                      </div>
                      <div className="shrink-0 text-right">
                        <span className="font-mono text-[14px] font-semibold tabular-nums text-[var(--moss)]">{resolved.rate.toFixed(2)}%</span>
                        <span className="block text-[10px] text-[var(--text-sub)]">a.a.</span>
                      </div>
                    </div>
                    <p className="text-[11px] leading-snug text-[var(--text-sub)]">{asset.description}</p>
                    <div className="mt-1.5 flex items-center gap-1">
                      {resolved.isStub && <span className="rounded px-1.5 py-0.5 text-[10px] text-[var(--gold)]" style={{ background: "color-mix(in srgb, var(--gold) 12%, transparent)" }}>estimado</span>}
                      <span className="text-[10px] text-[var(--text-sub)]">{resolved.rateSource}</span>
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

// ── Asset category dropdown (styled, same pattern as other simulators) ────────
const AssetCategorySelect = ({
  value,
  onChange,
}: {
  value: AssetCategory;
  onChange: (v: AssetCategory) => void;
}) => {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex h-9 w-full items-center justify-between gap-2 rounded-[13px] border border-[var(--border-color)] bg-[var(--surface)] px-3 text-[13px] text-[var(--text)] transition-colors hover:border-[var(--brand-accent)]/50"
      >
        <span className="truncate text-left">{ASSET_CATEGORY_LABELS[value]}</span>
        <ChevronDown size={14} className={cn("text-[var(--text-sub)] transition-transform shrink-0", open && "rotate-180")} />
      </button>
      {open && (
        <div className="absolute left-0 top-10 z-50 flex w-full min-w-[220px] flex-col gap-px rounded-[13px] border border-[var(--border-color)] bg-[var(--surface)] p-1.5 shadow-lg">
          {(Object.entries(ASSET_CATEGORY_LABELS) as [AssetCategory, string][]).map(([k, v]) => (
            <button
              key={k}
              onClick={() => { onChange(k); setOpen(false); }}
              className="flex items-center justify-between gap-2 rounded-[9px] px-2.5 py-1.5 text-left text-[13px] transition-colors hover:bg-[var(--surface2)]"
            >
              <span className={cn("text-[var(--text-sub)]", value === k && "text-[var(--text)]")}>{v}</span>
              {value === k && <Check size={12} className="text-[var(--brand-accent)] shrink-0" />}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

// ── Tooltip ───────────────────────────────────────────────────────────────────
const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div
      className="min-w-[220px] rounded-[13px] border border-[var(--border-color)] bg-[var(--surface)] px-3 py-2.5"
      style={{ boxShadow: "var(--shadow-md)" }}
    >
      <p className="mb-2 font-mono text-[11px] uppercase tracking-[0.08em] text-[var(--text-sub)]">{label}</p>
      {payload.map((e: any) => (
        <div key={e.name} className="mb-0.5 flex items-center justify-between gap-4">
          <span className="text-[12px]" style={{ color: e.stroke }}>{e.name}</span>
          <span className="font-mono text-[12px] tabular-nums" style={{ color: e.stroke }}>
            {formatCurrency(e.value / 100)}
          </span>
        </div>
      ))}
    </div>
  );
};

// ── Main component ────────────────────────────────────────────────────────────
export const ScenarioComparator = () => {
  const [scenarios, setScenarios]           = useState<SimulationScenario[]>(DEFAULT_SCENARIOS);
  const [initialAmount, setInitialAmount]   = useState("10000");
  const [monthlyContrib, setMonthlyContrib] = useState("500");
  const [presetMonths, setPresetMonths]     = useState(120);
  const [customMonths, setCustomMonths]     = useState("");
  const [showAfterTax, setShowAfterTax]     = useState(false);
  const [pickerFor, setPickerFor]           = useState<string | null>(null);

  const { data: rates }      = useBenchmarkRates();
  const { data: assetRates } = useAssetRates(ALL_PRESET_BRAPI_TICKERS);

  // Map brapiTicker/ticker → AssetRate for O(1) lookup
  const assetRateMap = useMemo<Map<string, AssetRate>>(() => {
    const map = new Map<string, AssetRate>();
    for (const r of assetRates ?? []) map.set(r.ticker, r);
    return map;
  }, [assetRates]);

  const totalMonths = customMonths ? (parseInt(customMonths) || 0) : presetMonths;
  const initial     = parseFloat(initialAmount.replace(",", ".")) * 100 || 0;
  const monthly     = parseFloat(monthlyContrib.replace(",", ".")) * 100 || 0;

  const liveScenarios = useMemo(() => {
    return scenarios.map((s) => {
      if (!s.presetId) return s;
      const preset = PRESET_ASSETS.find((a) => a.id === s.presetId);
      if (!preset) return s;
      const resolved = resolveRate(preset, assetRateMap, rates ?? undefined);
      return { ...s, annualRate: resolved.rate, isStub: resolved.isStub, rateSource: resolved.rateSource };
    });
  }, [scenarios, rates, assetRateMap]);

  // Auto-aggregate: monthly for <36 months, annual otherwise
  const useAnnual = totalMonths >= 36;

  const scenarioResults = useMemo(() => {
    return liveScenarios.map((s) => {
      const all   = simulateMonthly(initial, monthly, s.annualRate, totalMonths, s.assetCategory);
      const last  = all[all.length - 1] ?? null;
      const chart = useAnnual ? aggregateAnnual(all) : all;
      return { scenario: s, all, chart, last };
    });
  }, [liveScenarios, initial, monthly, totalMonths, useAnnual]);

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

  // Find winner (highest final value)
  const winnerId = useMemo(() => {
    if (scenarioResults.length === 0) return null;
    let best = scenarioResults[0];
    for (const sr of scenarioResults) {
      const v = showAfterTax ? sr.last?.netValue ?? 0 : sr.last?.grossValue ?? 0;
      const bv = showAfterTax ? best.last?.netValue ?? 0 : best.last?.grossValue ?? 0;
      if (v > bv) best = sr;
    }
    return best.scenario.id;
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

  const removeScenario = (id: string) => setScenarios((prev) => prev.filter((s) => s.id !== id));
  const updateScenario = (id: string, patch: Partial<SimulationScenario>) =>
    setScenarios((prev) => prev.map((s) => (s.id === id ? { ...s, ...patch } : s)));

  const handlePickerSelect = (asset: PresetAsset) => {
    if (!pickerFor) return;
    // asset.annualRate/isStub/rateSource are already resolved by AssetPicker via resolveRate
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

  const yearsLabel = `${Math.floor(totalMonths / 12)} ano${Math.floor(totalMonths / 12) !== 1 ? "s" : ""}${totalMonths % 12 > 0 ? ` e ${totalMonths % 12} mes${totalMonths % 12 !== 1 ? "es" : ""}` : ""}`;

  return (
    <>
      {pickerFor && (
        <AssetPicker
          rates={rates ? { cdiAnnual: rates.cdiAnnual, selicAnnual: rates.selicAnnual } : undefined}
          assetRateMap={assetRateMap}
          onSelect={handlePickerSelect}
          onClose={() => setPickerFor(null)}
        />
      )}

      <div className="flex flex-col gap-4">
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-[320px_1fr]">

          {/* ── Left column: global params + live rates + scenario cards ── */}
          <div className="flex flex-col gap-4">

            {/* Global parameters */}
            <Card>
              <CardHead title="Parâmetros" />

              <div className="flex flex-col gap-3.5">
                <div>
                  <label className="mb-2 block font-mono text-[11px] uppercase tracking-[0.1em] text-[var(--text-sub)]">Valor inicial (R$)</label>
                  <input className={inputCls} value={initialAmount} onChange={(e) => setInitialAmount(e.target.value)} placeholder="10000" />
                </div>
                <div>
                  <label className="mb-2 block font-mono text-[11px] uppercase tracking-[0.1em] text-[var(--text-sub)]">Aporte mensal (R$)</label>
                  <input className={inputCls} value={monthlyContrib} onChange={(e) => setMonthlyContrib(e.target.value)} placeholder="500" />
                </div>
                <div>
                  <label className="mb-2 block font-mono text-[11px] uppercase tracking-[0.1em] text-[var(--text-sub)]">Período</label>
                  <div className="flex gap-1">
                    {PERIOD_PRESETS.map((p) => (
                      <PresetPill key={p.months} active={!customMonths && presetMonths === p.months} onClick={() => { setPresetMonths(p.months); setCustomMonths(""); }}>
                        {p.label}
                      </PresetPill>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="mb-2 block font-mono text-[11px] uppercase tracking-[0.1em] text-[var(--text-sub)]">Ou digite em meses</label>
                  <input
                    className={inputCls}
                    value={customMonths}
                    onChange={(e) => setCustomMonths(e.target.value)}
                    placeholder="ex: 84"
                  />
                </div>
              </div>
            </Card>

            {/* Live rates card */}
            {rates && (
              <Card>
                <div className="mb-3 flex items-center gap-2">
                  <Info size={14} className="shrink-0 text-[var(--brand-accent)]" />
                  <p className="font-display text-[15px] font-bold tracking-[-0.01em] text-[var(--text)]">Taxas de referência</p>
                  <span className="ml-auto rounded-full border border-[var(--border-color)] bg-[var(--surface2)] px-2 py-0.5 font-mono text-[10px] text-[var(--text-sub)]">Banco Central</span>
                </div>
                <div className="flex flex-col gap-2">
                  {[
                    { label: "CDI",       value: rates.cdiAnnual.toFixed(2)        },
                    { label: "SELIC",     value: rates.selicAnnual.toFixed(2)       },
                    { label: "IPCA 12m",  value: rates.ipcaTrailing12m.toFixed(2)   },
                  ].map((r) => (
                    <div key={r.label} className="flex items-center justify-between">
                      <span className="text-[12px] text-[var(--text-sub)]">{r.label}</span>
                      <span className="font-mono text-[13px] font-medium tabular-nums text-[var(--moss)]">{r.value}% a.a.</span>
                    </div>
                  ))}
                </div>
              </Card>
            )}

            {/* Scenario cards */}
            <div className="flex flex-col gap-3">
              <div className="flex items-center justify-between">
                <p className="font-display text-[15px] font-bold tracking-[-0.01em] text-[var(--text)]">Cenários</p>
                {scenarios.length < 4 && (
                  <button
                    onClick={addScenario}
                    className="flex items-center gap-1.5 rounded-[13px] border border-dashed border-[var(--border-color)] px-2.5 py-1 text-[12px] text-[var(--text-sub)] transition-colors hover:border-[var(--brand-accent)]/40 hover:text-[var(--brand-accent)]"
                  >
                    <Plus size={13} />
                    Adicionar
                  </button>
                )}
              </div>

              {liveScenarios.map((s) => {
                const sr     = scenarioResults.find((r) => r.scenario.id === s.id);
                const last   = sr?.last;
                const isWinner = s.id === winnerId;
                const finalVal = last ? (showAfterTax ? last.netValue : last.grossValue) : null;

                return (
                  <div
                    key={s.id}
                    className="rounded-[20px] border p-4 transition-colors"
                    style={{
                      borderColor: isWinner
                        ? `color-mix(in srgb, ${s.color} 40%, transparent)`
                        : "var(--border-color)",
                      backgroundColor: isWinner
                        ? `color-mix(in srgb, ${s.color} 5%, transparent)`
                        : "var(--surface)",
                    }}
                  >
                    {/* Card header */}
                    <div className="mb-3 flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2 min-w-0">
                        <div className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ backgroundColor: s.color }} />
                        <input
                          className="w-full min-w-0 border-b border-transparent bg-transparent text-[13px] font-medium text-[var(--text)] outline-none focus:border-[var(--border-color)]"
                          value={s.label}
                          onChange={(e) => updateScenario(s.id, { label: e.target.value })}
                        />
                        {isWinner && <Trophy size={12} className="shrink-0 text-[var(--moss)]" />}
                      </div>
                      <div className="flex items-center gap-1.5 shrink-0">
                        <button
                          onClick={() => setPickerFor(s.id)}
                          className="rounded-[9px] border border-[var(--border-color)] px-2 py-1 text-[11px] text-[var(--text-sub)] transition-colors hover:border-[var(--brand-accent)]/30 hover:text-[var(--brand-accent)]"
                        >
                          Trocar
                        </button>
                        {scenarios.length > 1 && (
                          <button onClick={() => removeScenario(s.id)} className="text-[var(--text-sub)] transition-colors hover:text-[var(--clay)]">
                            <Trash2 size={13} />
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Preset badges */}
                    {s.rateSource && (
                      <div className="mb-2.5 flex flex-wrap items-center gap-1">
                        {s.isStub && <span className="rounded px-1.5 py-0.5 text-[10px] text-[var(--gold)]" style={{ background: "color-mix(in srgb, var(--gold) 12%, transparent)" }}>estimado</span>}
                        {s.ticker && <span className="rounded border border-[var(--border-color)] bg-[var(--surface2)] px-1.5 py-0.5 font-mono text-[10px] text-[var(--text-sub)]">{s.ticker}</span>}
                        <span className="text-[10px] text-[var(--text-sub)]">{s.rateSource}</span>
                      </div>
                    )}

                    {/* Inputs */}
                    <div className="mb-3 grid grid-cols-2 gap-2">
                      <div>
                        <label className="mb-1 block font-mono text-[11px] uppercase tracking-[0.1em] text-[var(--text-sub)]">Taxa anual (%)</label>
                        <input
                          className={inputCls}
                          value={s.annualRate}
                          onChange={(e) => updateScenario(s.id, { annualRate: parseFloat(e.target.value) || 0, presetId: undefined })}
                          placeholder="10"
                        />
                      </div>
                      <div>
                        <label className="mb-1 block font-mono text-[11px] uppercase tracking-[0.1em] text-[var(--text-sub)]">Tipo (IR)</label>
                        <AssetCategorySelect
                          value={s.assetCategory}
                          onChange={(v) => updateScenario(s.id, { assetCategory: v })}
                        />
                      </div>
                    </div>

                    {/* Final value preview */}
                    {finalVal !== null && (
                      <div className="flex items-center justify-between border-t pt-2.5" style={{ borderColor: `color-mix(in srgb, ${s.color} 20%, var(--border-color))` }}>
                        <span className="text-[11px] text-[var(--text-sub)]">{showAfterTax ? "Patrimônio líquido" : "Patrimônio bruto"}</span>
                        <span className="font-mono text-[14px] font-semibold tabular-nums" style={{ color: s.color }}>
                          {formatCurrency(finalVal / 100)}
                        </span>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* ── Right column: chart + comparison table ── */}
          <div className="flex flex-col gap-4">

            {/* Chart card */}
            <Card className="flex flex-col">
              <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                <div>
                  <CardHead
                    className="mb-0"
                    title="Evolução Comparada"
                    subtitle={`Projeção de ${yearsLabel}`}
                  />
                  <div className="mt-1 flex items-center gap-1.5">
                    <BarChart2 size={11} className="text-[var(--text-sub)]" />
                    <span className="text-[11px] text-[var(--text-sub)]">
                      {useAnnual ? "Agrupado por ano" : "Mensal"}
                    </span>
                  </div>
                </div>
                <SegRow className="w-auto">
                  {(["gross", "net"] as const).map((m) => (
                    <SegOption key={m} active={showAfterTax ? m === "net" : m === "gross"} onClick={() => setShowAfterTax(m === "net")}>
                      {m === "gross" ? "Bruto" : "Líquido"}
                    </SegOption>
                  ))}
                </SegRow>
              </div>

              <div style={{ minHeight: 260 }}>
                <ResponsiveContainer width="100%" height={260}>
                  <LineChart data={chartData} margin={{ top: 4, right: 4, left: 0, bottom: 0 }}>
                    <CartesianGrid {...CHART_GRID} />
                    <XAxis dataKey="label" tick={axisTick} axisLine={false} tickLine={false} interval="preserveStartEnd" />
                    <YAxis tick={axisTick} axisLine={false} tickLine={false} tickFormatter={(v) => formatCurrencyCompact(v / 100)} width={72} />
                    <Tooltip content={<CustomTooltip />} />
                    {liveScenarios.map((s, i) => (
                      <Line
                        {...chartAnim(i)}
                        key={s.id}
                        type="monotone"
                        dataKey={s.label}
                        stroke={s.color}
                        strokeWidth={s.id === winnerId ? 2.5 : 1.5}
                        dot={{ r: 4, fill: s.color, stroke: "var(--surface)", strokeWidth: 2 }}
                        activeDot={{ r: 6, fill: s.color, stroke: "var(--surface)", strokeWidth: 2 }}
                      />
                    ))}
                  </LineChart>
                </ResponsiveContainer>
              </div>

              {/* Legend */}
              <div className="mt-3 flex flex-wrap gap-4">
                {liveScenarios.map((s) => (
                  <div key={s.id} className="flex items-center gap-1.5">
                    <div className="h-2.5 w-2.5 rounded-[3px]" style={{ backgroundColor: s.color }} />
                    <span className="text-[12px] text-[var(--text-sub)]">{s.label}</span>
                    {s.id === winnerId && <Trophy size={10} className="text-[var(--moss)]" />}
                  </div>
                ))}
              </div>
            </Card>

            {/* Comparison summary table */}
            <Card>
              <CardHead
                title="Resultado Final"
                subtitle={`Após ${yearsLabel} — ${showAfterTax ? "patrimônio líquido" : "patrimônio bruto"}`}
              />

              <div className="overflow-x-auto rounded-[13px] border border-[var(--border-color)]">
                <table className="w-full min-w-[560px] text-[12px]">
                  <thead>
                    <tr className="border-b border-[var(--border-color)] bg-[var(--surface2)]">
                      <th className="px-4 py-2.5 text-left font-mono text-[10.5px] uppercase tracking-[0.12em] text-[var(--text-sub)]">Cenário</th>
                      <th className="px-4 py-2.5 text-right font-mono text-[10.5px] uppercase tracking-[0.12em] text-[var(--text-sub)]">Taxa</th>
                      <th className="px-4 py-2.5 text-right font-mono text-[10.5px] uppercase tracking-[0.12em] text-[var(--text-sub)]">Patrimônio</th>
                      <th className="px-4 py-2.5 text-right font-mono text-[10.5px] uppercase tracking-[0.12em] text-[var(--text-sub)]">Rendimento</th>
                      <th className="px-4 py-2.5 text-right font-mono text-[10.5px] uppercase tracking-[0.12em] text-[var(--text-sub)]">Imposto</th>
                      <th className="px-4 py-2.5 text-right font-mono text-[10.5px] uppercase tracking-[0.12em] text-[var(--text-sub)]">Renda/mês</th>
                      <th className="px-4 py-2.5 text-right font-mono text-[10.5px] uppercase tracking-[0.12em] text-[var(--text-sub)]">Retorno %</th>
                    </tr>
                  </thead>
                  <tbody>
                    {scenarioResults.map(({ scenario, last }) => {
                      if (!last) return null;
                      const isWinner = scenario.id === winnerId;
                      const finalVal = showAfterTax ? last.netValue  : last.grossValue;
                      const gain     = showAfterTax ? last.netGain   : last.grossGain;
                      const retPct   = last.invested > 0
                        ? ((finalVal - last.invested) / last.invested * 100).toFixed(1)
                        : "—";
                      const monthlyIncome = showAfterTax ? last.monthlyNetIncome : last.monthlyGrossIncome;

                      return (
                        <tr
                          key={scenario.id}
                          className={cn(
                            "border-b border-[var(--border-color)] transition-colors last:border-0",
                            isWinner ? "bg-[var(--surface2)]" : "hover:bg-[var(--surface2)]",
                          )}
                        >
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-2">
                              <div className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ backgroundColor: scenario.color }} />
                              <div className="min-w-0">
                                <div className="flex items-center gap-1.5">
                                  <span className="truncate font-medium text-[var(--text)]">{scenario.label}</span>
                                  {isWinner && <Trophy size={11} className="shrink-0 text-[var(--moss)]" />}
                                </div>
                                <div className="mt-0.5 flex items-center gap-1">
                                  {scenario.ticker && (
                                    <span className="rounded border border-[var(--border-color)] bg-[var(--surface2)] px-1 font-mono text-[10px] text-[var(--text-sub)]">{scenario.ticker}</span>
                                  )}
                                  {scenario.isStub && (
                                    <span className="rounded px-1 text-[10px] text-[var(--gold)]" style={{ background: "color-mix(in srgb, var(--gold) 12%, transparent)" }}>estimado</span>
                                  )}
                                </div>
                              </div>
                            </div>
                          </td>
                          <td className="px-4 py-3 text-right font-mono tabular-nums text-[var(--text-sub)]">
                            {scenario.annualRate.toFixed(2)}% a.a.
                          </td>
                          <td className="px-4 py-3 text-right font-mono font-semibold tabular-nums" style={{ color: scenario.color }}>
                            {formatCurrency(finalVal / 100)}
                          </td>
                          <td className="px-4 py-3 text-right font-mono tabular-nums text-[var(--moss)]">
                            +{formatCurrency(gain / 100)}
                          </td>
                          <td className="px-4 py-3 text-right font-mono tabular-nums text-[var(--gold)]">
                            {formatCurrency(last.totalTax / 100)}
                            <p className="text-[10px] text-[var(--text-sub)]">{(last.irRate * 100).toFixed(1)}% IR</p>
                          </td>
                          <td className="px-4 py-3 text-right font-mono tabular-nums text-[var(--text)]">
                            {formatCurrency(monthlyIncome / 100)}
                          </td>
                          <td className="px-4 py-3 text-right font-mono tabular-nums text-[var(--brand-accent)]">
                            {retPct}%
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* Footer info */}
              {scenarioResults[0]?.last && (
                <div className="mt-3 flex flex-wrap items-center gap-x-5 gap-y-1.5 text-[11px]">
                  <div className="flex items-center gap-1.5">
                    <span className="text-[var(--text-sub)]">Total aportado (igual a todos):</span>
                    <span className="font-mono tabular-nums text-[var(--text)]">{formatCurrency(scenarioResults[0].last.invested / 100)}</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="text-[var(--text-sub)]">Inicial:</span>
                    <span className="font-mono tabular-nums text-[var(--text)]">{formatCurrency(initial / 100)}</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="text-[var(--text-sub)]">Mensal:</span>
                    <span className="font-mono tabular-nums text-[var(--text)]">{formatCurrency(monthly / 100)}</span>
                  </div>
                </div>
              )}
            </Card>
          </div>
        </div>
      </div>
    </>
  );
};

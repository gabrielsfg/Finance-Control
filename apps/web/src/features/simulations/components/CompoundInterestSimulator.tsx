"use client";

import { useState, useMemo, useRef, useEffect } from "react";
import {
  ResponsiveContainer, AreaChart, Area, Line, XAxis, YAxis, Tooltip, CartesianGrid,
} from "recharts";
import { Card, CardHead } from "@/components/shared/Card";
import { HeroPanel } from "@/components/shared/HeroPanel";
import { BigMoney, Money } from "@/components/shared/Money";
import { formatCurrency, formatCurrencyCompact } from "@/lib/utils/formatCurrency";
import { cn, matchesSearch, assetTypeKeywords } from "@/lib/utils";
import { Info, ChevronDown, ChevronUp, Check, Search, TrendingUp, ArrowUpRight } from "lucide-react";
import { simulateMonthly, aggregateAnnual } from "../utils/taxCalc";
import type { AssetCategory } from "@/lib/types/simulation";
import { ASSET_CATEGORY_LABELS } from "@/lib/types/simulation";
import { useAvailableBenchmarks, useAssetRateForPeriod } from "../hooks/useSimulation";
import type { AvailableBenchmark } from "@/lib/api/simulation";
import {
  CHART_GRID, axisTick, SERIES, FieldLabel, FieldShell, MoneyPrefix, UnitSuffix, fieldMono,
  SegRow, SegOption, PresetPill, ChartTooltip, LegendItem,
} from "./simShared";
import { chartAnim } from "@/lib/config/chartAnimation";

type ViewMode = "gross" | "net";
type BenchmarkId = "cdi" | "ipca5" | "ibov";

const BENCHMARK_RATES: Record<BenchmarkId, { label: string; rate: number; color: string; note: string }> = {
  cdi:   { label: "CDI",       rate: 10.65, color: SERIES.cobalt, note: "~10,65% a.a. — CDI médio recente" },
  ipca5: { label: "IPCA+5%",   rate: 10.2,  color: SERIES.gold,   note: "~10,2% a.a. — IPCA(~5,2%) + 5%" },
  ibov:  { label: "IBOV",      rate: 13.0,  color: SERIES.violet, note: "~13% a.a. — média histórica longo prazo" },
};

/** Tokenised `.field` input — mono, bordered, cobalt focus halo. */
const inputCls =
  "h-11 w-full rounded-[13px] border border-[var(--border-color)] bg-[var(--surface)] px-3.5 font-mono text-[14px] tabular-nums text-[var(--text)] outline-none transition-[border-color,box-shadow] placeholder:text-[var(--text-sub)]/60 focus:border-[var(--brand-cobalt)] focus:shadow-[0_0_0_3px_color-mix(in_srgb,var(--brand-cobalt)_12%,transparent)]";

// Dropdown customizado para tipo de ativo
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
        className="flex h-[42px] w-full items-center justify-between gap-2 rounded-[13px] border border-[var(--border-color)] bg-[var(--surface)] px-3.5 text-[14px] text-[var(--text)] transition-colors hover:border-[var(--brand-accent)]/50"
      >
        <span>{ASSET_CATEGORY_LABELS[value]}</span>
        <ChevronDown size={14} className={cn("text-[var(--text-sub)] transition-transform", open && "rotate-180")} />
      </button>
      {open && (
        <div className="absolute left-0 top-[46px] z-50 flex w-full min-w-[220px] flex-col gap-px rounded-[13px] border border-[var(--border-color)] bg-[var(--surface)] p-1.5 shadow-lg">
          {(Object.entries(ASSET_CATEGORY_LABELS) as [AssetCategory, string][]).map(([k, v]) => (
            <button
              key={k}
              onClick={() => { onChange(k); setOpen(false); }}
              className="flex items-center justify-between gap-2 rounded-[9px] px-2.5 py-1.5 text-left text-[13px] transition-colors hover:bg-[var(--surface2)]"
            >
              <span className={cn("text-[var(--text-sub)]", value === k && "text-[var(--text)]")}>{v}</span>
              {value === k && <Check size={12} className="shrink-0 text-[var(--brand-accent)]" />}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

const RATE_PERIODS = ["7D", "30D", "1A", "2A", "5A", "10A", "15A"] as const;
type RatePeriod = typeof RATE_PERIODS[number];

const TickerReferenceSelect = ({
  selected,
  onSelect,
  options,
  loading,
}: {
  selected: string | null;
  onSelect: (ticker: string | null) => void;
  options: AvailableBenchmark[];
  loading: boolean;
}) => {
  const [open, setOpen]   = useState(false);
  const [query, setQuery] = useState('');
  const ref               = useRef<HTMLDivElement>(null);
  const inputRef          = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
        setQuery('');
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  useEffect(() => {
    if (open) setTimeout(() => inputRef.current?.focus(), 50);
  }, [open]);

  const filtered = query.trim()
    ? options.filter(o => matchesSearch(query, o.ticker, o.name, assetTypeKeywords(o.assetType)))
    : options;

  const selectedMeta = options.find(o => o.ticker === selected);
  const label = selectedMeta
    ? `${selectedMeta.ticker} — ${selectedMeta.name}`
    : 'Selecionar ativo (opcional)';

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        className="border-border bg-surface2 text-text flex h-9 w-full items-center justify-between gap-2 rounded-lg border px-3 text-[13px] transition-colors hover:border-green/40"
      >
        <span className={cn("truncate", !selected && "text-text-muted")}>{label}</span>
        <ChevronDown size={14} className={cn("text-text-muted transition-transform shrink-0", open && "rotate-180")} />
      </button>

      {open && (
        <div className="border-border bg-surface absolute left-0 top-10 z-50 rounded-xl border shadow-lg w-full" style={{ minWidth: 260 }}>
          <div className="border-b border-border px-2 py-2 flex items-center gap-2">
            <Search size={12} className="text-text-muted shrink-0" />
            <input
              ref={inputRef}
              value={query}
              onChange={e => setQuery(e.target.value)}
              placeholder="Buscar ticker ou nome..."
              className="bg-transparent text-[12px] text-text placeholder:text-text-muted outline-none flex-1 min-w-0"
            />
          </div>
          <div className="max-h-52 overflow-y-auto p-1.5 flex flex-col gap-px">
            {selected && (
              <button
                onClick={() => { onSelect(null); setOpen(false); setQuery(''); }}
                className="flex items-center gap-2 rounded-lg px-2.5 py-1.5 text-left text-[12px] text-text-muted hover:bg-surface2 transition-colors"
              >
                Limpar seleção
              </button>
            )}
            {loading && (
              <p className="px-2.5 py-2 text-[12px] text-text-muted text-center">Carregando...</p>
            )}
            {!loading && filtered.length === 0 && (
              <p className="px-2.5 py-3 text-[12px] text-text-muted text-center">Nenhum ativo com histórico</p>
            )}
            {filtered.map(opt => (
              <button
                key={opt.ticker}
                onClick={() => { onSelect(opt.ticker); setOpen(false); setQuery(''); }}
                className="flex items-center justify-between gap-2 rounded-lg px-2.5 py-1.5 text-left transition-colors hover:bg-surface2"
              >
                <div className="flex flex-col min-w-0">
                  <span className={cn("text-[13px] text-text-sub truncate", selected === opt.ticker && "text-text")}>
                    <span className="font-medium">{opt.ticker}</span>
                    {opt.name ? <span className="text-text-muted"> — {opt.name}</span> : null}
                  </span>
                  <span className="text-[10px] text-text-muted">{opt.monthsAvailable} meses de histórico</span>
                </div>
                {selected === opt.ticker && <Check size={12} className="text-green shrink-0" />}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

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
  { label: "1a",  months: 12  },
  { label: "2a",  months: 24  },
  { label: "5a",  months: 60  },
  { label: "10a", months: 120 },
  { label: "20a", months: 240 },
  { label: "30a", months: 360 },
];

const SERIES_COLORS = {
  gross:   "var(--green)",
  net:     "var(--purple)",
  invested:"var(--yellow)",
  cdi:     "var(--blue)",
  ipca5:   "var(--orange)",
  ibov:    "var(--cyan)",
} as const;

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
  const [showBreakdown, setShowBreakdown]   = useState(false);
  const [breakdownPage, setBreakdownPage]   = useState(0);
  const [activeBenchmarks, setActiveBenchmarks] = useState<Set<BenchmarkId>>(new Set(["cdi"]));
  const [refTicker, setRefTicker]           = useState<string | null>(null);
  const [refPeriod, setRefPeriod]           = useState<RatePeriod>("1A");

  const { data: availableBenchmarks = [], isLoading: loadingBenchmarks } = useAvailableBenchmarks();
  const { data: refRate, isFetching: loadingRefRate } = useAssetRateForPeriod(refTicker, refPeriod);

  const totalMonths = customMonths ? (parseInt(customMonths) || 0) : presetMonths;

  const useAnnual = totalMonths >= 36;

  const { allPoints, chartPoints, last } = useMemo(() => {
    const initial = parseFloat(initialAmount.replace(",", ".")) * 100 || 0;
    const monthly = parseFloat(monthlyContrib.replace(",", ".")) * 100 || 0;
    const rate    = parseFloat(annualRate.replace(",", ".")) || 0;
    if (!totalMonths || !rate) return { allPoints: [], chartPoints: [], last: null };

    const all   = simulateMonthly(initial, monthly, rate, totalMonths, assetCategory);
    const chart = useAnnual ? aggregateAnnual(all) : all;
    return { allPoints: all, chartPoints: chart, last: all[all.length - 1] ?? null };
  }, [initialAmount, monthlyContrib, annualRate, totalMonths, assetCategory, useAnnual]);

  const benchmarkPoints = useMemo(() => {
    if (!totalMonths || chartPoints.length === 0) return {} as Record<BenchmarkId, Map<string, number>>;
    const initial = parseFloat(initialAmount.replace(",", ".")) * 100 || 0;
    const monthly = parseFloat(monthlyContrib.replace(",", ".")) * 100 || 0;
    const result = {} as Record<BenchmarkId, Map<string, number>>;
    for (const [id, bm] of Object.entries(BENCHMARK_RATES) as [BenchmarkId, typeof BENCHMARK_RATES[BenchmarkId]][]) {
      const pts = simulateMonthly(initial, monthly, bm.rate, totalMonths, "renda_fixa_bancaria");
      const agg = useAnnual ? aggregateAnnual(pts) : pts;
      result[id] = new Map(agg.map((p) => [p.shortLabel ?? p.label, p.grossValue]));
    }
    return result;
  }, [initialAmount, monthlyContrib, totalMonths, useAnnual, chartPoints.length]);

  const mergedChartPoints = useMemo(() => {
    return chartPoints.map((p) => {
      const key = p.shortLabel ?? p.label;
      return {
        ...p,
        bm_cdi:   benchmarkPoints.cdi?.get(key)   ?? null,
        bm_ipca5: benchmarkPoints.ipca5?.get(key) ?? null,
        bm_ibov:  benchmarkPoints.ibov?.get(key)  ?? null,
      };
    });
  }, [chartPoints, benchmarkPoints]);

  const toggleBenchmark = (id: BenchmarkId) => {
    setActiveBenchmarks((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  const annualRows = useMemo(() => aggregateAnnual(allPoints), [allPoints]);
  const PAGE_SIZE  = 10;
  const totalPages = Math.ceil(annualRows.length / PAGE_SIZE);
  const visibleRows = annualRows.slice(breakdownPage * PAGE_SIZE, (breakdownPage + 1) * PAGE_SIZE);

  const displayValue  = last ? (viewMode === "net" ? last.netValue    : last.grossValue) : 0;
  const displayGain   = last ? (viewMode === "net" ? last.netGain     : last.grossGain)  : 0;
  const displayTax    = last ? last.totalTax   : 0;
  const investedTotal = last ? last.invested   : 0;
  const lastMonthGross = last?.monthlyGrossIncome ?? 0;
  const lastMonthNet   = last?.monthlyNetIncome   ?? 0;

  return (
    <div className="flex flex-col gap-4">
      {/* Top row: params card + chart card */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-[320px_1fr]">

        {/* Left: Parameters card */}
        <div className="border-border bg-surface rounded-[20px] border p-5 flex flex-col gap-4">
          <CardHead title="Parâmetros" />

          <div className="flex flex-col gap-3">
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

            {/* Ticker reference card */}
            <div className="border-border bg-surface2/50 rounded-xl border p-3 flex flex-col gap-2.5">
              <p className="text-text-muted flex items-center gap-1.5 text-[11px] font-medium">
                <TrendingUp size={11} className="text-green/70" />
                Referência histórica (opcional)
              </p>
              <TickerReferenceSelect
                selected={refTicker}
                onSelect={setRefTicker}
                options={availableBenchmarks}
                loading={loadingBenchmarks}
              />
              {refTicker && (
                <>
                  <div className="flex gap-1">
                    {RATE_PERIODS.map((p) => (
                      <button
                        key={p}
                        onClick={() => setRefPeriod(p)}
                        className={cn(
                          "flex-1 rounded-md border px-1 py-0.5 text-[10px] font-medium transition-colors",
                          refPeriod === p
                            ? "bg-green/15 text-green border-green/30"
                            : "text-text-muted border-border hover:text-text"
                        )}
                      >
                        {p}
                      </button>
                    ))}
                  </div>
                  <div className="border-border/60 rounded-lg border bg-surface px-3 py-2.5 min-h-[52px] flex items-center">
                    {loadingRefRate ? (
                      <p className="text-[12px] text-text-muted">Calculando...</p>
                    ) : refRate?.isReal ? (
                      <div className="flex flex-col gap-0.5 w-full">
                        <div className="flex items-baseline justify-between gap-2">
                          <span className="text-text-muted text-[11px]">{refRate.ticker} · {refPeriod}</span>
                          <span className={cn("font-money text-[15px] font-semibold", refRate.annualReturnPct >= 0 ? "text-green" : "text-red")}>
                            {refRate.annualReturnPct > 0 ? '+' : ''}{refRate.annualReturnPct.toFixed(2)}% a.a.
                          </span>
                        </div>
                        <p className="text-text-muted text-[10px]">somente variação de preço · sem dividendos</p>
                      </div>
                    ) : refRate ? (
                      <p className="text-[12px] text-text-muted">{refRate.rateSource}</p>
                    ) : null}
                  </div>
                </>
              )}
            </div>

            {/* Period presets */}
            <div>
              <label className="text-text-muted mb-1.5 block text-[12px]">Período</label>
              <div className="flex gap-1">
                {PERIOD_PRESETS.map((p) => (
                  <button
                    key={p.months}
                    onClick={() => { setPresetMonths(p.months); setCustomMonths(""); }}
                    className={cn(
                      "flex-1 rounded-lg border px-1.5 py-1 text-[11px] font-medium transition-colors whitespace-nowrap",
                      (!customMonths && presetMonths === p.months)
                        ? "bg-green/15 text-green border-green/30"
                        : "text-text-muted border-border hover:text-text"
                    )}
                  >
                    {p.label}
                  </button>
                ))}
              </div>
              <input
                className={cn(inputCls, "mt-2")}
                value={customMonths}
                onChange={(e) => setCustomMonths(e.target.value)}
                placeholder="Ou digite os meses (ex: 84)"
              />
            </div>

            {/* Asset type */}
            <div>
              <label className="text-text-muted mb-1.5 flex items-center gap-1 text-[12px]">
                Tipo de ativo
                <span
                  title="Define apenas as regras de tributação (IR, IOF, come-cotas). Não afeta o cálculo bruto."
                  className="text-text-muted cursor-default"
                >
                  <Info size={11} className="text-blue/60" />
                </span>
              </label>
              <AssetCategorySelect value={assetCategory} onChange={setAssetCategory} />
              <p className="text-text-muted mt-1.5 flex items-start gap-1 text-[11px] leading-relaxed">
                <Info size={11} className="mt-0.5 shrink-0 text-blue/70" />
                {TAX_NOTES[assetCategory]}
              </p>
            </div>
          </div>
        </div>

        {/* Right: Chart card */}
        <div className="border-border bg-surface rounded-[20px] border p-5 flex flex-col">
          <div className="mb-3 flex items-center justify-between gap-3 flex-wrap">
            <CardHead className="mb-0" title="Curva de Crescimento" subtitle={useAnnual ? "Agrupado por ano" : "Mensal"} />
          </div>

          {/* Benchmark selector */}
          <div className="mb-3 flex items-center gap-2 flex-wrap">
            <span className="text-text-muted text-[11px]">Comparar com:</span>
            {(Object.entries(BENCHMARK_RATES) as [BenchmarkId, typeof BENCHMARK_RATES[BenchmarkId]][]).map(([id, bm]) => (
              <button
                key={id}
                onClick={() => toggleBenchmark(id)}
                title={bm.note}
                className={cn(
                  "rounded-full border px-2.5 py-0.5 text-[11px] font-medium transition-colors",
                  activeBenchmarks.has(id)
                    ? "border-transparent text-white"
                    : "border-border text-text-muted hover:text-text",
                )}
                style={activeBenchmarks.has(id) ? { backgroundColor: bm.color } : {}}
              >
                {bm.label}
              </button>
            ))}
          </div>


          <div className="flex-1" style={{ minHeight: 260 }}>
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={mergedChartPoints} margin={{ top: 4, right: 4, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="cis_gradTotal" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={SERIES_COLORS.gross}    stopOpacity={0.2} />
                    <stop offset="95%" stopColor={SERIES_COLORS.gross}   stopOpacity={0}   />
                  </linearGradient>
                  <linearGradient id="cis_gradNet" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={SERIES_COLORS.net}      stopOpacity={0.15} />
                    <stop offset="95%" stopColor={SERIES_COLORS.net}     stopOpacity={0}    />
                  </linearGradient>
                  <linearGradient id="cis_gradInv" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={SERIES_COLORS.invested} stopOpacity={0.12} />
                    <stop offset="95%" stopColor={SERIES_COLORS.invested} stopOpacity={0}   />
                  </linearGradient>
                </defs>
                <CartesianGrid stroke="var(--border-chart)" />
                <XAxis dataKey="shortLabel" tick={{ fill: "var(--text-muted)", fontSize: 11, fontFamily: "DM Sans" }} axisLine={false} tickLine={false} interval="preserveStartEnd" />
                <YAxis tick={{ fill: "var(--text-muted)", fontSize: 11, fontFamily: "JetBrains Mono" }} axisLine={false} tickLine={false} tickFormatter={(v) => formatCurrencyCompact(v / 100)} width={72} />
                <Tooltip content={<CustomTooltip />} />
                <Area {...chartAnim(0)} type="monotone" dataKey="grossValue" name="Patrimônio bruto"   stroke={SERIES_COLORS.gross}    strokeWidth={2}   fill="url(#cis_gradTotal)" dot={{ r: 5, fill: SERIES_COLORS.gross,    stroke: "var(--surface)", strokeWidth: 2 }} activeDot={{ r: 7, fill: SERIES_COLORS.gross,    stroke: "var(--surface)", strokeWidth: 2 }} />
                <Area {...chartAnim(1)} type="monotone" dataKey="netValue"   name="Patrimônio líquido" stroke={SERIES_COLORS.net}      strokeWidth={1.5} fill="url(#cis_gradNet)"   strokeDasharray="4 2" dot={{ r: 5, fill: SERIES_COLORS.net,      stroke: "var(--surface)", strokeWidth: 2 }} activeDot={{ r: 7, fill: SERIES_COLORS.net,      stroke: "var(--surface)", strokeWidth: 2 }} />
                <Area {...chartAnim(2)} type="monotone" dataKey="invested"   name="Investido"           stroke={SERIES_COLORS.invested} strokeWidth={2}   fill="url(#cis_gradInv)"   dot={{ r: 5, fill: SERIES_COLORS.invested, stroke: "var(--surface)", strokeWidth: 2 }} activeDot={{ r: 7, fill: SERIES_COLORS.invested, stroke: "var(--surface)", strokeWidth: 2 }} />
                {activeBenchmarks.has("cdi")   && <Line {...chartAnim(3)} type="monotone" dataKey="bm_cdi"   name="CDI"     stroke={SERIES_COLORS.cdi}   strokeWidth={1.5} strokeDasharray="6 3" dot={{ r: 5, fill: SERIES_COLORS.cdi,   stroke: "var(--surface)", strokeWidth: 2 }} activeDot={{ r: 7, fill: SERIES_COLORS.cdi,   stroke: "var(--surface)", strokeWidth: 2 }} />}
                {activeBenchmarks.has("ipca5") && <Line {...chartAnim(4)} type="monotone" dataKey="bm_ipca5" name="IPCA+5%" stroke={SERIES_COLORS.ipca5} strokeWidth={1.5} strokeDasharray="6 3" dot={{ r: 5, fill: SERIES_COLORS.ipca5, stroke: "var(--surface)", strokeWidth: 2 }} activeDot={{ r: 7, fill: SERIES_COLORS.ipca5, stroke: "var(--surface)", strokeWidth: 2 }} />}
                {activeBenchmarks.has("ibov")  && <Line {...chartAnim(5)} type="monotone" dataKey="bm_ibov"  name="IBOV"    stroke={SERIES_COLORS.ibov}  strokeWidth={1.5} strokeDasharray="6 3" dot={{ r: 5, fill: SERIES_COLORS.ibov,  stroke: "var(--surface)", strokeWidth: 2 }} activeDot={{ r: 7, fill: SERIES_COLORS.ibov,  stroke: "var(--surface)", strokeWidth: 2 }} />}
              </AreaChart>
            </ResponsiveContainer>
          </div>

          {/* Legend */}
          <div className="mt-2 flex flex-wrap gap-4">
            {[
              [SERIES_COLORS.gross,    "Patrimônio bruto"],
              [SERIES_COLORS.net,      "Patrimônio líquido"],
              [SERIES_COLORS.invested, "Investido"],
            ].map(([color, label]) => (
              <div key={label} className="flex items-center gap-1.5">
                <div className="h-2.5 w-2.5 rounded-[2px]" style={{ backgroundColor: color }} />
                <span className="text-text-muted text-[13px]">{label}</span>
              </div>
            ))}
            {activeBenchmarks.has("cdi")   && <div className="flex items-center gap-1.5"><div className="h-2.5 w-2.5 rounded-[2px]" style={{ backgroundColor: SERIES_COLORS.cdi }}   /><span className="text-text-muted text-[13px]">CDI ({BENCHMARK_RATES.cdi.rate}% a.a.)</span></div>}
            {activeBenchmarks.has("ipca5") && <div className="flex items-center gap-1.5"><div className="h-2.5 w-2.5 rounded-[2px]" style={{ backgroundColor: SERIES_COLORS.ipca5 }} /><span className="text-text-muted text-[13px]">IPCA+5% ({BENCHMARK_RATES.ipca5.rate}% a.a.)</span></div>}
            {activeBenchmarks.has("ibov")  && <div className="flex items-center gap-1.5"><div className="h-2.5 w-2.5 rounded-[2px]" style={{ backgroundColor: SERIES_COLORS.ibov }}  /><span className="text-text-muted text-[13px]">IBOV* ({BENCHMARK_RATES.ibov.rate}% a.a.)</span></div>}
          </div>
          {activeBenchmarks.has("ibov") && (
            <p className="text-text-muted text-[11px] mt-1">* IBOV usa média histórica de longo prazo. Resultados passados não garantem retornos futuros.</p>
          )}
        </div>
      </div>

      {/* Bottom: Result card (full width, green gradient like the design) */}
      {last && (
        <div
          className="rounded-xl border p-5"
          style={{
            background: "linear-gradient(135deg, color-mix(in srgb, var(--green) 12%, transparent), color-mix(in srgb, var(--green) 5%, transparent))",
            borderColor: "color-mix(in srgb, var(--green) 30%, transparent)",
          }}
        >
          <div className="mb-4 flex items-center justify-between gap-4 flex-wrap">
            <div className="text-[11px] font-semibold tracking-widest" style={{ color: "var(--green)" }}>
              RESULTADO PROJETADO
            </div>
            {/* Segmented control bruto / líquido */}
            <div className="flex rounded-lg overflow-hidden border border-border bg-surface2 p-0.5 gap-0.5">
              {(["gross", "net"] as ViewMode[]).map((mode) => (
                <button
                  key={mode}
                  onClick={() => setViewMode(mode)}
                  className={cn(
                    "rounded-md px-3 py-1 text-[12px] font-medium transition-all",
                    viewMode === mode
                      ? "bg-green text-white shadow-sm"
                      : "text-text-muted hover:text-text"
                  )}
                >
                  {mode === "gross" ? "Bruto" : "Líquido (após IR/IOF)"}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 gap-6 sm:grid-cols-[auto_1fr]">
            {/* Main value */}
            <div>
              <p className="font-money text-[32px] font-bold text-text leading-none">
                {formatCurrency(displayValue / 100)}
              </p>
              <p className="text-text-muted text-[12px] mt-1.5">
                Patrimônio {viewMode === "net" ? "líquido" : "bruto"} final em{" "}
                {totalMonths >= 12 ? `${Math.round(totalMonths / 12)} anos` : `${totalMonths} meses`}
              </p>
            </div>

            {/* Stats grid */}
            <div className="grid grid-cols-2 gap-x-8 gap-y-3 sm:grid-cols-3">
              {[
                { label: "Total investido (aportes)", value: formatCurrency(investedTotal / 100), color: "var(--text-sub)" },
                { label: "Rendimento " + (viewMode === "net" ? "líquido" : "bruto"), value: formatCurrency(displayGain / 100), color: "var(--green)" },
                { label: "Multiplicador", value: `${(displayValue / Math.max(investedTotal, 1) * 100 / 100).toFixed(2)}×`, color: "var(--purple)" },
                { label: "Imposto total estimado", value: formatCurrency(displayTax / 100), color: "var(--orange)" },
                { label: `Renda bruta/mês (no ${totalMonths}º mês)`, value: formatCurrency(lastMonthGross / 100), color: "var(--cyan)" },
                { label: "Renda líquida/mês", value: formatCurrency(lastMonthNet / 100), color: "var(--text-sub)" },
              ].map(({ label, value, color }) => (
                <div key={label}>
                  <p className="text-text-muted text-[11px] leading-tight">{label}</p>
                  <p className="font-money text-[15px] font-semibold mt-0.5" style={{ color }}>{value}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Composition bar */}
          {last.grossGain > 0 && (
            <div className="mt-5">
              <p className="text-text-muted mb-2 text-[11px]">Composição do patrimônio bruto</p>
              <div className="flex h-4 overflow-hidden rounded-full">
                <div style={{ width: `${(last.invested / last.grossValue) * 100}%`, backgroundColor: "var(--blue)" }} title={`Aportes: ${formatCurrency(last.invested / 100)}`} />
                <div style={{ width: `${(last.irAmount / last.grossValue) * 100}%`, backgroundColor: "var(--orange)" }} title={`IR: ${formatCurrency(last.irAmount / 100)}`} />
                {last.iofAmount > 0 && (
                  <div style={{ width: `${(last.iofAmount / last.grossValue) * 100}%`, backgroundColor: "var(--red)" }} title={`IOF: ${formatCurrency(last.iofAmount / 100)}`} />
                )}
                <div style={{ width: `${(last.netGain / last.grossValue) * 100}%`, backgroundColor: "var(--green)" }} title={`Lucro líquido: ${formatCurrency(last.netGain / 100)}`} />
              </div>
              <div className="mt-2 flex flex-wrap gap-3">
                {[
                  { color: "var(--blue)",   label: "Aportes",       value: last.invested   },
                  { color: "var(--green)",  label: "Lucro líquido", value: last.netGain    },
                  { color: "var(--orange)", label: "IR",             value: last.irAmount   },
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
        </div>
      )}

      {/* Annual breakdown table */}
      {annualRows.length > 0 && (
        <div className="border-border bg-surface rounded-xl border p-5">
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

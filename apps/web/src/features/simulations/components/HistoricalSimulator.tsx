"use client";

import { useState, useCallback, useRef, useEffect, useMemo } from "react";
import {
  ResponsiveContainer, ComposedChart, Area, Line, XAxis, YAxis, Tooltip,
  CartesianGrid, ReferenceLine,
} from "recharts";
import { Card, CardHead } from "@/components/shared/Card";
import { formatCurrency, formatCurrencyCompact } from "@/lib/utils/formatCurrency";
import { cn, matchesSearch, assetTypeKeywords } from "@/lib/utils";
import { AlertCircle, Info, Check, ChevronDown, ChevronLeft, Play, ChevronRight, Search } from "lucide-react";
import { useHistoricalSimulation, useAvailableBenchmarks } from "../hooks/useSimulation";
import type { Benchmark, HistoricalSimulationPoint } from "@/lib/types/simulation";
import { BENCHMARK_LABELS, BENCHMARK_SEARCH_KEYWORDS } from "@/lib/types/simulation";
import type { AvailableBenchmark } from "@/lib/api/simulation";
import { MonthRangePicker } from "@/components/shared/MonthRangePicker";
import { CHART_GRID, axisTick, SERIES, PresetPill, PrimaryButton, ChartTooltip, LegendItem } from "./simShared";
import { chartAnim } from "@/lib/config/chartAnimation";

/** Tokenised `.field` input — mono, bordered, cobalt focus halo. */
const inputCls =
  "h-11 w-full rounded-[13px] border border-[var(--border-color)] bg-[var(--surface)] px-3.5 font-mono text-[14px] tabular-nums text-[var(--text)] outline-none transition-[border-color,box-shadow] placeholder:text-[var(--text-sub)]/60 focus:border-[var(--brand-cobalt)] focus:shadow-[0_0_0_3px_color-mix(in_srgb,var(--brand-cobalt)_12%,transparent)]";

const FIXED_BENCHMARKS: Benchmark[] = ["CDI", "SELIC", "IPCA+6", "IPCA+5", "IPCA+4", "IBOVESPA", "IFIX", "SP500_BRL"];
const STUB_BENCHMARKS = new Set<Benchmark>(["IBOVESPA", "IFIX", "SP500_BRL"]);

// A unified benchmark option — either a fixed string or a DB ticker
type BenchmarkOption =
  | { kind: 'fixed'; value: Benchmark }
  | { kind: 'ticker'; value: string; meta: AvailableBenchmark };

function benchmarkId(opt: BenchmarkOption): string {
  return opt.value;
}

function benchmarkLabel(opt: BenchmarkOption): string {
  if (opt.kind === 'fixed') return BENCHMARK_LABELS[opt.value as Benchmark];
  return `${opt.meta.ticker} — ${opt.meta.name}`;
}

// Parse "YYYY-MM-DD" to "YYYY-MM"
function dateOnlyToYearMonth(d: string): string {
  return d.slice(0, 7);
}

const PERIODS = [
  { label: "6m",   months: 6   },
  { label: "1a",   months: 12  },
  { label: "2a",   months: 24  },
  { label: "3a",   months: 36  },
  { label: "5a",   months: 60  },
  { label: "10a",  months: 120 },
];

function monthsAgo(n: number): string {
  const d = new Date();
  d.setMonth(d.getMonth() - n);
  return d.toISOString().slice(0, 7);
}

function toDateOnly(yearMonth: string): string {
  return `${yearMonth}-01`;
}

function todayDateOnly(): string {
  return new Date().toISOString().slice(0, 10);
}

// Dropdown customizado para benchmark — mostra fixos + tickers dinâmicos do banco
const BenchmarkSelect = ({
  selected,
  onSelect,
  options,
  loading,
}: {
  selected: BenchmarkOption;
  onSelect: (opt: BenchmarkOption) => void;
  options: BenchmarkOption[];
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

  const filtered = useMemo(() => {
    if (!query.trim()) return options;
    return options.filter(o => {
      if (o.kind === 'fixed') {
        return matchesSearch(query, o.value, BENCHMARK_LABELS[o.value as Benchmark], BENCHMARK_SEARCH_KEYWORDS[o.value as Benchmark]);
      }
      return matchesSearch(query, o.value, o.meta.name, assetTypeKeywords(o.meta.assetType));
    });
  }, [options, query]);

  const fixedOpts   = filtered.filter(o => o.kind === 'fixed');
  const tickerOpts  = filtered.filter(o => o.kind === 'ticker');

  const selectedLabel = benchmarkLabel(selected);
  const isStub = selected.kind === 'fixed' && STUB_BENCHMARKS.has(selected.value as Benchmark);

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex h-9 w-full items-center justify-between gap-2 rounded-[13px] border border-[var(--border-color)] bg-[var(--surface)] px-3 text-[13px] text-[var(--text)] transition-colors hover:border-[var(--brand-accent)]/50"
      >
        <span className="truncate">{selectedLabel}{isStub ? " *" : ""}</span>
        <ChevronDown size={14} className={cn("text-[var(--text-sub)] transition-transform shrink-0", open && "rotate-180")} />
      </button>

      {open && (
        <div className="absolute left-0 top-10 z-50 w-full rounded-[13px] border border-[var(--border-color)] bg-[var(--surface)] shadow-lg" style={{ minWidth: 280 }}>
          {/* Search input */}
          <div className="flex items-center gap-2 border-b border-[var(--border-color)] px-2 py-2">
            <Search size={12} className="text-[var(--text-sub)] shrink-0" />
            <input
              ref={inputRef}
              value={query}
              onChange={e => setQuery(e.target.value)}
              placeholder="Buscar benchmark ou ticker..."
              className="min-w-0 flex-1 bg-transparent text-[12px] text-[var(--text)] outline-none placeholder:text-[var(--text-sub)]"
            />
          </div>

          <div className="max-h-60 overflow-y-auto p-1.5 flex flex-col gap-px">
            {/* Fixed benchmarks section */}
            {fixedOpts.length > 0 && (
              <>
                <p className="px-2.5 py-1 font-mono text-[10px] font-semibold uppercase tracking-wider text-[var(--text-sub)]">Índices de referência</p>
                {fixedOpts.map(opt => (
                  <button
                    key={opt.value}
                    onClick={() => { onSelect(opt); setOpen(false); setQuery(''); }}
                    className="flex items-center justify-between gap-2 rounded-[9px] px-2.5 py-1.5 text-left text-[13px] transition-colors hover:bg-[var(--surface2)]"
                  >
                    <span className={cn("text-[var(--text-sub)]", benchmarkId(selected) === opt.value && "text-[var(--text)]")}>
                      {BENCHMARK_LABELS[opt.value as Benchmark]}
                      {STUB_BENCHMARKS.has(opt.value as Benchmark) ? " *" : ""}
                    </span>
                    {benchmarkId(selected) === opt.value && <Check size={12} className="text-[var(--brand-accent)] shrink-0" />}
                  </button>
                ))}
              </>
            )}

            {/* DB ticker section */}
            {tickerOpts.length > 0 && (
              <>
                <p className="px-2.5 py-1 mt-1 font-mono text-[10px] font-semibold uppercase tracking-wider text-[var(--text-sub)]">
                  Ativos com histórico na base
                  {loading && <span className="ml-1 normal-case font-normal">(carregando...)</span>}
                </p>
                {tickerOpts.map(opt => {
                  const m = (opt as Extract<BenchmarkOption, { kind: 'ticker' }>).meta;
                  return (
                    <button
                      key={opt.value}
                      onClick={() => { onSelect(opt); setOpen(false); setQuery(''); }}
                      className="flex items-center justify-between gap-2 rounded-[9px] px-2.5 py-1.5 text-left text-[13px] transition-colors hover:bg-[var(--surface2)]"
                    >
                      <div className="flex flex-col min-w-0">
                        <span className={cn("text-[var(--text-sub)] truncate", benchmarkId(selected) === opt.value && "text-[var(--text)]")}>
                          <span className="font-medium">{m.ticker}</span>
                          {m.name ? <span className="text-[var(--text-sub)]"> — {m.name}</span> : null}
                        </span>
                        <span className="text-[10px] text-[var(--text-sub)]">
                          {m.monthsAvailable} meses · desde {m.earliestDate.slice(0, 7)}
                        </span>
                      </div>
                      {benchmarkId(selected) === opt.value && <Check size={12} className="text-[var(--brand-accent)] shrink-0" />}
                    </button>
                  );
                })}
              </>
            )}

            {filtered.length === 0 && (
              <p className="px-2.5 py-3 text-[12px] text-[var(--text-sub)] text-center">Nenhum resultado</p>
            )}
          </div>

          {fixedOpts.some(o => STUB_BENCHMARKS.has(o.value as Benchmark)) && (
            <p className="border-t border-[var(--border-color)] px-2.5 py-1.5 text-[10px] text-[var(--text-sub)]">* dados estimados</p>
          )}
        </div>
      )}
    </div>
  );
};

export const HistoricalSimulator = () => {
  const defaultBenchmark: BenchmarkOption = { kind: 'fixed', value: 'CDI' };

  const [selectedBenchmark, setSelectedBenchmark] = useState<BenchmarkOption>(defaultBenchmark);
  const [initialAmount, setInitialAmount]         = useState("1000");
  const [monthlyContrib, setMonthlyContrib]        = useState("500");
  const [selectedPeriod, setSelectedPeriod]        = useState(12);
  const [useCustom, setUseCustom]                  = useState(false);
  const [customStart, setCustomStart]              = useState("");
  const [customEnd, setCustomEnd]                  = useState("");
  const [tablePage, setTablePage]                  = useState(1);
  const [tablePageSize, setTablePageSize]          = useState(20);
  const [pageSizeOpen, setPageSizeOpen]             = useState(false);
  const pageSizeRef                                = useRef<HTMLDivElement>(null);

  const { data: availableBenchmarks, isLoading: loadingBenchmarks } = useAvailableBenchmarks();

  // Build unified options list: fixed first, then DB tickers
  const benchmarkOptions = useMemo<BenchmarkOption[]>(() => {
    const fixed: BenchmarkOption[] = FIXED_BENCHMARKS.map(b => ({ kind: 'fixed', value: b }));
    const tickers: BenchmarkOption[] = (availableBenchmarks ?? []).map(m => ({
      kind: 'ticker',
      value: m.ticker,
      meta: m,
    }));
    return [...fixed, ...tickers];
  }, [availableBenchmarks]);

  // For DB ticker benchmarks, the allowed date range comes from what's in the DB
  const tickerMeta   = selectedBenchmark.kind === 'ticker' ? selectedBenchmark.meta : null;
  const minYearMonth = tickerMeta ? dateOnlyToYearMonth(tickerMeta.earliestDate) : undefined;
  const maxYearMonth = tickerMeta ? dateOnlyToYearMonth(tickerMeta.latestDate)   : undefined;

  // When switching to a ticker benchmark: force custom mode and seed dates from available range
  const handleSelectBenchmark = useCallback((opt: BenchmarkOption) => {
    setSelectedBenchmark(opt);
    if (opt.kind === 'ticker') {
      setUseCustom(true);
      setCustomStart(dateOnlyToYearMonth(opt.meta.earliestDate));
      setCustomEnd(dateOnlyToYearMonth(opt.meta.latestDate));
    }
  }, []);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (pageSizeRef.current && !pageSizeRef.current.contains(e.target as Node)) setPageSizeOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const { mutate, data, isPending, isError } = useHistoricalSimulation();

  // Compute effective start/end dates
  const today = new Date();
  const lastMonth = new Date(today.getFullYear(), today.getMonth() - 1, 1);
  const lastMonthStr = `${lastMonth.getFullYear()}-${String(lastMonth.getMonth() + 1).padStart(2, "0")}`;

  const startDate = useCustom && customStart
    ? toDateOnly(customStart)
    : toDateOnly(monthsAgo(selectedPeriod));

  const endDate = useCustom && customEnd
    ? toDateOnly(customEnd)
    : todayDateOnly();

  const handleSimulate = useCallback(() => {
    const initialCents = Math.round(parseFloat(initialAmount.replace(",", ".")) * 100) || 0;
    const monthlyCents = Math.round(parseFloat(monthlyContrib.replace(",", ".")) * 100) || 0;
    setTablePage(1);
    mutate({
      benchmark: selectedBenchmark.value,
      startDate,
      endDate,
      initialAmount: initialCents,
      monthlyContribution: monthlyCents,
    });
  }, [selectedBenchmark, startDate, endDate, initialAmount, monthlyContrib, mutate]);

  const isStub     = selectedBenchmark.kind === 'fixed' && STUB_BENCHMARKS.has(selectedBenchmark.value as Benchmark);
  const isDbTicker = selectedBenchmark.kind === 'ticker';
  const gain      = data ? data.finalValue - data.totalInvested : 0;
  const isPositive = gain >= 0;
  const rawPoints  = data?.points ?? [];

  // Agrega por ano quando período ≥ 3 anos (36+ pontos mensais)
  const chartData = rawPoints.length >= 36
    ? (() => {
        const byYear = new Map<number, HistoricalSimulationPoint[]>();
        for (const p of rawPoints) {
          const arr = byYear.get(p.year) ?? [];
          arr.push(p);
          byYear.set(p.year, arr);
        }
        return Array.from(byYear.entries()).map(([year, pts]) => {
          const last = pts[pts.length - 1];
          const totalInterest = pts.reduce((s, p) => s + p.interest, 0);
          const avgReturnPct  = pts.reduce((s, p) => s + p.monthlyReturnPct, 0) / pts.length;
          return {
            label: `${year}`,
            month: 12,
            year,
            invested: last.invested,
            value: last.value,
            interest: totalInterest,
            monthlyReturnPct: avgReturnPct,
          } satisfies HistoricalSimulationPoint;
        });
      })()
    : rawPoints;
  const labelInterval = rawPoints.length >= 36 ? 0 : rawPoints.length > 18 ? 2 : 0;

  // Paginação da tabela — aplicada sobre rawPoints invertidos (mais recente primeiro)
  const tableRows   = [...rawPoints].reverse();
  const totalItems  = tableRows.length;
  const totalPages  = Math.max(1, Math.ceil(totalItems / tablePageSize));
  const safePage    = Math.min(tablePage, totalPages);
  const tableFrom   = totalItems === 0 ? 0 : (safePage - 1) * tablePageSize + 1;
  const tableTo     = Math.min(safePage * tablePageSize, totalItems);
  const visibleRows = tableRows.slice(tableFrom - 1, tableTo);

  const pageNumbers = Array.from({ length: totalPages }, (_, i) => i + 1).reduce<(number | "...")[]>(
    (acc, p, i, arr) => {
      if (i > 0 && p - (arr[i - 1] as number) > 1) acc.push("...");
      if (p === 1 || p === totalPages || Math.abs(p - safePage) <= 1) acc.push(p);
      return acc;
    },
    [],
  );

  return (
    <div className="flex flex-col gap-4">
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-[300px_1fr]">

        {/* ── Left column: params + result ── */}
        <div className="flex flex-col gap-4">
          <Card>
            <CardHead title="Parâmetros" />
            <div className="flex flex-col gap-3.5">

              {/* Benchmark */}
              <div>
                <label className="mb-2 block font-mono text-[11px] uppercase tracking-[0.1em] text-[var(--text-sub)]">Benchmark</label>
                <BenchmarkSelect
                  selected={selectedBenchmark}
                  onSelect={handleSelectBenchmark}
                  options={benchmarkOptions}
                  loading={loadingBenchmarks}
                />
                {isStub && (
                  <p className="mt-1.5 flex items-center gap-1 text-[11px] text-[var(--text-sub)]">
                    <Info size={11} className="shrink-0 text-[var(--gold)]" />
                    Dados históricos reais em breve. Usando média estimada.
                  </p>
                )}
                {isDbTicker && tickerMeta && (
                  <p className="mt-1.5 flex items-center gap-1 text-[11px] text-[var(--text-sub)]">
                    <Info size={11} className="shrink-0 text-[var(--moss)]" />
                    {tickerMeta.monthsAvailable} meses disponíveis · {tickerMeta.earliestDate.slice(0, 7)} → {tickerMeta.latestDate.slice(0, 7)}
                  </p>
                )}
              </div>

              {/* Aportes */}
              <div>
                <label className="mb-2 block font-mono text-[11px] uppercase tracking-[0.1em] text-[var(--text-sub)]">Aporte inicial (R$)</label>
                <input className={inputCls} value={initialAmount} onChange={(e) => setInitialAmount(e.target.value)} placeholder="1000" />
              </div>
              <div>
                <label className="mb-2 block font-mono text-[11px] uppercase tracking-[0.1em] text-[var(--text-sub)]">Aporte mensal (R$)</label>
                <input className={inputCls} value={monthlyContrib} onChange={(e) => setMonthlyContrib(e.target.value)} placeholder="500" />
              </div>

              {/* Período */}
              <div>
                <div className="mb-2 flex items-center justify-between">
                  <label className="font-mono text-[11px] uppercase tracking-[0.1em] text-[var(--text-sub)]">Período</label>
                  <button
                    onClick={() => {
                      if (useCustom) {
                        setUseCustom(false);
                        setCustomStart("");
                        setCustomEnd("");
                      } else {
                        setUseCustom(true);
                        // seed com o período pré-definido atual
                        setCustomStart(monthsAgo(selectedPeriod));
                        setCustomEnd(lastMonthStr);
                      }
                    }}
                    className="font-mono text-[11px] uppercase tracking-[0.1em] text-[var(--brand-accent)] hover:underline"
                  >
                    {useCustom ? "Pré-definido" : "Personalizar"}
                  </button>
                </div>

                {useCustom ? (
                  <div className="rounded-[13px] border border-[var(--border-color)] bg-[var(--surface2)] p-3">
                    <MonthRangePicker
                      start={customStart}
                      end={customEnd}
                      onChangeStart={(v) => { setCustomStart(v); if (customEnd && v > customEnd) setCustomEnd(""); }}
                      onChangeEnd={setCustomEnd}
                      minYearMonth={minYearMonth}
                      maxYearMonth={maxYearMonth}
                    />
                  </div>
                ) : (
                  <div className="flex gap-1">
                    {PERIODS.map((p) => (
                      <PresetPill key={p.months} active={selectedPeriod === p.months} onClick={() => setSelectedPeriod(p.months)}>
                        {p.label}
                      </PresetPill>
                    ))}
                  </div>
                )}
              </div>

              {/* Simular button */}
              <PrimaryButton onClick={handleSimulate} disabled={isPending} className="mt-1">
                <Play size={13} className={isPending ? "animate-pulse" : ""} />
                {isPending ? "Calculando..." : "Simular"}
              </PrimaryButton>

              {isError && (
                <div className="flex items-center gap-2 rounded-[13px] px-3 py-2.5" style={{ background: "color-mix(in srgb, var(--clay) 10%, transparent)" }}>
                  <AlertCircle size={14} className="shrink-0 text-[var(--clay)]" />
                  <p className="text-[12px] text-[var(--clay)]">Não foi possível buscar os dados. Tente novamente.</p>
                </div>
              )}
            </div>
          </Card>

          {/* Result card — cobalt gradient */}
          {data && (
            <div
              className="rounded-[20px] border p-5"
              style={{
                background: "linear-gradient(135deg, color-mix(in srgb, var(--brand-cobalt) 12%, transparent), color-mix(in srgb, var(--brand-cobalt) 5%, transparent))",
                borderColor: "color-mix(in srgb, var(--brand-cobalt) 30%, transparent)",
              }}
            >
              <div className="mb-3 truncate font-mono text-[11px] uppercase tracking-[0.18em]" style={{ color: "var(--brand-cobalt)" }}>
                {benchmarkLabel(selectedBenchmark).toUpperCase()}
              </div>

              <p className="font-mono text-[32px] font-bold leading-none tabular-nums text-[var(--text)]">
                {formatCurrency(data.finalValue / 100)}
              </p>
              <p className="mt-1.5 text-[12px] text-[var(--text-sub)]">patrimônio final · {benchmarkLabel(selectedBenchmark)}</p>

              <div className="mt-4 flex flex-col gap-2.5">
                {[
                  { label: "Total investido",      value: formatCurrency(data.totalInvested / 100),                      color: "var(--text-sub)" },
                  { label: "Rendimento total",      value: `${isPositive ? "+" : ""}${formatCurrency(gain / 100)}`,       color: isPositive ? "var(--moss)" : "var(--clay)" },
                  { label: "Retorno anualizado",    value: `${data.annualizedReturnPct >= 0 ? "+" : ""}${data.annualizedReturnPct.toFixed(2)}% a.a.`, color: "var(--brand-accent)" },
                  { label: "Multiplicador",         value: `${(data.finalValue / Math.max(data.totalInvested, 1)).toFixed(2)}×`, color: "var(--gold)" },
                ].map(({ label, value, color }) => (
                  <div key={label} className="flex justify-between text-[12px]">
                    <span className="text-[var(--text-sub)]">{label}</span>
                    <span className="font-mono tabular-nums" style={{ color }}>{value}</span>
                  </div>
                ))}
              </div>

              {data.dataNote && (
                <div className="mt-3 flex items-start gap-1.5 rounded-[13px] px-2.5 py-2" style={{ background: "color-mix(in srgb, var(--gold) 12%, transparent)" }}>
                  <Info size={12} className="mt-0.5 shrink-0 text-[var(--gold)]" />
                  <p className="text-[11px] leading-relaxed text-[var(--gold)]">{data.dataNote}</p>
                </div>
              )}
            </div>
          )}

          {!data && !isPending && (
            <div className="flex h-28 items-center justify-center rounded-[20px] border border-dashed border-[var(--border-color)]">
              <p className="text-[12px] text-[var(--text-sub)]">Configure e clique em Simular</p>
            </div>
          )}
        </div>

        {/* ── Right column: chart + table ── */}
        <div className="flex flex-col gap-4">
          <Card className="flex flex-col">
            <CardHead
              title="Histórico de Patrimônio"
              subtitle={`E se eu tivesse investido em ${benchmarkLabel(selectedBenchmark)}?`}
            />

            {data && chartData.length > 0 ? (
              <>
                <div className="mt-4 flex-1" style={{ minHeight: 260 }}>
                  <ResponsiveContainer width="100%" height={260}>
                    <ComposedChart data={chartData} margin={{ top: 4, right: 4, left: 0, bottom: 0 }}>
                      <defs>
                        <linearGradient id="hist_gradV" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%"  stopColor={SERIES.moss} stopOpacity={0.2} />
                          <stop offset="95%" stopColor={SERIES.moss} stopOpacity={0}   />
                        </linearGradient>
                        <linearGradient id="hist_gradI" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%"  stopColor={SERIES.gold} stopOpacity={0.15} />
                          <stop offset="95%" stopColor={SERIES.gold} stopOpacity={0}    />
                        </linearGradient>
                      </defs>
                      <CartesianGrid {...CHART_GRID} />
                      <XAxis
                        dataKey="label"
                        tick={axisTick}
                        axisLine={false}
                        tickLine={false}
                        interval={labelInterval}
                      />
                      <YAxis
                        tick={axisTick}
                        axisLine={false}
                        tickLine={false}
                        tickFormatter={(v) => formatCurrencyCompact(v / 100)}
                        width={72}
                      />
                      <Tooltip content={<ChartTooltip />} />
                      {/* Linha de referência no aporte inicial */}
                      <ReferenceLine
                        y={chartData[0]?.invested ?? 0}
                        stroke="var(--border-color)"
                        strokeDasharray="4 4"
                      />
                      {/* Total aportado */}
                      <Area
                        {...chartAnim(0)}
                        type="monotone"
                        dataKey="invested"
                        name="Total aportado"
                        stroke={SERIES.gold}
                        strokeWidth={2}
                        fill="url(#hist_gradI)"
                        dot={{ r: 5, fill: SERIES.gold, stroke: "var(--surface)", strokeWidth: 2 }}
                        activeDot={{ r: 7, fill: SERIES.gold, stroke: "var(--surface)", strokeWidth: 2 }}
                      />
                      {/* Patrimônio real */}
                      <Area
                        {...chartAnim(1)}
                        type="monotone"
                        dataKey="value"
                        name="Patrimônio real"
                        stroke={SERIES.moss}
                        strokeWidth={2}
                        fill="url(#hist_gradV)"
                        dot={{ r: 5, fill: SERIES.moss, stroke: "var(--surface)", strokeWidth: 2 }}
                        activeDot={{ r: 7, fill: SERIES.moss, stroke: "var(--surface)", strokeWidth: 2 }}
                      />
                      {/* Rendimento mensal como linha */}
                      <Line
                        {...chartAnim(2)}
                        type="monotone"
                        dataKey="interest"
                        name="Rendimento/mês"
                        stroke={SERIES.cobalt}
                        strokeWidth={1.5}
                        strokeDasharray="5 3"
                        dot={{ r: 5, fill: SERIES.cobalt, stroke: "var(--surface)", strokeWidth: 2 }}
                        activeDot={{ r: 7, fill: SERIES.cobalt, stroke: "var(--surface)", strokeWidth: 2 }}
                      />
                    </ComposedChart>
                  </ResponsiveContainer>
                </div>

                {/* Legend */}
                <div className="mt-3 flex flex-wrap gap-4">
                  <LegendItem color={SERIES.moss}>Patrimônio real</LegendItem>
                  <LegendItem color={SERIES.gold}>Total aportado</LegendItem>
                  <LegendItem color={SERIES.cobalt}>Rendimento/mês</LegendItem>
                </div>
              </>
            ) : (
              <div className="flex flex-1 items-center justify-center py-20">
                <p className="text-[13px] text-[var(--text-sub)]">
                  {isPending ? "Calculando simulação..." : "Configure os parâmetros e clique em Simular"}
                </p>
              </div>
            )}
          </Card>

          {/* Month-by-month table */}
          {data && rawPoints.length > 0 && (
            <Card>
              <div className="mb-3 flex items-center justify-between">
                <CardHead className="mb-0" title="Todos os Meses" subtitle="Detalhe mês a mês" />
                <span className="font-mono text-[11px] tabular-nums text-[var(--text-sub)]">{rawPoints.length} meses simulados</span>
              </div>
              <div className="overflow-x-auto rounded-[13px] border border-[var(--border-color)]">
                <table className="w-full min-w-[440px] text-[12px]">
                  <thead>
                    <tr className="border-b border-[var(--border-color)] bg-[var(--surface2)]">
                      <th className="px-3 py-2.5 text-left font-mono text-[10.5px] uppercase tracking-[0.12em] text-[var(--text-sub)]">Mês</th>
                      <th className="px-3 py-2.5 text-right font-mono text-[10.5px] uppercase tracking-[0.12em] text-[var(--text-sub)]">Retorno %</th>
                      <th className="px-3 py-2.5 text-right font-mono text-[10.5px] uppercase tracking-[0.12em] text-[var(--text-sub)]">Rendimento</th>
                      <th className="px-3 py-2.5 text-right font-mono text-[10.5px] uppercase tracking-[0.12em] text-[var(--text-sub)]">Total aportado</th>
                      <th className="px-3 py-2.5 text-right font-mono text-[10.5px] uppercase tracking-[0.12em] text-[var(--text-sub)]">Patrimônio</th>
                    </tr>
                  </thead>
                  <tbody>
                    {visibleRows.map((p: HistoricalSimulationPoint) => (
                      <tr key={`${p.year}-${p.month}`} className="border-b border-[var(--border-color)] transition-colors last:border-0 hover:bg-[var(--surface2)]">
                        <td className="px-3 py-2.5 font-medium text-[var(--text)]">{p.label}</td>
                        <td className="px-3 py-2.5 text-right font-mono tabular-nums" style={{ color: p.monthlyReturnPct >= 0 ? "var(--moss)" : "var(--clay)" }}>
                          {p.monthlyReturnPct >= 0 ? "+" : ""}{p.monthlyReturnPct.toFixed(4)}%
                        </td>
                        <td className="px-3 py-2.5 text-right font-mono tabular-nums" style={{ color: p.interest >= 0 ? "var(--moss)" : "var(--clay)" }}>
                          {p.interest >= 0 ? "+" : ""}{formatCurrency(p.interest / 100)}
                        </td>
                        <td className="px-3 py-2.5 text-right font-mono tabular-nums text-[var(--text-sub)]">
                          {formatCurrency(p.invested / 100)}
                        </td>
                        <td className="px-3 py-2.5 text-right font-mono tabular-nums text-[var(--text)]">
                          {formatCurrency(p.value / 100)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Pagination — mesmo padrão de TransactionsPagination */}
              <div className="mt-3 flex items-center justify-end gap-3">
                <p className="shrink-0 text-[13px] text-[var(--text-sub)]">
                  {totalItems === 0
                    ? "Nenhum mês"
                    : `${tableFrom}–${tableTo} de ${totalItems} mes${totalItems !== 1 ? "es" : ""}` }
                </p>

                <button
                  onClick={() => setTablePage((p) => Math.max(1, p - 1))}
                  disabled={safePage === 1}
                  className="flex h-8 w-8 items-center justify-center rounded-[9px] text-[var(--text-sub)] transition-colors hover:bg-[var(--surface2)] hover:text-[var(--text)] disabled:opacity-40"
                >
                  <ChevronLeft size={15} />
                </button>

                <div className="flex items-center gap-1">
                  {pageNumbers.map((p, i) =>
                    p === "..." ? (
                      <span key={`dots-${i}`} className="px-1 text-[13px] text-[var(--text-sub)]">…</span>
                    ) : (
                      <button
                        key={p}
                        onClick={() => setTablePage(p as number)}
                        className={cn(
                          "flex h-8 w-8 items-center justify-center rounded-[9px] text-[13px] transition-colors",
                          safePage === p
                            ? "bg-[color-mix(in_srgb,var(--brand-accent)_14%,transparent)] font-medium text-[var(--brand-accent)]"
                            : "text-[var(--text-sub)] hover:bg-[var(--surface2)] hover:text-[var(--text)]",
                        )}
                      >
                        {p}
                      </button>
                    ),
                  )}
                </div>

                <button
                  onClick={() => setTablePage((p) => Math.min(totalPages, p + 1))}
                  disabled={safePage === totalPages}
                  className="flex h-8 w-8 items-center justify-center rounded-[9px] text-[var(--text-sub)] transition-colors hover:bg-[var(--surface2)] hover:text-[var(--text)] disabled:opacity-40"
                >
                  <ChevronRight size={15} />
                </button>

                <div ref={pageSizeRef} className="relative">
                  <button
                    onClick={() => setPageSizeOpen((o) => !o)}
                    className={cn(
                      "flex h-8 items-center gap-1.5 rounded-[9px] border border-[var(--border-color)] bg-[var(--surface)] px-3 text-[13px] transition-colors hover:bg-[var(--surface2)]",
                      pageSizeOpen ? "text-[var(--text)]" : "text-[var(--text-sub)]",
                    )}
                  >
                    {tablePageSize} / pág.
                    <ChevronDown size={13} className={cn("transition-transform", pageSizeOpen && "rotate-180")} />
                  </button>
                  {pageSizeOpen && (
                    <div className="absolute bottom-full right-0 mb-1.5 min-w-[110px] overflow-hidden rounded-[13px] border border-[var(--border-color)] bg-[var(--surface)] shadow-lg">
                      {[10, 20, 50, 100].map((size) => (
                        <button
                          key={size}
                          onClick={() => { setTablePageSize(size); setTablePage(1); setPageSizeOpen(false); }}
                          className={cn(
                            "flex w-full items-center px-3 py-2 text-left text-[13px] transition-colors",
                            tablePageSize === size
                              ? "bg-[color-mix(in_srgb,var(--brand-accent)_12%,transparent)] font-medium text-[var(--brand-accent)]"
                              : "text-[var(--text-sub)] hover:bg-[var(--surface2)] hover:text-[var(--text)]",
                          )}
                        >
                          {size} / pág.
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
};

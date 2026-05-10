"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import {
  ResponsiveContainer, ComposedChart, Area, Line, XAxis, YAxis, Tooltip,
  CartesianGrid, ReferenceLine,
} from "recharts";
import { SectionHeader } from "@/components/shared/SectionHeader";
import { formatCurrency, formatCurrencyCompact } from "@/lib/utils/formatCurrency";
import { cn } from "@/lib/utils";
import { AlertCircle, TrendingUp, TrendingDown, Info, Check, ChevronDown, ChevronLeft, Play, ChevronRight } from "lucide-react";
import { useHistoricalSimulation } from "../hooks/useSimulation";
import type { Benchmark, HistoricalSimulationPoint } from "@/lib/types/simulation";
import { BENCHMARK_LABELS } from "@/lib/types/simulation";

const inputCls = "border-border bg-surface2 text-text placeholder:text-text-muted w-full rounded-lg border h-9 px-3 text-[13px] outline-none focus:border-green/60 transition-colors";

const BENCHMARKS: Benchmark[] = ["CDI", "SELIC", "IPCA+6", "IPCA+5", "IPCA+4", "IBOVESPA", "IFIX", "SP500_BRL"];
const STUB_BENCHMARKS = new Set<Benchmark>(["IBOVESPA", "IFIX", "SP500_BRL"]);

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

const MONTH_NAMES_SHORT = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"];

// Picker de mês/ano no estilo do CalendarRangePicker de transações
function MonthRangePicker({
  value,
  onChange,
}: {
  value: string;         // YYYY-MM ou ""
  onChange: (v: string) => void;
}) {
  const today = new Date();
  const maxYear  = today.getFullYear();
  const maxMonth = today.getMonth(); // exclusive: último mês selecionável é maxMonth-1

  const [viewYear, setViewYear] = useState(() => {
    if (value) return parseInt(value.slice(0, 4));
    return maxYear;
  });

  const selYear  = value ? parseInt(value.slice(0, 4)) : null;
  const selMonth = value ? parseInt(value.slice(5, 7)) - 1 : null;

  function isFuture(yr: number, mo: number) {
    return yr > maxYear || (yr === maxYear && mo >= maxMonth);
  }

  function handleClick(yr: number, mo: number) {
    if (isFuture(yr, mo)) return;
    const mm = String(mo + 1).padStart(2, "0");
    onChange(`${yr}-${mm}`);
  }

  const label = value
    ? `${MONTH_NAMES_SHORT[parseInt(value.slice(5, 7)) - 1]} / ${value.slice(0, 4)}`
    : "Selecione o mês inicial";

  return (
    <div className="select-none">
      {/* Year nav */}
      <div className="mb-3 flex items-center justify-between">
        <button
          onClick={() => setViewYear((y) => y - 1)}
          className="text-text-muted hover:text-text flex h-7 w-7 items-center justify-center rounded-full transition-colors hover:bg-surface2"
        >
          <ChevronRight size={14} className="rotate-180" />
        </button>
        <span className="text-text text-[13px] font-semibold">{viewYear}</span>
        <button
          onClick={() => setViewYear((y) => Math.min(y + 1, maxYear))}
          disabled={viewYear >= maxYear}
          className="text-text-muted hover:text-text flex h-7 w-7 items-center justify-center rounded-full transition-colors hover:bg-surface2 disabled:opacity-30 disabled:cursor-not-allowed"
        >
          <ChevronRight size={14} />
        </button>
      </div>

      {/* Month grid 3×4 */}
      <div className="grid grid-cols-3 gap-1.5">
        {MONTH_NAMES_SHORT.map((name, mo) => {
          const isSelected = selYear === viewYear && selMonth === mo;
          const disabled   = isFuture(viewYear, mo);

          return (
            <button
              key={mo}
              onClick={() => handleClick(viewYear, mo)}
              disabled={disabled}
              className={cn(
                "rounded-lg py-2 text-[12px] font-medium transition-all",
                isSelected
                  ? "bg-green text-black font-bold shadow-sm"
                  : disabled
                  ? "text-text-muted opacity-30 cursor-not-allowed"
                  : "text-text-sub hover:bg-surface2 hover:text-text",
              )}
            >
              {name}
            </button>
          );
        })}
      </div>

      {/* Label de confirmação */}
      <div className={cn(
        "mt-3 rounded-lg px-3 py-2 text-center text-[12px] transition-all",
        value
          ? "bg-green/10 text-green font-medium"
          : "bg-surface2 text-text-muted",
      )}>
        {label}
        {value && <span className="text-text-muted font-normal"> → hoje</span>}
      </div>
    </div>
  );
}

// Dropdown customizado para benchmark
const BenchmarkSelect = ({
  value,
  onChange,
}: {
  value: Benchmark;
  onChange: (v: Benchmark) => void;
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
        className="border-border bg-surface2 text-text flex h-9 w-full items-center justify-between gap-2 rounded-lg border px-3 text-[13px] transition-colors hover:border-green/40"
      >
        <span>{BENCHMARK_LABELS[value]}{STUB_BENCHMARKS.has(value) ? " *" : ""}</span>
        <ChevronDown size={14} className={cn("text-text-muted transition-transform shrink-0", open && "rotate-180")} />
      </button>
      {open && (
        <div className="border-border bg-surface absolute left-0 top-10 z-50 flex flex-col gap-px rounded-xl border p-1.5 shadow-lg w-full">
          {BENCHMARKS.map((b) => (
            <button
              key={b}
              onClick={() => { onChange(b); setOpen(false); }}
              className="flex items-center justify-between gap-2 rounded-lg px-2.5 py-1.5 text-left text-[13px] transition-colors hover:bg-surface2"
            >
              <span className={cn("text-text-sub", value === b && "text-text")}>
                {BENCHMARK_LABELS[b]}{STUB_BENCHMARKS.has(b) ? " *" : ""}
              </span>
              {value === b && <Check size={12} className="text-green shrink-0" />}
            </button>
          ))}
          {[...STUB_BENCHMARKS].some((b) => BENCHMARKS.includes(b)) && (
            <p className="px-2.5 pt-1 pb-0.5 text-[10px] text-text-muted">* dados estimados, integração em breve</p>
          )}
        </div>
      )}
    </div>
  );
};

const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="border-border bg-surface rounded-lg border px-3 py-2.5 shadow-md min-w-[190px]">
      <p className="text-text-muted mb-2 text-[11px]">{label}</p>
      {payload.map((e: any) => (
        <div key={e.name} className="flex justify-between gap-4 mb-0.5">
          <span className="text-[12px]" style={{ color: e.stroke ?? e.color }}>{e.name}</span>
          <span className="font-money text-[12px]" style={{ color: e.stroke ?? e.color }}>
            {formatCurrency(e.value / 100)}
          </span>
        </div>
      ))}
    </div>
  );
};

export const HistoricalSimulator = () => {
  const [benchmark, setBenchmark]           = useState<Benchmark>("CDI");
  const [initialAmount, setInitialAmount]   = useState("1000");
  const [monthlyContrib, setMonthlyContrib] = useState("500");
  const [selectedPeriod, setSelectedPeriod] = useState(12);
  const [customStart, setCustomStart]       = useState("");
  const [useCustom, setUseCustom]           = useState(false);
  const [tablePage, setTablePage]           = useState(1);
  const [tablePageSize, setTablePageSize]   = useState(20);
  const [pageSizeOpen, setPageSizeOpen]     = useState(false);
  const pageSizeRef                         = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (pageSizeRef.current && !pageSizeRef.current.contains(e.target as Node)) setPageSizeOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const { mutate, data, isPending, isError } = useHistoricalSimulation();

  const startDate = useCustom && customStart
    ? toDateOnly(customStart)
    : toDateOnly(monthsAgo(selectedPeriod));

  const handleSimulate = useCallback(() => {
    const initialCents = Math.round(parseFloat(initialAmount.replace(",", ".")) * 100) || 0;
    const monthlyCents = Math.round(parseFloat(monthlyContrib.replace(",", ".")) * 100) || 0;
    setTablePage(1);
    mutate({
      benchmark,
      startDate,
      endDate: todayDateOnly(),
      initialAmount: initialCents,
      monthlyContribution: monthlyCents,
    });
  }, [benchmark, startDate, initialAmount, monthlyContrib, mutate]);

  const isStub    = STUB_BENCHMARKS.has(benchmark);
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
          <div className="border-border bg-surface rounded-xl border p-5">
            <SectionHeader title="Parâmetros" />
            <div className="flex flex-col gap-3 mt-4">

              {/* Benchmark */}
              <div>
                <label className="text-text-muted mb-1.5 block text-[12px]">Benchmark</label>
                <BenchmarkSelect value={benchmark} onChange={setBenchmark} />
                {isStub && (
                  <p className="text-text-muted mt-1.5 flex items-center gap-1 text-[11px]">
                    <Info size={11} className="text-orange/70 shrink-0" />
                    Dados históricos reais em breve. Usando média estimada.
                  </p>
                )}
              </div>

              {/* Aportes */}
              <div>
                <label className="text-text-muted mb-1.5 block text-[12px]">Aporte inicial (R$)</label>
                <input className={inputCls} value={initialAmount} onChange={(e) => setInitialAmount(e.target.value)} placeholder="1000" />
              </div>
              <div>
                <label className="text-text-muted mb-1.5 block text-[12px]">Aporte mensal (R$)</label>
                <input className={inputCls} value={monthlyContrib} onChange={(e) => setMonthlyContrib(e.target.value)} placeholder="500" />
              </div>

              {/* Período */}
              <div>
                <div className="mb-1.5 flex items-center justify-between">
                  <label className="text-text-muted text-[12px]">Período</label>
                  <button
                    onClick={() => setUseCustom((p) => !p)}
                    className="text-blue text-[11px] hover:underline"
                  >
                    {useCustom ? "Pré-definido" : "Personalizar"}
                  </button>
                </div>
                {useCustom ? (
                  <div className="rounded-xl border border-border bg-surface2/50 p-3">
                    <MonthRangePicker
                      value={customStart}
                      onChange={setCustomStart}
                    />
                  </div>
                ) : (
                  <div className="flex gap-1">
                    {PERIODS.map((p) => (
                      <button
                        key={p.months}
                        onClick={() => setSelectedPeriod(p.months)}
                        className={cn(
                          "flex-1 rounded-lg border py-1 text-[11px] font-medium transition-colors",
                          selectedPeriod === p.months
                            ? "bg-green/15 text-green border-green/30"
                            : "text-text-muted border-border hover:text-text"
                        )}
                      >
                        {p.label}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Simular button */}
              <button
                onClick={handleSimulate}
                disabled={isPending}
                className={cn(
                  "mt-1 flex w-full items-center justify-center gap-2 rounded-lg py-2.5 text-[13px] font-medium transition-colors",
                  isPending
                    ? "bg-green/20 text-green/50 cursor-not-allowed"
                    : "bg-green/15 text-green hover:bg-green/25"
                )}
              >
                <Play size={13} className={isPending ? "animate-pulse" : ""} />
                {isPending ? "Calculando..." : "Simular"}
              </button>

              {isError && (
                <div className="flex items-center gap-2 rounded-lg bg-red/10 px-3 py-2.5">
                  <AlertCircle size={14} className="text-red shrink-0" />
                  <p className="text-red text-[12px]">Não foi possível buscar os dados. Tente novamente.</p>
                </div>
              )}
            </div>
          </div>

          {/* Result card — blue gradient */}
          {data && (
            <div
              className="rounded-xl border p-5"
              style={{
                background: "linear-gradient(135deg, color-mix(in srgb, var(--blue) 12%, transparent), color-mix(in srgb, var(--blue) 5%, transparent))",
                borderColor: "color-mix(in srgb, var(--blue) 30%, transparent)",
              }}
            >
              <div className="text-[11px] font-semibold tracking-widest mb-3" style={{ color: "var(--blue)" }}>
                TAXA CDI ATUAL
              </div>

              <p className="font-money text-[32px] font-bold text-text leading-none">
                {formatCurrency(data.finalValue / 100)}
              </p>
              <p className="text-text-muted text-[12px] mt-1.5">patrimônio final · {BENCHMARK_LABELS[benchmark]}</p>

              <div className="mt-4 flex flex-col gap-2.5">
                {[
                  { label: "Total investido",      value: formatCurrency(data.totalInvested / 100),                      color: "var(--text-sub)" },
                  { label: "Rendimento total",      value: `${isPositive ? "+" : ""}${formatCurrency(gain / 100)}`,       color: isPositive ? "var(--green)" : "var(--red)" },
                  { label: "Retorno anualizado",    value: `${data.annualizedReturnPct >= 0 ? "+" : ""}${data.annualizedReturnPct.toFixed(2)}% a.a.`, color: "var(--blue)" },
                  { label: "Multiplicador",         value: `${(data.finalValue / Math.max(data.totalInvested, 1)).toFixed(2)}×`, color: "var(--purple)" },
                ].map(({ label, value, color }) => (
                  <div key={label} className="flex justify-between text-[12px]">
                    <span className="text-text-muted">{label}</span>
                    <span className="font-money" style={{ color }}>{value}</span>
                  </div>
                ))}
              </div>

              {data.dataNote && (
                <div className="mt-3 flex items-start gap-1.5 rounded-lg bg-orange/10 px-2.5 py-2">
                  <Info size={12} className="text-orange shrink-0 mt-0.5" />
                  <p className="text-orange text-[11px] leading-relaxed">{data.dataNote}</p>
                </div>
              )}
            </div>
          )}

          {!data && !isPending && (
            <div className="flex h-28 items-center justify-center rounded-xl border border-dashed border-border">
              <p className="text-text-muted text-[12px]">Configure e clique em Simular</p>
            </div>
          )}
        </div>

        {/* ── Right column: chart + table ── */}
        <div className="flex flex-col gap-4">
          <div className="border-border bg-surface rounded-xl border p-5 flex flex-col">
            <SectionHeader
              title="Histórico de Patrimônio"
              subtitle={`E se eu tivesse investido em ${BENCHMARK_LABELS[benchmark]}?`}
            />

            {data && chartData.length > 0 ? (
              <>
                <div className="mt-4 flex-1" style={{ minHeight: 260 }}>
                  <ResponsiveContainer width="100%" height={260}>
                    <ComposedChart data={chartData} margin={{ top: 4, right: 4, left: 0, bottom: 0 }}>
                      <defs>
                        <linearGradient id="hist_gradV" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%"  stopColor="var(--green)"  stopOpacity={0.2} />
                          <stop offset="95%" stopColor="var(--green)"  stopOpacity={0}   />
                        </linearGradient>
                        <linearGradient id="hist_gradI" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%"  stopColor="var(--yellow)" stopOpacity={0.15} />
                          <stop offset="95%" stopColor="var(--yellow)" stopOpacity={0}    />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                      <XAxis
                        dataKey="label"
                        tick={{ fill: "var(--text-muted)", fontSize: 11, fontFamily: "DM Sans" }}
                        axisLine={false}
                        tickLine={false}
                        interval={labelInterval}
                      />
                      <YAxis
                        tick={{ fill: "var(--text-muted)", fontSize: 11, fontFamily: "JetBrains Mono" }}
                        axisLine={false}
                        tickLine={false}
                        tickFormatter={(v) => formatCurrencyCompact(v / 100)}
                        width={72}
                      />
                      <Tooltip content={<CustomTooltip />} />
                      {/* Linha de referência no aporte inicial */}
                      <ReferenceLine
                        y={chartData[0]?.invested ?? 0}
                        stroke="var(--border)"
                        strokeDasharray="4 4"
                      />
                      {/* Total aportado */}
                      <Area
                        type="monotone"
                        dataKey="invested"
                        name="Total aportado"
                        stroke="var(--yellow)"
                        strokeWidth={2}
                        fill="url(#hist_gradI)"
                        dot={{ r: 5, fill: "var(--yellow)", stroke: "var(--surface)", strokeWidth: 2 }}
                        activeDot={{ r: 7, fill: "var(--yellow)", stroke: "var(--surface)", strokeWidth: 2 }}
                      />
                      {/* Patrimônio real */}
                      <Area
                        type="monotone"
                        dataKey="value"
                        name="Patrimônio real"
                        stroke="var(--green)"
                        strokeWidth={2}
                        fill="url(#hist_gradV)"
                        dot={{ r: 5, fill: "var(--green)", stroke: "var(--surface)", strokeWidth: 2 }}
                        activeDot={{ r: 7, fill: "var(--green)", stroke: "var(--surface)", strokeWidth: 2 }}
                      />
                      {/* Rendimento mensal como linha */}
                      <Line
                        type="monotone"
                        dataKey="interest"
                        name="Rendimento/mês"
                        stroke="var(--blue)"
                        strokeWidth={1.5}
                        strokeDasharray="5 3"
                        dot={{ r: 5, fill: "var(--blue)", stroke: "var(--surface)", strokeWidth: 2 }}
                        activeDot={{ r: 7, fill: "var(--blue)", stroke: "var(--surface)", strokeWidth: 2 }}
                      />
                    </ComposedChart>
                  </ResponsiveContainer>
                </div>

                {/* Legend */}
                <div className="mt-3 flex flex-wrap gap-4">
                  {[
                    ["var(--green)",  "Patrimônio real"],
                    ["var(--yellow)", "Total aportado"],
                    ["var(--blue)",   "Rendimento/mês"],
                  ].map(([color, label]) => (
                    <div key={label} className="flex items-center gap-1.5">
                      <div className="h-2.5 w-2.5 rounded-[2px]" style={{ backgroundColor: color }} />
                      <span className="text-text-muted text-[12px]">{label}</span>
                    </div>
                  ))}
                </div>
              </>
            ) : (
              <div className="flex flex-1 items-center justify-center py-20">
                <p className="text-text-muted text-[13px]">
                  {isPending ? "Calculando simulação..." : "Configure os parâmetros e clique em Simular"}
                </p>
              </div>
            )}
          </div>

          {/* Month-by-month table */}
          {data && rawPoints.length > 0 && (
            <div className="border-border bg-surface rounded-xl border p-5">
              <div className="flex items-center justify-between mb-3">
                <SectionHeader title="Todos os Meses" subtitle="Detalhe mês a mês" />
                <span className="text-text-muted text-[11px]">{rawPoints.length} meses simulados</span>
              </div>
              <div className="overflow-x-auto rounded-xl border border-border">
                <table className="w-full text-[12px] min-w-[440px]">
                  <thead>
                    <tr className="border-b border-border bg-surface2/60">
                      <th className="text-text-muted px-3 py-2.5 text-left font-medium">Mês</th>
                      <th className="text-text-muted px-3 py-2.5 text-right font-medium">Retorno %</th>
                      <th className="text-text-muted px-3 py-2.5 text-right font-medium">Rendimento</th>
                      <th className="text-text-muted px-3 py-2.5 text-right font-medium">Total aportado</th>
                      <th className="text-text-muted px-3 py-2.5 text-right font-medium">Patrimônio</th>
                    </tr>
                  </thead>
                  <tbody>
                    {visibleRows.map((p: HistoricalSimulationPoint) => (
                      <tr key={`${p.year}-${p.month}`} className="border-b border-border last:border-0 hover:bg-surface2/30 transition-colors">
                        <td className="text-text px-3 py-2.5 font-medium">{p.label}</td>
                        <td className={cn("px-3 py-2.5 text-right font-money", p.monthlyReturnPct >= 0 ? "text-green" : "text-red")}>
                          {p.monthlyReturnPct >= 0 ? "+" : ""}{p.monthlyReturnPct.toFixed(4)}%
                        </td>
                        <td className={cn("px-3 py-2.5 text-right font-money", p.interest >= 0 ? "text-green" : "text-red")}>
                          {p.interest >= 0 ? "+" : ""}{formatCurrency(p.interest / 100)}
                        </td>
                        <td className="text-text-muted px-3 py-2.5 text-right font-money">
                          {formatCurrency(p.invested / 100)}
                        </td>
                        <td className="text-text px-3 py-2.5 text-right font-money">
                          {formatCurrency(p.value / 100)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Pagination — mesmo padrão de TransactionsPagination */}
              <div className="mt-3 flex items-center justify-end gap-3">
                <p className="text-text-muted shrink-0 text-[13px]">
                  {totalItems === 0
                    ? "Nenhum mês"
                    : `${tableFrom}–${tableTo} de ${totalItems} mes${totalItems !== 1 ? "es" : ""}` }
                </p>

                <button
                  onClick={() => setTablePage((p) => Math.max(1, p - 1))}
                  disabled={safePage === 1}
                  className="text-text-sub hover:bg-surface2 hover:text-text flex h-8 w-8 items-center justify-center rounded-lg transition-colors disabled:opacity-40"
                >
                  <ChevronLeft size={15} />
                </button>

                <div className="flex items-center gap-1">
                  {pageNumbers.map((p, i) =>
                    p === "..." ? (
                      <span key={`dots-${i}`} className="text-text-muted px-1 text-[13px]">…</span>
                    ) : (
                      <button
                        key={p}
                        onClick={() => setTablePage(p as number)}
                        className={cn(
                          "flex h-8 w-8 items-center justify-center rounded-lg text-[13px] transition-colors",
                          safePage === p
                            ? "bg-green/15 text-green font-medium"
                            : "text-text-sub hover:bg-surface2 hover:text-text",
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
                  className="text-text-sub hover:bg-surface2 hover:text-text flex h-8 w-8 items-center justify-center rounded-lg transition-colors disabled:opacity-40"
                >
                  <ChevronRight size={15} />
                </button>

                <div ref={pageSizeRef} className="relative">
                  <button
                    onClick={() => setPageSizeOpen((o) => !o)}
                    className={cn(
                      "border-border bg-surface2 hover:bg-surface3 flex h-8 items-center gap-1.5 rounded-lg border px-3 text-[13px] transition-colors",
                      pageSizeOpen ? "border-green/40 text-text" : "text-text-sub",
                    )}
                  >
                    {tablePageSize} / pág.
                    <ChevronDown size={13} className={cn("transition-transform", pageSizeOpen && "rotate-180")} />
                  </button>
                  {pageSizeOpen && (
                    <div className="border-border bg-surface absolute bottom-full right-0 mb-1.5 min-w-[110px] overflow-hidden rounded-lg border shadow-lg">
                      {[10, 20, 50, 100].map((size) => (
                        <button
                          key={size}
                          onClick={() => { setTablePageSize(size); setTablePage(1); setPageSizeOpen(false); }}
                          className={cn(
                            "flex w-full items-center px-3 py-2 text-left text-[13px] transition-colors",
                            tablePageSize === size
                              ? "bg-green/10 text-green font-medium"
                              : "text-text-sub hover:bg-surface2 hover:text-text",
                          )}
                        >
                          {size} / pág.
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

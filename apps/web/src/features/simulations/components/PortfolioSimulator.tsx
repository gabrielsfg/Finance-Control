"use client";

import { useState, useMemo, useCallback } from "react";
import {
  ResponsiveContainer, ComposedChart, AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid,
} from "recharts";
import { SectionHeader } from "@/components/shared/SectionHeader";
import { TabChips } from "@/components/shared/TabChips";
import { formatCurrency, formatCurrencyCompact } from "@/lib/utils/formatCurrency";
import { cn } from "@/lib/utils";
import { AlertCircle, Info, Play, Sparkles } from "lucide-react";
import { usePortfolioBacktest, useAvailableBenchmarks } from "../hooks/useSimulation";
import { simulateMonthly } from "../utils/taxCalc";
import type { PortfolioAsset } from "@/lib/types/simulation";
import { PortfolioBuilder, PORTFOLIO_COLORS, makeEmptyAsset, MIN_ASSETS } from "./PortfolioBuilder";
import { MonthRangePicker } from "./MonthRangePicker";

const inputCls = "border-border bg-surface2 text-text placeholder:text-text-muted w-full rounded-lg border h-9 px-3 text-[13px] outline-none focus:border-green/60 transition-colors";

type SubTab = "backtest" | "projection";

const SUB_TABS: { id: SubTab; label: string }[] = [
  { id: "backtest",   label: "Backtest de Carteira" },
  { id: "projection", label: "Projeção de Carteira" },
];

const PERIOD_PRESETS = [
  { label: "1a",  months: 12  },
  { label: "2a",  months: 24  },
  { label: "5a",  months: 60  },
  { label: "10a", months: 120 },
  { label: "20a", months: 240 },
  { label: "30a", months: 360 },
];

function monthsAgo(n: number): string {
  const d = new Date();
  d.setMonth(d.getMonth() - n);
  return d.toISOString().slice(0, 7);
}

function toDateOnly(yearMonth: string): string {
  return `${yearMonth}-01`;
}

function defaultAssets(): PortfolioAsset[] {
  const a = makeEmptyAsset();
  const b = makeEmptyAsset();
  a.ticker = "CDI";       a.name = "CDI";        a.weightPct = 50; a.category = "renda_fixa_bancaria";
  b.ticker = "IBOVESPA";  b.name = "Ibovespa";   b.weightPct = 50; b.category = "acoes";
  return [a, b];
}

const BacktestTooltip = ({ active, payload, label }: any) => {
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

// Tooltip da projeção empilhada — cada série tem name = ticker do ativo
const StackTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="border-border bg-surface rounded-lg border px-3 py-2.5 shadow-md min-w-[200px]">
      <p className="text-text-muted mb-2 text-[11px]">{label}</p>
      {payload.map((e: any) => (
        <div key={e.dataKey} className="flex justify-between gap-4 mb-0.5">
          <span className="text-[12px]" style={{ color: e.fill ?? e.color }}>{e.name}</span>
          <span className="font-money text-[12px]" style={{ color: e.fill ?? e.color }}>
            {formatCurrency(e.value / 100)}
          </span>
        </div>
      ))}
    </div>
  );
};

export const PortfolioSimulator = () => {
  const [subTab, setSubTab]               = useState<SubTab>("backtest");
  const [assets, setAssets]               = useState<PortfolioAsset[]>(defaultAssets);
  const [initialAmount, setInitialAmount] = useState("10000");
  const [monthlyContrib, setMonthlyContrib] = useState("500");
  const [suggestedPeriodLabel, setSuggestedPeriodLabel] = useState<string | null>(null);

  const { data: availableBenchmarks = [], isLoading: loadingBenchmarks } = useAvailableBenchmarks();

  const totalWeight = assets.reduce((s, a) => s + (a.weightPct || 0), 0);
  const weightOk    = Math.abs(totalWeight - 100) < 0.5;
  const allHaveTicker = assets.every(a => !!a.ticker);
  const canRun = weightOk && allHaveTicker && assets.length >= MIN_ASSETS;

  const handleAssetsChange = useCallback((next: PortfolioAsset[]) => {
    setAssets(next);
    // Clear suggestion badge when user edits assets manually
    setSuggestedPeriodLabel(null);
  }, []);

  return (
    <div className="flex flex-col gap-4">
      <TabChips items={SUB_TABS} value={subTab} onChange={(v) => { setSubTab(v); setSuggestedPeriodLabel(null); }} size="sm" />

      {/* Montagem da carteira — compartilhada entre sub-abas */}
      <div className="border-border bg-surface rounded-xl border p-5">
        <SectionHeader
          title="Montagem da Carteira"
          subtitle={subTab === "backtest"
            ? "Defina os ativos e pesos para simular o desempenho histórico real"
            : "Defina os ativos, pesos e taxas para projetar o crescimento futuro"}
        />
        <div className="mt-4">
          <PortfolioBuilder
            assets={assets}
            onChange={handleAssetsChange}
            mode={subTab}
            availableBenchmarks={availableBenchmarks}
            loadingBenchmarks={loadingBenchmarks}
            suggestedPeriod={subTab === "projection" ? suggestedPeriodLabel : null}
          />
        </div>
      </div>

      {subTab === "backtest" ? (
        <PortfolioBacktest
          assets={assets}
          initialAmount={initialAmount}
          monthlyContrib={monthlyContrib}
          setInitialAmount={setInitialAmount}
          setMonthlyContrib={setMonthlyContrib}
          canRun={canRun}
        />
      ) : (
        <PortfolioProjection
          assets={assets}
          onAssetsChange={(next) => { setAssets(next); }}
          initialAmount={initialAmount}
          monthlyContrib={monthlyContrib}
          setInitialAmount={setInitialAmount}
          setMonthlyContrib={setMonthlyContrib}
          canRun={canRun}
          suggestedPeriodLabel={suggestedPeriodLabel}
          onSuggestedPeriodChange={setSuggestedPeriodLabel}
        />
      )}
    </div>
  );
};

// ---------------------------------------------------------------------------
// Sub-aba 1 — Backtest histórico (backend)
// ---------------------------------------------------------------------------
function PortfolioBacktest({
  assets, initialAmount, monthlyContrib, setInitialAmount, setMonthlyContrib, canRun,
}: {
  assets: PortfolioAsset[];
  initialAmount: string;
  monthlyContrib: string;
  setInitialAmount: (v: string) => void;
  setMonthlyContrib: (v: string) => void;
  canRun: boolean;
}) {
  const [start, setStart] = useState(() => monthsAgo(36));
  const [end, setEnd]     = useState(() => monthsAgo(1));

  const { mutate, data, isPending, isError } = usePortfolioBacktest();

  const handleRun = useCallback(() => {
    if (!canRun || !start || !end) return;
    const initialCents = Math.round(parseFloat(initialAmount.replace(",", ".")) * 100) || 0;
    const monthlyCents = Math.round(parseFloat(monthlyContrib.replace(",", ".")) * 100) || 0;
    mutate({
      assets: assets.map(a => ({ ticker: a.ticker, weightPct: a.weightPct })),
      startDate: toDateOnly(start),
      endDate: toDateOnly(end),
      initialAmount: initialCents,
      monthlyContribution: monthlyCents,
    });
  }, [assets, start, end, initialAmount, monthlyContrib, canRun, mutate]);

  const gain = data ? data.finalValue - data.totalInvested : 0;
  const isPositive = gain >= 0;
  const points = data?.points ?? [];

  // Agrega por ano quando ≥ 36 pontos mensais
  const chartData = points.length >= 36
    ? (() => {
        const byYear = new Map<number, typeof points>();
        for (const p of points) {
          const arr = byYear.get(p.year) ?? [];
          arr.push(p);
          byYear.set(p.year, arr);
        }
        return Array.from(byYear.entries()).map(([year, pts]) => {
          const last = pts[pts.length - 1];
          return { label: `${year}`, invested: last.invested, value: last.value };
        });
      })()
    : points.map(p => ({ label: p.label, invested: p.invested, value: p.value }));

  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-[300px_1fr]">
      {/* Params */}
      <div className="flex flex-col gap-4">
        <div className="border-border bg-surface rounded-xl border p-5">
          <SectionHeader title="Parâmetros" />
          <div className="flex flex-col gap-3 mt-4">
            <div>
              <label className="text-text-muted mb-1.5 block text-[12px]">Aporte inicial (R$)</label>
              <input className={inputCls} value={initialAmount} onChange={(e) => setInitialAmount(e.target.value)} placeholder="10000" />
            </div>
            <div>
              <label className="text-text-muted mb-1.5 block text-[12px]">Aporte mensal (R$)</label>
              <input className={inputCls} value={monthlyContrib} onChange={(e) => setMonthlyContrib(e.target.value)} placeholder="500" />
            </div>
            <div>
              <label className="text-text-muted mb-1.5 block text-[12px]">Período</label>
              <div className="rounded-xl border border-border bg-surface2/50 p-3">
                <MonthRangePicker
                  start={start}
                  end={end}
                  onChangeStart={(v) => { setStart(v); if (end && v > end) setEnd(""); }}
                  onChangeEnd={setEnd}
                />
              </div>
            </div>

            <button
              onClick={handleRun}
              disabled={isPending || !canRun}
              title={!canRun ? "Verifique os ativos e a soma dos pesos (100%)" : undefined}
              className={cn(
                "mt-1 flex w-full items-center justify-center gap-2 rounded-lg py-2.5 text-[13px] font-medium transition-colors",
                isPending || !canRun
                  ? "bg-green/20 text-green/50 cursor-not-allowed"
                  : "bg-green/15 text-green hover:bg-green/25",
              )}
            >
              <Play size={13} className={isPending ? "animate-pulse" : ""} />
              {isPending ? "Calculando..." : "Simular carteira"}
            </button>

            {isError && (
              <div className="flex items-center gap-2 rounded-lg bg-red/10 px-3 py-2.5">
                <AlertCircle size={14} className="text-red shrink-0" />
                <p className="text-red text-[12px]">Não foi possível simular. Tente novamente.</p>
              </div>
            )}
          </div>
        </div>

        {/* Result card */}
        {data && data.points.length > 0 && (
          <div
            className="rounded-xl border p-5"
            style={{
              background: "linear-gradient(135deg, color-mix(in srgb, var(--blue) 12%, transparent), color-mix(in srgb, var(--blue) 5%, transparent))",
              borderColor: "color-mix(in srgb, var(--blue) 30%, transparent)",
            }}
          >
            <div className="text-[11px] font-semibold tracking-widest mb-3" style={{ color: "var(--blue)" }}>
              CARTEIRA · BACKTEST
            </div>
            <p className="font-money text-[32px] font-bold text-text leading-none">
              {formatCurrency(data.finalValue / 100)}
            </p>
            <p className="text-text-muted text-[12px] mt-1.5">patrimônio final da carteira</p>

            <div className="mt-4 flex flex-col gap-2.5">
              {[
                { label: "Total investido",   value: formatCurrency(data.totalInvested / 100), color: "var(--text-sub)" },
                { label: "Rendimento total",  value: `${isPositive ? "+" : ""}${formatCurrency(gain / 100)}`, color: isPositive ? "var(--green)" : "var(--red)" },
                { label: "Retorno anualizado", value: `${data.annualizedReturnPct >= 0 ? "+" : ""}${data.annualizedReturnPct.toFixed(2)}% a.a.`, color: "var(--blue)" },
                { label: "Multiplicador",     value: `${(data.finalValue / Math.max(data.totalInvested, 1)).toFixed(2)}×`, color: "var(--purple)" },
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
            <p className="text-text-muted text-[12px] text-center px-4">Monte a carteira e clique em Simular</p>
          </div>
        )}
      </div>

      {/* Chart + asset returns + table */}
      <div className="flex flex-col gap-4">
        <div className="border-border bg-surface rounded-xl border p-5 flex flex-col">
          <SectionHeader title="Evolução da Carteira" subtitle="Patrimônio da carteira vs total aportado" />
          {data && chartData.length > 0 ? (
            <>
              <div className="mt-4 flex-1" style={{ minHeight: 260 }}>
                <ResponsiveContainer width="100%" height={260}>
                  <ComposedChart data={chartData} margin={{ top: 4, right: 4, left: 0, bottom: 0 }}>
                    <defs>
                      <linearGradient id="pf_gradV" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%"  stopColor="var(--green)" stopOpacity={0.2} />
                        <stop offset="95%" stopColor="var(--green)" stopOpacity={0}   />
                      </linearGradient>
                      <linearGradient id="pf_gradI" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%"  stopColor="var(--yellow)" stopOpacity={0.15} />
                        <stop offset="95%" stopColor="var(--yellow)" stopOpacity={0}    />
                      </linearGradient>
                    </defs>
                    <CartesianGrid stroke="var(--border-chart)" />
                    <XAxis dataKey="label" tick={{ fill: "var(--text-muted)", fontSize: 11, fontFamily: "DM Sans" }} axisLine={false} tickLine={false} interval="preserveStartEnd" />
                    <YAxis tick={{ fill: "var(--text-muted)", fontSize: 11, fontFamily: "JetBrains Mono" }} axisLine={false} tickLine={false} tickFormatter={(v) => formatCurrencyCompact(v / 100)} width={72} />
                    <Tooltip content={<BacktestTooltip />} />
                    <Area type="monotone" dataKey="invested" name="Total aportado" stroke="var(--yellow)" strokeWidth={2} fill="url(#pf_gradI)" dot={false} activeDot={{ r: 5 }} />
                    <Area type="monotone" dataKey="value"    name="Carteira"        stroke="var(--green)"  strokeWidth={2} fill="url(#pf_gradV)" dot={false} activeDot={{ r: 5 }} />
                  </ComposedChart>
                </ResponsiveContainer>
              </div>
              <div className="mt-3 flex flex-wrap gap-4">
                {[["var(--green)", "Carteira"], ["var(--yellow)", "Total aportado"]].map(([color, label]) => (
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
                {isPending ? "Calculando simulação..." : "Monte a carteira e clique em Simular carteira"}
              </p>
            </div>
          )}
        </div>

        {/* Retorno por ativo */}
        {data && data.assetReturns.length > 0 && (
          <div className="border-border bg-surface rounded-xl border p-5">
            <SectionHeader title="Retorno por Ativo" subtitle={`Período ${data.effectiveStartDate.slice(0, 7)} → ${data.effectiveEndDate.slice(0, 7)}`} />
            <div className="mt-4 grid grid-cols-1 gap-2 sm:grid-cols-2">
              {data.assetReturns.map((ar, i) => {
                const weight = assets.find(a => a.ticker.toUpperCase() === ar.ticker.toUpperCase())?.weightPct ?? 0;
                return (
                  <div key={ar.ticker} className="flex items-center justify-between gap-2 rounded-lg border border-border bg-surface2/40 px-3 py-2.5">
                    <div className="flex items-center gap-2 min-w-0">
                      <div className="h-2.5 w-2.5 shrink-0 rounded-[3px]" style={{ backgroundColor: PORTFOLIO_COLORS[i % PORTFOLIO_COLORS.length] }} />
                      <span className="text-text text-[13px] font-medium truncate">{ar.ticker}</span>
                      <span className="text-text-muted text-[11px] shrink-0">{weight.toFixed(0)}%</span>
                    </div>
                    <span className={cn("font-money text-[13px] font-semibold shrink-0", ar.totalReturnPct >= 0 ? "text-green" : "text-red")}>
                      {ar.totalReturnPct >= 0 ? "+" : ""}{ar.totalReturnPct.toFixed(2)}%
                    </span>
                  </div>
                );
              })}
            </div>
            <p className="text-text-muted mt-3 flex items-start gap-1.5 text-[11px]">
              <Info size={11} className="text-blue/70 mt-0.5 shrink-0" />
              Retorno bruto no período (somente variação de preço, sem dividendos nem impostos). Rebalanceamento mensal implícito pelos pesos.
            </p>
          </div>
        )}

        {/* Tabela mês a mês */}
        {data && data.points.length > 0 && (
          <PortfolioBacktestTable points={data.points} />
        )}
      </div>
    </div>
  );
}

function PortfolioBacktestTable({ points }: { points: { label: string; month: number; year: number; invested: number; value: number; monthlyReturnPct: number }[] }) {
  const [page, setPage] = useState(1);
  const pageSize = 12;
  const rows = [...points].reverse();
  const totalPages = Math.max(1, Math.ceil(rows.length / pageSize));
  const safePage = Math.min(page, totalPages);
  const from = (safePage - 1) * pageSize;
  const visible = rows.slice(from, from + pageSize);

  return (
    <div className="border-border bg-surface rounded-xl border p-5">
      <div className="flex items-center justify-between mb-3">
        <SectionHeader title="Detalhe Mês a Mês" />
        <span className="text-text-muted text-[11px]">{points.length} meses</span>
      </div>
      <div className="overflow-x-auto rounded-xl border border-border">
        <table className="w-full text-[12px] min-w-[420px]">
          <thead>
            <tr className="border-b border-border bg-surface2/60">
              <th className="text-text-muted px-3 py-2.5 text-left font-medium">Mês</th>
              <th className="text-text-muted px-3 py-2.5 text-right font-medium">Retorno carteira</th>
              <th className="text-text-muted px-3 py-2.5 text-right font-medium">Total aportado</th>
              <th className="text-text-muted px-3 py-2.5 text-right font-medium">Patrimônio</th>
            </tr>
          </thead>
          <tbody>
            {visible.map((p) => (
              <tr key={`${p.year}-${p.month}`} className="border-b border-border last:border-0 hover:bg-surface2/30 transition-colors">
                <td className="text-text px-3 py-2.5 font-medium">{p.label}</td>
                <td className={cn("px-3 py-2.5 text-right font-money", p.monthlyReturnPct >= 0 ? "text-green" : "text-red")}>
                  {p.monthlyReturnPct >= 0 ? "+" : ""}{p.monthlyReturnPct.toFixed(2)}%
                </td>
                <td className="text-text-muted px-3 py-2.5 text-right font-money">{formatCurrency(p.invested / 100)}</td>
                <td className="text-text px-3 py-2.5 text-right font-money">{formatCurrency(p.value / 100)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {totalPages > 1 && (
        <div className="mt-3 flex items-center justify-between px-1">
          <button disabled={safePage === 1} onClick={() => setPage(p => p - 1)} className="text-[11px] text-blue disabled:opacity-30 hover:underline">← Anterior</button>
          <span className="text-text-muted text-[11px]">Página {safePage} / {totalPages}</span>
          <button disabled={safePage >= totalPages} onClick={() => setPage(p => p + 1)} className="text-[11px] text-blue disabled:opacity-30 hover:underline">Próxima →</button>
        </div>
      )}
    </div>
  );
}

const SUGGESTION_PERIODS = [
  { label: "1 ano",   months: 12  },
  { label: "2 anos",  months: 24  },
  { label: "5 anos",  months: 60  },
  { label: "10 anos", months: 120 },
] as const;

type SuggestionPeriod = typeof SUGGESTION_PERIODS[number]["label"];

// ---------------------------------------------------------------------------
// Sub-aba 2 — Projeção futura (100% frontend, via simulateMonthly por ativo)
// ---------------------------------------------------------------------------
function PortfolioProjection({
  assets, onAssetsChange, initialAmount, monthlyContrib, setInitialAmount, setMonthlyContrib, canRun,
  suggestedPeriodLabel, onSuggestedPeriodChange,
}: {
  assets: PortfolioAsset[];
  onAssetsChange: (assets: PortfolioAsset[]) => void;
  initialAmount: string;
  monthlyContrib: string;
  setInitialAmount: (v: string) => void;
  setMonthlyContrib: (v: string) => void;
  canRun: boolean;
  suggestedPeriodLabel: string | null;
  onSuggestedPeriodChange: (label: string | null) => void;
}) {
  const [presetMonths, setPresetMonths] = useState(120);
  const [customMonths, setCustomMonths] = useState("");
  const [suggestionPeriod, setSuggestionPeriod] = useState<SuggestionPeriod>("5 anos");
  const { mutate: runBacktest, isPending: isSuggesting } = usePortfolioBacktest();

  const handleSuggestRates = useCallback(() => {
    if (!canRun) return;
    const sp = SUGGESTION_PERIODS.find(p => p.label === suggestionPeriod)!;
    const initialCents = Math.round(parseFloat(initialAmount.replace(",", ".")) * 100) || 0;
    const monthlyCents = Math.round(parseFloat(monthlyContrib.replace(",", ".")) * 100) || 0;
    runBacktest(
      {
        assets: assets.map(a => ({ ticker: a.ticker, weightPct: a.weightPct })),
        startDate: toDateOnly(monthsAgo(sp.months)),
        endDate: toDateOnly(monthsAgo(1)),
        initialAmount: initialCents,
        monthlyContribution: monthlyCents,
      },
      {
        onSuccess: (data) => {
          const rateMap = new Map(data.assetReturns.map(r => [r.ticker.toUpperCase(), r.totalReturnPct]));
          const months = sp.months;
          onAssetsChange(
            assets.map(a => {
              const totalPct = rateMap.get(a.ticker.toUpperCase());
              if (totalPct === undefined) return a;
              // Convert cumulative total return to annualised CAGR
              const years = months / 12;
              const cagr = (Math.pow(1 + totalPct / 100, 1 / years) - 1) * 100;
              return { ...a, annualRatePct: Math.round(cagr * 100) / 100 };
            }),
          );
          onSuggestedPeriodChange(suggestionPeriod);
        },
      },
    );
  }, [canRun, suggestionPeriod, assets, initialAmount, monthlyContrib, onAssetsChange, onSuggestedPeriodChange, runBacktest]);

  const totalMonths = customMonths ? (parseInt(customMonths) || 0) : presetMonths;
  const useAnnual = totalMonths >= 36;

  // Default rate (10% a.a.) mirrors the value used by the projection when a row is left blank.
  const weightedRate = useMemo(
    () => assets.reduce((s, a) => s + (a.weightPct / 100) * (a.annualRatePct ?? 10), 0),
    [assets],
  );

  const projection = useMemo(() => {
    const valid = assets.filter(a => a.ticker && a.weightPct > 0);
    if (!totalMonths || valid.length === 0 || !canRun) return null;

    const initial = parseFloat(initialAmount.replace(",", ".")) * 100 || 0;
    const monthly = parseFloat(monthlyContrib.replace(",", ".")) * 100 || 0;

    const perAsset = valid.map((a) => {
      const w = a.weightPct / 100;
      const rate = a.annualRatePct ?? 10;
      return { asset: a, pts: simulateMonthly(initial * w, monthly * w, rate, totalMonths, a.category) };
    });

    const rows = [];
    for (let m = 0; m < totalMonths; m++) {
      const yr = Math.ceil((m + 1) / 12);
      const row: Record<string, number | string> = {
        month: m + 1,
        shortLabel: (m + 1) % 12 === 0 ? `Ano ${yr}` : `M${m + 1}`,
      };
      let gross = 0, net = 0, invested = 0, tax = 0;
      for (const pa of perAsset) {
        const p = pa.pts[m];
        row[pa.asset.id] = p.grossValue;
        gross += p.grossValue; net += p.netValue; invested += p.invested; tax += p.totalTax;
      }
      row.total = gross; row.totalNet = net; row.invested = invested; row.totalTax = tax;
      rows.push(row);
    }

    const last = rows[rows.length - 1] as Record<string, number>;
    return {
      perAsset,
      rows,
      finalGross: last.total,
      finalNet: last.totalNet,
      investedTotal: last.invested,
      totalTax: last.totalTax,
    };
  }, [assets, totalMonths, initialAmount, monthlyContrib, canRun]);

  const chartRows = useMemo(() => {
    if (!projection) return [];
    return useAnnual
      ? projection.rows.filter((r) => (r.month as number) % 12 === 0 || r.month === totalMonths)
      : projection.rows;
  }, [projection, useAnnual, totalMonths]);

  const annualRows = useMemo(() => {
    if (!projection) return [];
    return projection.rows.filter((r) => (r.month as number) % 12 === 0 || r.month === totalMonths);
  }, [projection, totalMonths]);

  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-[300px_1fr]">
      {/* Params */}
      <div className="flex flex-col gap-4">
        <div className="border-border bg-surface rounded-xl border p-5">
          <SectionHeader title="Parâmetros" />
          <div className="flex flex-col gap-3 mt-4">
            <div>
              <label className="text-text-muted mb-1.5 block text-[12px]">Aporte inicial total (R$)</label>
              <input className={inputCls} value={initialAmount} onChange={(e) => setInitialAmount(e.target.value)} placeholder="10000" />
            </div>
            <div>
              <label className="text-text-muted mb-1.5 block text-[12px]">Aporte mensal total (R$)</label>
              <input className={inputCls} value={monthlyContrib} onChange={(e) => setMonthlyContrib(e.target.value)} placeholder="500" />
              <p className="text-text-muted mt-1.5 text-[11px]">Distribuído entre os ativos pelos pesos definidos.</p>
            </div>
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
                        : "text-text-muted border-border hover:text-text",
                    )}
                  >
                    {p.label}
                  </button>
                ))}
              </div>
              <input className={cn(inputCls, "mt-2")} value={customMonths} onChange={(e) => setCustomMonths(e.target.value)} placeholder="Ou digite os meses (ex: 84)" inputMode="numeric" />
            </div>

            {/* Sugestão de taxa via histórico */}
            <div className="rounded-lg border border-blue/20 bg-blue/5 p-3 flex flex-col gap-2.5">
              <div className="flex items-center gap-1.5">
                <Sparkles size={12} className="text-blue shrink-0" />
                <span className="text-[12px] font-medium text-blue">Sugerir taxas pelo histórico</span>
              </div>
              <p className="text-[11px] text-text-muted leading-relaxed">
                Roda o backtest da carteira atual e preenche o CAGR real de cada ativo como taxa de projeção.
              </p>
              <div>
                <p className="text-[10px] text-text-muted mb-1.5 font-medium uppercase tracking-wider">Período de referência</p>
                <div className="flex gap-1">
                  {SUGGESTION_PERIODS.map((p) => (
                    <button
                      key={p.label}
                      onClick={() => setSuggestionPeriod(p.label)}
                      className={cn(
                        "flex-1 rounded-lg border px-1 py-1 text-[10px] font-medium transition-colors whitespace-nowrap",
                        suggestionPeriod === p.label
                          ? "bg-blue/15 text-blue border-blue/30"
                          : "text-text-muted border-border hover:text-text",
                      )}
                    >
                      {p.label}
                    </button>
                  ))}
                </div>
              </div>
              <button
                onClick={handleSuggestRates}
                disabled={isSuggesting || !canRun}
                title={!canRun ? "Verifique os ativos e pesos (soma 100%)" : undefined}
                className={cn(
                  "flex w-full items-center justify-center gap-1.5 rounded-lg py-2 text-[12px] font-medium transition-colors",
                  isSuggesting || !canRun
                    ? "bg-blue/10 text-blue/40 cursor-not-allowed"
                    : "bg-blue/15 text-blue hover:bg-blue/25",
                )}
              >
                <Sparkles size={12} className={isSuggesting ? "animate-pulse" : ""} />
                {isSuggesting ? "Buscando histórico..." : "Sugerir taxas"}
              </button>
              {suggestedPeriodLabel && !isSuggesting && (
                <p className="text-[10px] text-blue/70 text-center">
                  Taxas baseadas em {suggestedPeriodLabel} de histórico. Edite manualmente se preferir.
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Result card */}
        {projection ? (
          <div
            className="rounded-xl border p-5"
            style={{
              background: "linear-gradient(135deg, color-mix(in srgb, var(--purple) 12%, transparent), color-mix(in srgb, var(--purple) 5%, transparent))",
              borderColor: "color-mix(in srgb, var(--purple) 30%, transparent)",
            }}
          >
            <div className="text-[11px] font-semibold tracking-widest mb-3" style={{ color: "var(--purple)" }}>
              CARTEIRA · PROJEÇÃO
            </div>
            <p className="font-money text-[32px] font-bold text-text leading-none">
              {formatCurrency(projection.finalNet / 100)}
            </p>
            <p className="text-text-muted text-[12px] mt-1.5">
              patrimônio líquido em {totalMonths >= 12 ? `${Math.round(totalMonths / 12)} anos` : `${totalMonths} meses`}
            </p>

            <div className="mt-4 flex flex-col gap-2.5">
              {[
                { label: "Patrimônio bruto",   value: formatCurrency(projection.finalGross / 100), color: "var(--green)" },
                { label: "Total investido",    value: formatCurrency(projection.investedTotal / 100), color: "var(--text-sub)" },
                { label: "Imposto estimado",   value: formatCurrency(projection.totalTax / 100), color: "var(--orange)" },
                { label: "Taxa ponderada",     value: `${weightedRate.toFixed(2)}% a.a.`, color: "var(--purple)" },
              ].map(({ label, value, color }) => (
                <div key={label} className="flex justify-between text-[12px]">
                  <span className="text-text-muted">{label}</span>
                  <span className="font-money" style={{ color }}>{value}</span>
                </div>
              ))}
            </div>
            <p className="text-text-muted mt-3 flex items-start gap-1.5 text-[11px]">
              <Info size={11} className="text-purple/70 mt-0.5 shrink-0" />
              Impostos calculados por ativo conforme a categoria fiscal selecionada.
            </p>
          </div>
        ) : (
          <div className="flex h-28 items-center justify-center rounded-xl border border-dashed border-border">
            <p className="text-text-muted text-[12px] text-center px-4">
              {canRun ? "Defina o período e as taxas" : "Ajuste os ativos e pesos (soma 100%)"}
            </p>
          </div>
        )}
      </div>

      {/* Chart + table */}
      <div className="flex flex-col gap-4">
        <div className="border-border bg-surface rounded-xl border p-5 flex flex-col">
          <SectionHeader title="Composição ao Longo do Tempo" subtitle={useAnnual ? "Agrupado por ano" : "Mensal"} />
          {projection && chartRows.length > 0 ? (
            <>
              <div className="mt-4 flex-1" style={{ minHeight: 260 }}>
                <ResponsiveContainer width="100%" height={260}>
                  <AreaChart data={chartRows} margin={{ top: 4, right: 4, left: 0, bottom: 0 }}>
                    <CartesianGrid stroke="var(--border-chart)" />
                    <XAxis dataKey="shortLabel" tick={{ fill: "var(--text-muted)", fontSize: 11, fontFamily: "DM Sans" }} axisLine={false} tickLine={false} interval="preserveStartEnd" />
                    <YAxis tick={{ fill: "var(--text-muted)", fontSize: 11, fontFamily: "JetBrains Mono" }} axisLine={false} tickLine={false} tickFormatter={(v) => formatCurrencyCompact(v / 100)} width={72} />
                    <Tooltip content={<StackTooltip />} />
                    {projection.perAsset.map((pa, i) => (
                      <Area
                        key={pa.asset.id}
                        type="monotone"
                        dataKey={pa.asset.id}
                        name={pa.asset.ticker}
                        stackId="portfolio"
                        stroke={PORTFOLIO_COLORS[i % PORTFOLIO_COLORS.length]}
                        fill={PORTFOLIO_COLORS[i % PORTFOLIO_COLORS.length]}
                        fillOpacity={0.5}
                        strokeWidth={1.5}
                      />
                    ))}
                  </AreaChart>
                </ResponsiveContainer>
              </div>
              <div className="mt-3 flex flex-wrap gap-3">
                {projection.perAsset.map((pa, i) => (
                  <div key={pa.asset.id} className="flex items-center gap-1.5">
                    <div className="h-2.5 w-2.5 rounded-[2px]" style={{ backgroundColor: PORTFOLIO_COLORS[i % PORTFOLIO_COLORS.length] }} />
                    <span className="text-text-muted text-[12px]">{pa.asset.ticker} ({pa.asset.weightPct.toFixed(0)}% · {(pa.asset.annualRatePct ?? 10).toFixed(1)}% a.a.)</span>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <div className="flex flex-1 items-center justify-center py-20">
              <p className="text-text-muted text-[13px] text-center px-6">
                {canRun ? "Defina o período para ver a projeção" : "Ajuste os ativos e pesos da carteira (soma 100%)"}
              </p>
            </div>
          )}
        </div>

        {/* Tabela anual por ativo */}
        {projection && annualRows.length > 0 && (
          <div className="border-border bg-surface rounded-xl border p-5">
            <SectionHeader title="Detalhamento Anual" subtitle="Patrimônio bruto por ativo, total e imposto estimado" />
            <div className="mt-4 overflow-x-auto rounded-xl border border-border">
              <table className="w-full text-[12px]" style={{ minWidth: Math.max(440, 160 + projection.perAsset.length * 110) }}>
                <thead>
                  <tr className="border-b border-border bg-surface2/60">
                    <th className="text-text-muted px-3 py-2.5 text-left font-medium">Ano</th>
                    {projection.perAsset.map((pa, i) => (
                      <th key={pa.asset.id} className="px-3 py-2.5 text-right font-medium" style={{ color: PORTFOLIO_COLORS[i % PORTFOLIO_COLORS.length] }}>
                        {pa.asset.ticker}
                      </th>
                    ))}
                    <th className="text-text-muted px-3 py-2.5 text-right font-medium">Total bruto</th>
                    <th className="text-text-muted px-3 py-2.5 text-right font-medium">Imposto est.</th>
                    <th className="text-text-muted px-3 py-2.5 text-right font-medium">Líquido</th>
                  </tr>
                </thead>
                <tbody>
                  {annualRows.map((r) => {
                    const yr = Math.ceil((r.month as number) / 12);
                    return (
                      <tr key={r.month as number} className="border-b border-border last:border-0 hover:bg-surface2/30 transition-colors">
                        <td className="px-3 py-2.5 font-medium text-text">Ano {yr}</td>
                        {projection.perAsset.map((pa) => (
                          <td key={pa.asset.id} className="px-3 py-2.5 text-right font-money text-text-sub">
                            {formatCurrency((r[pa.asset.id] as number) / 100)}
                          </td>
                        ))}
                        <td className="px-3 py-2.5 text-right font-money text-text">{formatCurrency((r.total as number) / 100)}</td>
                        <td className="px-3 py-2.5 text-right font-money text-orange">{formatCurrency((r.totalTax as number) / 100)}</td>
                        <td className="px-3 py-2.5 text-right font-money text-green">{formatCurrency((r.totalNet as number) / 100)}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

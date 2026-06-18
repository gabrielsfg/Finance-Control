"use client";

import { useState, useMemo, useCallback } from "react";
import {
  ResponsiveContainer, ComposedChart, AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid,
} from "recharts";
import { Card, CardHead } from "@/components/shared/Card";
import { TabChips } from "@/components/shared/TabChips";
import { formatCurrency, formatCurrencyCompact } from "@/lib/utils/formatCurrency";
import { cn } from "@/lib/utils";
import { AlertCircle, Info, Play, Sparkles } from "lucide-react";
import { usePortfolioBacktest, useAvailableBenchmarks } from "../hooks/useSimulation";
import { simulateMonthly } from "../utils/taxCalc";
import type { PortfolioAsset } from "@/lib/types/simulation";
import { PortfolioBuilder, PORTFOLIO_COLORS, makeEmptyAsset, MIN_ASSETS } from "./PortfolioBuilder";
import { MonthRangePicker } from "@/components/shared/MonthRangePicker";
import { CHART_GRID, axisTick, SERIES, PresetPill, PrimaryButton, ChartTooltip, LegendItem } from "./simShared";

/** Tokenised `.field` input — mono, bordered, cobalt focus halo. */
const inputCls =
  "h-11 w-full rounded-[13px] border border-[var(--border-color)] bg-[var(--surface)] px-3.5 font-mono text-[14px] tabular-nums text-[var(--text)] outline-none transition-[border-color,box-shadow] placeholder:text-[var(--text-sub)]/60 focus:border-[var(--brand-cobalt)] focus:shadow-[0_0_0_3px_color-mix(in_srgb,var(--brand-cobalt)_12%,transparent)]";

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
      <Card>
        <CardHead
          title="Montagem da Carteira"
          subtitle={subTab === "backtest"
            ? "Defina os ativos e pesos para simular o desempenho histórico real"
            : "Defina os ativos, pesos e taxas para projetar o crescimento futuro"}
        />
        <PortfolioBuilder
          assets={assets}
          onChange={handleAssetsChange}
          mode={subTab}
          availableBenchmarks={availableBenchmarks}
          loadingBenchmarks={loadingBenchmarks}
          suggestedPeriod={subTab === "projection" ? suggestedPeriodLabel : null}
        />
      </Card>

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
        <Card>
          <CardHead title="Parâmetros" />
          <div className="flex flex-col gap-3.5">
            <div>
              <label className="mb-2 block font-mono text-[11px] uppercase tracking-[0.1em] text-[var(--text-sub)]">Aporte inicial (R$)</label>
              <input className={inputCls} value={initialAmount} onChange={(e) => setInitialAmount(e.target.value)} placeholder="10000" />
            </div>
            <div>
              <label className="mb-2 block font-mono text-[11px] uppercase tracking-[0.1em] text-[var(--text-sub)]">Aporte mensal (R$)</label>
              <input className={inputCls} value={monthlyContrib} onChange={(e) => setMonthlyContrib(e.target.value)} placeholder="500" />
            </div>
            <div>
              <label className="mb-2 block font-mono text-[11px] uppercase tracking-[0.1em] text-[var(--text-sub)]">Período</label>
              <div className="rounded-[13px] border border-[var(--border-color)] bg-[var(--surface2)] p-3">
                <MonthRangePicker
                  start={start}
                  end={end}
                  onChangeStart={(v) => { setStart(v); if (end && v > end) setEnd(""); }}
                  onChangeEnd={setEnd}
                />
              </div>
            </div>

            <PrimaryButton
              onClick={handleRun}
              disabled={isPending || !canRun}
              title={!canRun ? "Verifique os ativos e a soma dos pesos (100%)" : undefined}
              className="mt-1"
            >
              <Play size={13} className={isPending ? "animate-pulse" : ""} />
              {isPending ? "Calculando..." : "Simular carteira"}
            </PrimaryButton>

            {isError && (
              <div className="flex items-center gap-2 rounded-[13px] px-3 py-2.5" style={{ background: "color-mix(in srgb, var(--clay) 10%, transparent)" }}>
                <AlertCircle size={14} className="shrink-0 text-[var(--clay)]" />
                <p className="text-[12px] text-[var(--clay)]">Não foi possível simular. Tente novamente.</p>
              </div>
            )}
          </div>
        </Card>

        {/* Result card */}
        {data && data.points.length > 0 && (
          <div
            className="rounded-[20px] border p-5"
            style={{
              background: "linear-gradient(135deg, color-mix(in srgb, var(--brand-cobalt) 12%, transparent), color-mix(in srgb, var(--brand-cobalt) 5%, transparent))",
              borderColor: "color-mix(in srgb, var(--brand-cobalt) 30%, transparent)",
            }}
          >
            <div className="mb-3 font-mono text-[11px] uppercase tracking-[0.18em]" style={{ color: "var(--brand-cobalt)" }}>
              CARTEIRA · BACKTEST
            </div>
            <p className="font-mono text-[32px] font-bold leading-none tabular-nums text-[var(--text)]">
              {formatCurrency(data.finalValue / 100)}
            </p>
            <p className="mt-1.5 text-[12px] text-[var(--text-sub)]">patrimônio final da carteira</p>

            <div className="mt-4 flex flex-col gap-2.5">
              {[
                { label: "Total investido",   value: formatCurrency(data.totalInvested / 100), color: "var(--text-sub)" },
                { label: "Rendimento total",  value: `${isPositive ? "+" : ""}${formatCurrency(gain / 100)}`, color: isPositive ? "var(--moss)" : "var(--clay)" },
                { label: "Retorno anualizado", value: `${data.annualizedReturnPct >= 0 ? "+" : ""}${data.annualizedReturnPct.toFixed(2)}% a.a.`, color: "var(--brand-accent)" },
                { label: "Multiplicador",     value: `${(data.finalValue / Math.max(data.totalInvested, 1)).toFixed(2)}×`, color: "var(--gold)" },
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
            <p className="px-4 text-center text-[12px] text-[var(--text-sub)]">Monte a carteira e clique em Simular</p>
          </div>
        )}
      </div>

      {/* Chart + asset returns + table */}
      <div className="flex flex-col gap-4">
        <Card className="flex flex-col">
          <CardHead title="Evolução da Carteira" subtitle="Patrimônio da carteira vs total aportado" />
          {data && chartData.length > 0 ? (
            <>
              <div className="mt-4 flex-1" style={{ minHeight: 260 }}>
                <ResponsiveContainer width="100%" height={260}>
                  <ComposedChart data={chartData} margin={{ top: 4, right: 4, left: 0, bottom: 0 }}>
                    <defs>
                      <linearGradient id="pf_gradV" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%"  stopColor={SERIES.moss} stopOpacity={0.2} />
                        <stop offset="95%" stopColor={SERIES.moss} stopOpacity={0}   />
                      </linearGradient>
                      <linearGradient id="pf_gradI" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%"  stopColor={SERIES.gold} stopOpacity={0.15} />
                        <stop offset="95%" stopColor={SERIES.gold} stopOpacity={0}    />
                      </linearGradient>
                    </defs>
                    <CartesianGrid {...CHART_GRID} />
                    <XAxis dataKey="label" tick={axisTick} axisLine={false} tickLine={false} interval="preserveStartEnd" />
                    <YAxis tick={axisTick} axisLine={false} tickLine={false} tickFormatter={(v) => formatCurrencyCompact(v / 100)} width={72} />
                    <Tooltip content={<ChartTooltip />} />
                    <Area type="monotone" dataKey="invested" name="Total aportado" stroke={SERIES.gold} strokeWidth={2} fill="url(#pf_gradI)" dot={false} activeDot={{ r: 5 }} />
                    <Area type="monotone" dataKey="value"    name="Carteira"        stroke={SERIES.moss} strokeWidth={2} fill="url(#pf_gradV)" dot={false} activeDot={{ r: 5 }} />
                  </ComposedChart>
                </ResponsiveContainer>
              </div>
              <div className="mt-3 flex flex-wrap gap-4">
                <LegendItem color={SERIES.moss}>Carteira</LegendItem>
                <LegendItem color={SERIES.gold}>Total aportado</LegendItem>
              </div>
            </>
          ) : (
            <div className="flex flex-1 items-center justify-center py-20">
              <p className="text-[13px] text-[var(--text-sub)]">
                {isPending ? "Calculando simulação..." : "Monte a carteira e clique em Simular carteira"}
              </p>
            </div>
          )}
        </Card>

        {/* Retorno por ativo */}
        {data && data.assetReturns.length > 0 && (
          <Card>
            <CardHead title="Retorno por Ativo" subtitle={`Período ${data.effectiveStartDate.slice(0, 7)} → ${data.effectiveEndDate.slice(0, 7)}`} />
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
              {data.assetReturns.map((ar, i) => {
                const weight = assets.find(a => a.ticker.toUpperCase() === ar.ticker.toUpperCase())?.weightPct ?? 0;
                return (
                  <div key={ar.ticker} className="flex items-center justify-between gap-2 rounded-[13px] border border-[var(--border-color)] bg-[var(--surface2)] px-3 py-2.5">
                    <div className="flex items-center gap-2 min-w-0">
                      <div className="h-2.5 w-2.5 shrink-0 rounded-[3px]" style={{ backgroundColor: PORTFOLIO_COLORS[i % PORTFOLIO_COLORS.length] }} />
                      <span className="truncate text-[13px] font-medium text-[var(--text)]">{ar.ticker}</span>
                      <span className="shrink-0 font-mono text-[11px] tabular-nums text-[var(--text-sub)]">{weight.toFixed(0)}%</span>
                    </div>
                    <span className="shrink-0 font-mono text-[13px] font-semibold tabular-nums" style={{ color: ar.totalReturnPct >= 0 ? "var(--moss)" : "var(--clay)" }}>
                      {ar.totalReturnPct >= 0 ? "+" : ""}{ar.totalReturnPct.toFixed(2)}%
                    </span>
                  </div>
                );
              })}
            </div>
            <p className="mt-3 flex items-start gap-1.5 text-[11px] text-[var(--text-sub)]">
              <Info size={11} className="mt-0.5 shrink-0 text-[var(--brand-accent)]" />
              Retorno bruto no período (somente variação de preço, sem dividendos nem impostos). Rebalanceamento mensal implícito pelos pesos.
            </p>
          </Card>
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
    <Card>
      <div className="mb-3 flex items-center justify-between">
        <CardHead className="mb-0" title="Detalhe Mês a Mês" />
        <span className="font-mono text-[11px] tabular-nums text-[var(--text-sub)]">{points.length} meses</span>
      </div>
      <div className="overflow-x-auto rounded-[13px] border border-[var(--border-color)]">
        <table className="w-full min-w-[420px] text-[12px]">
          <thead>
            <tr className="border-b border-[var(--border-color)] bg-[var(--surface2)]">
              <th className="px-3 py-2.5 text-left font-mono text-[10.5px] uppercase tracking-[0.12em] text-[var(--text-sub)]">Mês</th>
              <th className="px-3 py-2.5 text-right font-mono text-[10.5px] uppercase tracking-[0.12em] text-[var(--text-sub)]">Retorno carteira</th>
              <th className="px-3 py-2.5 text-right font-mono text-[10.5px] uppercase tracking-[0.12em] text-[var(--text-sub)]">Total aportado</th>
              <th className="px-3 py-2.5 text-right font-mono text-[10.5px] uppercase tracking-[0.12em] text-[var(--text-sub)]">Patrimônio</th>
            </tr>
          </thead>
          <tbody>
            {visible.map((p) => (
              <tr key={`${p.year}-${p.month}`} className="border-b border-[var(--border-color)] transition-colors last:border-0 hover:bg-[var(--surface2)]">
                <td className="px-3 py-2.5 font-medium text-[var(--text)]">{p.label}</td>
                <td className="px-3 py-2.5 text-right font-mono tabular-nums" style={{ color: p.monthlyReturnPct >= 0 ? "var(--moss)" : "var(--clay)" }}>
                  {p.monthlyReturnPct >= 0 ? "+" : ""}{p.monthlyReturnPct.toFixed(2)}%
                </td>
                <td className="px-3 py-2.5 text-right font-mono tabular-nums text-[var(--text-sub)]">{formatCurrency(p.invested / 100)}</td>
                <td className="px-3 py-2.5 text-right font-mono tabular-nums text-[var(--text)]">{formatCurrency(p.value / 100)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {totalPages > 1 && (
        <div className="mt-3 flex items-center justify-between px-1">
          <button disabled={safePage === 1} onClick={() => setPage(p => p - 1)} className="text-[11px] text-[var(--brand-accent)] disabled:opacity-30 hover:underline">← Anterior</button>
          <span className="font-mono text-[11px] tabular-nums text-[var(--text-sub)]">Página {safePage} / {totalPages}</span>
          <button disabled={safePage >= totalPages} onClick={() => setPage(p => p + 1)} className="text-[11px] text-[var(--brand-accent)] disabled:opacity-30 hover:underline">Próxima →</button>
        </div>
      )}
    </Card>
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
        <Card>
          <CardHead title="Parâmetros" />
          <div className="flex flex-col gap-3.5">
            <div>
              <label className="mb-2 block font-mono text-[11px] uppercase tracking-[0.1em] text-[var(--text-sub)]">Aporte inicial total (R$)</label>
              <input className={inputCls} value={initialAmount} onChange={(e) => setInitialAmount(e.target.value)} placeholder="10000" />
            </div>
            <div>
              <label className="mb-2 block font-mono text-[11px] uppercase tracking-[0.1em] text-[var(--text-sub)]">Aporte mensal total (R$)</label>
              <input className={inputCls} value={monthlyContrib} onChange={(e) => setMonthlyContrib(e.target.value)} placeholder="500" />
              <p className="mt-1.5 text-[11px] text-[var(--text-sub)]">Distribuído entre os ativos pelos pesos definidos.</p>
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
              <input className={cn(inputCls, "mt-2")} value={customMonths} onChange={(e) => setCustomMonths(e.target.value)} placeholder="Ou digite os meses (ex: 84)" inputMode="numeric" />
            </div>

            {/* Sugestão de taxa via histórico */}
            <div
              className="flex flex-col gap-2.5 rounded-[13px] border p-3"
              style={{ borderColor: "color-mix(in srgb, var(--brand-accent) 20%, transparent)", background: "color-mix(in srgb, var(--brand-accent) 5%, transparent)" }}
            >
              <div className="flex items-center gap-1.5">
                <Sparkles size={12} className="shrink-0 text-[var(--brand-accent)]" />
                <span className="text-[12px] font-medium text-[var(--brand-accent)]">Sugerir taxas pelo histórico</span>
              </div>
              <p className="text-[11px] leading-relaxed text-[var(--text-sub)]">
                Roda o backtest da carteira atual e preenche o CAGR real de cada ativo como taxa de projeção.
              </p>
              <div>
                <p className="mb-1.5 font-mono text-[10px] font-medium uppercase tracking-wider text-[var(--text-sub)]">Período de referência</p>
                <div className="flex gap-1">
                  {SUGGESTION_PERIODS.map((p) => (
                    <PresetPill key={p.label} active={suggestionPeriod === p.label} onClick={() => setSuggestionPeriod(p.label)}>
                      {p.label}
                    </PresetPill>
                  ))}
                </div>
              </div>
              <button
                onClick={handleSuggestRates}
                disabled={isSuggesting || !canRun}
                title={!canRun ? "Verifique os ativos e pesos (soma 100%)" : undefined}
                className={cn(
                  "flex w-full items-center justify-center gap-1.5 rounded-[13px] py-2 text-[12px] font-medium transition-colors",
                  isSuggesting || !canRun ? "cursor-not-allowed" : "hover:opacity-90",
                )}
                style={{
                  background: "color-mix(in srgb, var(--brand-accent) 15%, transparent)",
                  color: "var(--brand-accent)",
                  opacity: isSuggesting || !canRun ? 0.5 : 1,
                }}
              >
                <Sparkles size={12} className={isSuggesting ? "animate-pulse" : ""} />
                {isSuggesting ? "Buscando histórico..." : "Sugerir taxas"}
              </button>
              {suggestedPeriodLabel && !isSuggesting && (
                <p className="text-center text-[10px] text-[var(--brand-accent)]">
                  Taxas baseadas em {suggestedPeriodLabel} de histórico. Edite manualmente se preferir.
                </p>
              )}
            </div>
          </div>
        </Card>

        {/* Result card */}
        {projection ? (
          <div
            className="rounded-[20px] border p-5"
            style={{
              background: "linear-gradient(135deg, color-mix(in srgb, var(--brand-cobalt) 12%, transparent), color-mix(in srgb, var(--brand-cobalt) 5%, transparent))",
              borderColor: "color-mix(in srgb, var(--brand-cobalt) 30%, transparent)",
            }}
          >
            <div className="mb-3 font-mono text-[11px] uppercase tracking-[0.18em]" style={{ color: "var(--brand-cobalt)" }}>
              CARTEIRA · PROJEÇÃO
            </div>
            <p className="font-mono text-[32px] font-bold leading-none tabular-nums text-[var(--text)]">
              {formatCurrency(projection.finalNet / 100)}
            </p>
            <p className="mt-1.5 text-[12px] text-[var(--text-sub)]">
              patrimônio líquido em {totalMonths >= 12 ? `${Math.round(totalMonths / 12)} anos` : `${totalMonths} meses`}
            </p>

            <div className="mt-4 flex flex-col gap-2.5">
              {[
                { label: "Patrimônio bruto",   value: formatCurrency(projection.finalGross / 100), color: "var(--moss)" },
                { label: "Total investido",    value: formatCurrency(projection.investedTotal / 100), color: "var(--text-sub)" },
                { label: "Imposto estimado",   value: formatCurrency(projection.totalTax / 100), color: "var(--gold)" },
                { label: "Taxa ponderada",     value: `${weightedRate.toFixed(2)}% a.a.`, color: "var(--brand-cobalt)" },
              ].map(({ label, value, color }) => (
                <div key={label} className="flex justify-between text-[12px]">
                  <span className="text-[var(--text-sub)]">{label}</span>
                  <span className="font-mono tabular-nums" style={{ color }}>{value}</span>
                </div>
              ))}
            </div>
            <p className="mt-3 flex items-start gap-1.5 text-[11px] text-[var(--text-sub)]">
              <Info size={11} className="mt-0.5 shrink-0 text-[var(--brand-cobalt)]" />
              Impostos calculados por ativo conforme a categoria fiscal selecionada.
            </p>
          </div>
        ) : (
          <div className="flex h-28 items-center justify-center rounded-[20px] border border-dashed border-[var(--border-color)]">
            <p className="px-4 text-center text-[12px] text-[var(--text-sub)]">
              {canRun ? "Defina o período e as taxas" : "Ajuste os ativos e pesos (soma 100%)"}
            </p>
          </div>
        )}
      </div>

      {/* Chart + table */}
      <div className="flex flex-col gap-4">
        <Card className="flex flex-col">
          <CardHead title="Composição ao Longo do Tempo" subtitle={useAnnual ? "Agrupado por ano" : "Mensal"} />
          {projection && chartRows.length > 0 ? (
            <>
              <div className="mt-4 flex-1" style={{ minHeight: 260 }}>
                <ResponsiveContainer width="100%" height={260}>
                  <AreaChart data={chartRows} margin={{ top: 4, right: 4, left: 0, bottom: 0 }}>
                    <CartesianGrid {...CHART_GRID} />
                    <XAxis dataKey="shortLabel" tick={axisTick} axisLine={false} tickLine={false} interval="preserveStartEnd" />
                    <YAxis tick={axisTick} axisLine={false} tickLine={false} tickFormatter={(v) => formatCurrencyCompact(v / 100)} width={72} />
                    <Tooltip content={<ChartTooltip colorKey="fill" />} />
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
                  <LegendItem key={pa.asset.id} color={PORTFOLIO_COLORS[i % PORTFOLIO_COLORS.length]}>
                    {pa.asset.ticker} ({pa.asset.weightPct.toFixed(0)}% · {(pa.asset.annualRatePct ?? 10).toFixed(1)}% a.a.)
                  </LegendItem>
                ))}
              </div>
            </>
          ) : (
            <div className="flex flex-1 items-center justify-center py-20">
              <p className="px-6 text-center text-[13px] text-[var(--text-sub)]">
                {canRun ? "Defina o período para ver a projeção" : "Ajuste os ativos e pesos da carteira (soma 100%)"}
              </p>
            </div>
          )}
        </Card>

        {/* Tabela anual por ativo */}
        {projection && annualRows.length > 0 && (
          <Card>
            <CardHead title="Detalhamento Anual" subtitle="Patrimônio bruto por ativo, total e imposto estimado" />
            <div className="overflow-x-auto rounded-[13px] border border-[var(--border-color)]">
              <table className="w-full text-[12px]" style={{ minWidth: Math.max(440, 160 + projection.perAsset.length * 110) }}>
                <thead>
                  <tr className="border-b border-[var(--border-color)] bg-[var(--surface2)]">
                    <th className="px-3 py-2.5 text-left font-mono text-[10.5px] uppercase tracking-[0.12em] text-[var(--text-sub)]">Ano</th>
                    {projection.perAsset.map((pa, i) => (
                      <th key={pa.asset.id} className="px-3 py-2.5 text-right font-mono text-[10.5px] uppercase tracking-[0.12em]" style={{ color: PORTFOLIO_COLORS[i % PORTFOLIO_COLORS.length] }}>
                        {pa.asset.ticker}
                      </th>
                    ))}
                    <th className="px-3 py-2.5 text-right font-mono text-[10.5px] uppercase tracking-[0.12em] text-[var(--text-sub)]">Total bruto</th>
                    <th className="px-3 py-2.5 text-right font-mono text-[10.5px] uppercase tracking-[0.12em] text-[var(--text-sub)]">Imposto est.</th>
                    <th className="px-3 py-2.5 text-right font-mono text-[10.5px] uppercase tracking-[0.12em] text-[var(--text-sub)]">Líquido</th>
                  </tr>
                </thead>
                <tbody>
                  {annualRows.map((r) => {
                    const yr = Math.ceil((r.month as number) / 12);
                    return (
                      <tr key={r.month as number} className="border-b border-[var(--border-color)] transition-colors last:border-0 hover:bg-[var(--surface2)]">
                        <td className="px-3 py-2.5 font-medium text-[var(--text)]">Ano {yr}</td>
                        {projection.perAsset.map((pa) => (
                          <td key={pa.asset.id} className="px-3 py-2.5 text-right font-mono tabular-nums text-[var(--text-sub)]">
                            {formatCurrency((r[pa.asset.id] as number) / 100)}
                          </td>
                        ))}
                        <td className="px-3 py-2.5 text-right font-mono tabular-nums text-[var(--text)]">{formatCurrency((r.total as number) / 100)}</td>
                        <td className="px-3 py-2.5 text-right font-mono tabular-nums text-[var(--gold)]">{formatCurrency((r.totalTax as number) / 100)}</td>
                        <td className="px-3 py-2.5 text-right font-mono tabular-nums text-[var(--moss)]">{formatCurrency((r.totalNet as number) / 100)}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </Card>
        )}
      </div>
    </div>
  );
}

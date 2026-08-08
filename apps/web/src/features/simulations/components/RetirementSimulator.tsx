"use client";

import { useState, useMemo, useRef, useEffect } from "react";
import {
  ResponsiveContainer, ComposedChart, Area, Line, XAxis, YAxis, Tooltip,
  CartesianGrid, ReferenceLine, AreaChart,
} from "recharts";
import { Info, ChevronDown, Check } from "lucide-react";
import { cn } from "@/lib/utils";
import { Card, CardHead } from "@/components/shared/Card";
import { formatCurrency, formatCurrencyCompact } from "@/lib/utils/formatCurrency";
import { CHART_GRID, axisTick, SERIES, ChartTooltip, LegendItem } from "./simShared";
import { chartAnim } from "@/lib/config/chartAnimation";

/** Tokenised `.field` input — mono, bordered, cobalt focus halo. */
const inputCls =
  "h-11 w-full rounded-[13px] border border-[var(--border-color)] bg-[var(--surface)] px-3.5 font-mono text-[14px] tabular-nums text-[var(--text)] outline-none transition-[border-color,box-shadow] placeholder:text-[var(--text-sub)]/60 focus:border-[var(--brand-cobalt)] focus:shadow-[0_0_0_3px_color-mix(in_srgb,var(--brand-cobalt)_12%,transparent)]";

type SeriesId = "patrimonio" | "patrimonioNominal" | "aportado" | "juros";

const SERIES_COLORS = {
  patrimonio:        SERIES.moss,
  patrimonioNominal: SERIES.cobalt,
  aportado:          SERIES.gold,
  juros:             SERIES.violet,
  meta:              SERIES.clay,
  inflation:         SERIES.gold,
} as const;

const InflationTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  const v = payload[0].value as number;
  return (
    <div
      className="rounded-[13px] border border-[var(--border-color)] bg-[var(--surface)] px-3 py-2.5"
      style={{ boxShadow: "var(--shadow-md)" }}
    >
      <p className="mb-1 font-mono text-[11px] uppercase tracking-[0.08em] text-[var(--text-sub)]">{label}</p>
      <p className="font-mono text-[12px] tabular-nums" style={{ color: SERIES_COLORS.inflation }}>
        Custo de vida: {v.toFixed(1)}% do valor inicial
      </p>
    </div>
  );
};

type SeriesOption = {
  id: SeriesId;
  label: string;
  color: string;
};

const SERIES_OPTIONS: SeriesOption[] = [
  { id: "patrimonio",        label: "Patrimônio real (R$ de hoje)",          color: SERIES_COLORS.patrimonio        },
  { id: "patrimonioNominal", label: "Patrimônio nominal (com inflação)",     color: SERIES_COLORS.patrimonioNominal },
  { id: "aportado",          label: "Total aportado",                         color: SERIES_COLORS.aportado          },
  { id: "juros",             label: "Juros acumulados (reais)",               color: SERIES_COLORS.juros             },
];

function SeriesMultiSelect({
  selected, onChange,
}: {
  selected: Set<SeriesId>;
  onChange: (next: Set<SeriesId>) => void;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  function toggle(id: SeriesId) {
    const next = new Set(selected);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    onChange(next);
  }

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen(v => !v)}
        className={cn(
          "flex h-8 items-center gap-1.5 rounded-[13px] border border-[var(--border-color)] bg-[var(--surface)] px-3 text-[12px] font-medium text-[var(--text-sub)] transition-colors hover:text-[var(--text)]",
          selected.size !== SERIES_OPTIONS.length && "border-[var(--brand-accent)] text-[var(--brand-accent)]",
        )}
      >
        <span>Séries · {selected.size}/{SERIES_OPTIONS.length}</span>
        <ChevronDown size={12} strokeWidth={2} className={cn("transition-transform", open && "rotate-180")} />
      </button>

      {open && (
        <div className="absolute right-0 top-10 z-50 flex min-w-[260px] flex-col gap-px rounded-[13px] border border-[var(--border-color)] bg-[var(--surface)] p-1.5 shadow-lg">
          {SERIES_OPTIONS.map(opt => {
            const checked = selected.has(opt.id);
            return (
              <button
                key={opt.id}
                onClick={() => toggle(opt.id)}
                className="flex items-center gap-2.5 rounded-[9px] px-2 py-2 text-left transition-colors hover:bg-[var(--surface2)]"
              >
                <span
                  className={cn(
                    "flex h-4 w-4 shrink-0 items-center justify-center rounded border transition-colors",
                    checked ? "border-[var(--brand-accent)] text-[var(--brand-accent)]" : "border-[var(--border-color)] text-transparent",
                  )}
                  style={checked ? { background: "color-mix(in srgb, var(--brand-accent) 15%, transparent)" } : undefined}
                >
                  <Check size={10} strokeWidth={3} />
                </span>
                <span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ backgroundColor: opt.color }} />
                <span className={cn("text-[12px]", checked ? "text-[var(--text)] font-medium" : "text-[var(--text-sub)]")}>
                  {opt.label}
                </span>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

type ChartPoint = {
  label: string;
  patrimonio:        number; // real (today's purchasing power)
  patrimonioNominal: number; // nominal (actual R$ in the account in year N)
  aportado:          number; // sum of contributions (no inflation adjustment)
  juros:             number; // real interest accumulated
  custoVidaPct:      number; // cumulative inflation as % of year-0 cost of living (100 = baseline)
};

export const RetirementSimulator = () => {
  const [currentPatrimony, setCurrentPatrimony] = useState("50000");
  const [monthlyContrib,   setMonthlyContrib]   = useState("2000");
  const [annualReturn,     setAnnualReturn]      = useState("10");
  const [inflation,        setInflation]         = useState("4");
  const [withdrawalRate,   setWithdrawalRate]    = useState("4");
  const [monthlyExpenses,  setMonthlyExpenses]   = useState("8000");
  const [visibleSeries,    setVisibleSeries]     = useState<Set<SeriesId>>(
    () => new Set<SeriesId>(["patrimonio", "patrimonioNominal", "aportado", "juros"]),
  );

  const results = useMemo(() => {
    const P0    = parseFloat(currentPatrimony.replace(",", ".")) * 100 || 0;
    const mc    = parseFloat(monthlyContrib.replace(",",   ".")) * 100 || 0;
    const rNom  = (parseFloat(annualReturn.replace(",", ".")) || 0) / 100;
    const infl  = (parseFloat(inflation.replace(",", ".")) || 0) / 100;
    const wr    = (parseFloat(withdrawalRate.replace(",",  ".")) || 4) / 100;
    const exp   = parseFloat(monthlyExpenses.replace(",",  ".")) * 100 || 0;

    if (!rNom || !exp) return null;

    // Real (inflation-adjusted) annual return — everything is expressed in today's purchasing power
    const rReal = (1 + rNom) / (1 + infl) - 1;

    const annualExpenses = exp * 12;
    const fiTarget       = annualExpenses / wr;
    const monthlyRate    = (1 + rReal) ** (1 / 12) - 1;

    let patrimony = P0;
    let months    = 0;
    const MAX_MONTHS = 600;
    const points: ChartPoint[] = [];

    while (patrimony < fiTarget && months < MAX_MONTHS) {
      patrimony = patrimony * (1 + monthlyRate) + mc;
      months++;
      if (months % 12 === 0) {
        const yr        = months / 12;
        const aportado  = P0 + mc * months;
        const juros     = patrimony - aportado;
        const inflMult  = (1 + infl) ** yr;
        const nominal   = patrimony * inflMult;
        points.push({
          label:             `Ano ${yr}`,
          patrimonio:        patrimony,
          patrimonioNominal: nominal,
          aportado,
          juros:             Math.max(0, juros),
          custoVidaPct:      inflMult * 100,
        });
      }
    }

    const years     = months < MAX_MONTHS ? Math.floor(months / 12) : null;
    const monthsRem = months < MAX_MONTHS ? months % 12 : null;
    const monthlyPassive        = (fiTarget * wr) / 12;
    const currentMonthlyPassive = (P0 * wr) / 12;
    const progressPct = Math.min((P0 / fiTarget) * 100, 100);

    return {
      fiTarget, years, monthsRem, monthlyPassive, currentMonthlyPassive,
      monthlyExpensesVal: exp, points, reached: months < MAX_MONTHS, progressPct,
      realReturnPct: rReal * 100,
    };
  }, [currentPatrimony, monthlyContrib, annualReturn, inflation, withdrawalRate, monthlyExpenses]);

  return (
    <div className="flex flex-col gap-4">
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-[320px_1fr]">

        {/* Left: params + result card */}
        <div className="flex flex-col gap-4">
          <Card>
            <CardHead title="Parâmetros" />
            <div className="flex flex-col gap-3">
              <div>
                <label className="mb-2 block font-mono text-[11px] uppercase tracking-[0.1em] text-[var(--text-sub)]">Patrimônio atual (R$)</label>
                <input className={inputCls} value={currentPatrimony} onChange={(e) => setCurrentPatrimony(e.target.value)} placeholder="50000" />
              </div>
              <div>
                <label className="mb-2 block font-mono text-[11px] uppercase tracking-[0.1em] text-[var(--text-sub)]">Aporte mensal (R$)</label>
                <input className={inputCls} value={monthlyContrib} onChange={(e) => setMonthlyContrib(e.target.value)} placeholder="2000" />
              </div>
              <div>
                <label className="mb-2 block font-mono text-[11px] uppercase tracking-[0.1em] text-[var(--text-sub)]">Retorno anual esperado (% a.a.)</label>
                <input className={inputCls} value={annualReturn} onChange={(e) => setAnnualReturn(e.target.value)} placeholder="10" />
              </div>
              <div>
                <label className="mb-2 block font-mono text-[11px] uppercase tracking-[0.1em] text-[var(--text-sub)]">Inflação anual esperada (% a.a.)</label>
                <input className={inputCls} value={inflation} onChange={(e) => setInflation(e.target.value)} placeholder="4" />
              </div>
              <div>
                <label className="mb-2 block font-mono text-[11px] uppercase tracking-[0.1em] text-[var(--text-sub)]">Taxa de retirada (% a.a.)</label>
                <input className={inputCls} value={withdrawalRate} onChange={(e) => setWithdrawalRate(e.target.value)} placeholder="4" />
              </div>
              <div>
                <label className="mb-2 block font-mono text-[11px] uppercase tracking-[0.1em] text-[var(--text-sub)]">Despesas mensais alvo (R$)</label>
                <input className={inputCls} value={monthlyExpenses} onChange={(e) => setMonthlyExpenses(e.target.value)} placeholder="8000" />
              </div>
            </div>
          </Card>

          {/* Result card — cobalt gradient */}
          {results && (
            <div
              className="rounded-[20px] border p-5"
              style={{
                background: "linear-gradient(135deg, color-mix(in srgb, var(--brand-cobalt) 14%, transparent), color-mix(in srgb, var(--brand-cobalt) 6%, transparent))",
                borderColor: "color-mix(in srgb, var(--brand-cobalt) 30%, transparent)",
              }}
            >
              <div className="mb-3 font-mono text-[11px] uppercase tracking-[0.18em]" style={{ color: "var(--brand-cobalt)" }}>
                INDEPENDÊNCIA FINANCEIRA
              </div>

              {/* Main value: years to retire */}
              <p className="font-mono text-[36px] font-bold leading-none tabular-nums text-[var(--text)]">
                {results.reached
                  ? `${results.years} anos`
                  : "Inatingível"}
              </p>
              {results.reached && results.monthsRem! > 0 && (
                <p className="mt-1 text-[12px] text-[var(--text-sub)]">
                  e {results.monthsRem} {results.monthsRem === 1 ? "mês" : "meses"}
                </p>
              )}

              <div className="mt-4 flex flex-col gap-2.5">
                {[
                  { label: "Patrimônio alvo (FI)",   value: formatCurrency((results.fiTarget) / 100),           color: "var(--brand-cobalt)" },
                  { label: "Renda passiva mensal",    value: formatCurrency(results.monthlyPassive / 100),        color: "var(--moss)"  },
                  { label: "Renda atual do patrimônio", value: formatCurrency(results.currentMonthlyPassive / 100), color: "var(--text-sub)" },
                  { label: "Retorno real (desc. inflação)", value: `${results.realReturnPct.toFixed(2)}% a.a.`, color: "var(--gold)" },
                  { label: `Regra dos ${withdrawalRate}% ao ano`, value: `${withdrawalRate}% a.a.`,             color: "var(--brand-accent)"   },
                ].map(({ label, value, color }) => (
                  <div key={label} className="flex justify-between text-[12px]">
                    <span className="text-[var(--text-sub)]">{label}</span>
                    <span className="font-mono tabular-nums" style={{ color }}>{value}</span>
                  </div>
                ))}

                {/* Progress bar */}
                <div className="mt-1">
                  <div className="mb-1 flex justify-between text-[11px]">
                    <span className="text-[var(--text-sub)]">Progresso atual</span>
                    <span className="font-mono tabular-nums" style={{ color: "var(--brand-cobalt)" }}>{results.progressPct.toFixed(1)}%</span>
                  </div>
                  <div className="h-2 w-full overflow-hidden rounded-full" style={{ backgroundColor: "color-mix(in srgb, var(--brand-cobalt) 20%, transparent)" }}>
                    <div
                      className="h-full rounded-full transition-all"
                      style={{ width: `${results.progressPct}%`, backgroundColor: "var(--brand-cobalt)" }}
                    />
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Right: chart + methodology */}
        <div className="flex flex-col gap-4">
          {/* Chart card */}
          <Card className="flex flex-col">
            <div className="flex items-start justify-between gap-3">
              <CardHead className="mb-0" title="Evolução Patrimonial" subtitle="Patrimônio real em R$ de hoje vs. nominal (R$ futuros)" />
              <SeriesMultiSelect selected={visibleSeries} onChange={setVisibleSeries} />
            </div>
            {results && results.points.length > 0 ? (
              <>
                <div className="mt-4 flex-1" style={{ minHeight: 280 }}>
                  <ResponsiveContainer width="100%" height={280}>
                    <ComposedChart data={results.points} margin={{ top: 4, right: 4, left: 0, bottom: 0 }}>
                      <defs>
                        <linearGradient id="ret_gradP" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%"  stopColor={SERIES_COLORS.patrimonio}        stopOpacity={0.2} />
                          <stop offset="95%" stopColor={SERIES_COLORS.patrimonio}        stopOpacity={0}   />
                        </linearGradient>
                        <linearGradient id="ret_gradN" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%"  stopColor={SERIES_COLORS.patrimonioNominal} stopOpacity={0.18} />
                          <stop offset="95%" stopColor={SERIES_COLORS.patrimonioNominal} stopOpacity={0}    />
                        </linearGradient>
                        <linearGradient id="ret_gradA" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%"  stopColor={SERIES_COLORS.aportado}          stopOpacity={0.15} />
                          <stop offset="95%" stopColor={SERIES_COLORS.aportado}          stopOpacity={0}    />
                        </linearGradient>
                      </defs>
                      <CartesianGrid {...CHART_GRID} />
                      <XAxis dataKey="label" tick={axisTick} axisLine={false} tickLine={false} interval="preserveStartEnd" />
                      <YAxis tick={axisTick} axisLine={false} tickLine={false} tickFormatter={(v) => formatCurrencyCompact(v / 100)} width={72} />
                      <Tooltip content={<ChartTooltip />} />
                      {/* Meta FI */}
                      <ReferenceLine
                        y={results.fiTarget}
                        stroke={SERIES_COLORS.meta}
                        strokeDasharray="5 3"
                        strokeWidth={1.5}
                        label={{ value: "Meta FI", fill: SERIES_COLORS.meta, fontSize: 11, position: "insideTopRight" }}
                      />

                      {visibleSeries.has("aportado") && (
                        <Area
                          {...chartAnim(0)}
                          type="monotone"
                          dataKey="aportado"
                          name="Total aportado"
                          stroke={SERIES_COLORS.aportado}
                          strokeWidth={2}
                          fill="url(#ret_gradA)"
                          dot={{ r: 5, fill: SERIES_COLORS.aportado, stroke: "var(--surface)", strokeWidth: 2 }}
                          activeDot={{ r: 7, fill: SERIES_COLORS.aportado, stroke: "var(--surface)", strokeWidth: 2 }}
                        />
                      )}

                      {visibleSeries.has("patrimonioNominal") && (
                        <Area
                          {...chartAnim(1)}
                          type="monotone"
                          dataKey="patrimonioNominal"
                          name="Patrimônio nominal"
                          stroke={SERIES_COLORS.patrimonioNominal}
                          strokeWidth={2}
                          strokeDasharray="4 2"
                          fill="url(#ret_gradN)"
                          dot={{ r: 5, fill: SERIES_COLORS.patrimonioNominal, stroke: "var(--surface)", strokeWidth: 2 }}
                          activeDot={{ r: 7, fill: SERIES_COLORS.patrimonioNominal, stroke: "var(--surface)", strokeWidth: 2 }}
                        />
                      )}

                      {visibleSeries.has("patrimonio") && (
                        <Area
                          {...chartAnim(2)}
                          type="monotone"
                          dataKey="patrimonio"
                          name="Patrimônio real"
                          stroke={SERIES_COLORS.patrimonio}
                          strokeWidth={2}
                          fill="url(#ret_gradP)"
                          dot={{ r: 5, fill: SERIES_COLORS.patrimonio, stroke: "var(--surface)", strokeWidth: 2 }}
                          activeDot={{ r: 7, fill: SERIES_COLORS.patrimonio, stroke: "var(--surface)", strokeWidth: 2 }}
                        />
                      )}

                      {visibleSeries.has("juros") && (
                        <Line
                          {...chartAnim(3)}
                          type="monotone"
                          dataKey="juros"
                          name="Juros acumulados"
                          stroke={SERIES_COLORS.juros}
                          strokeWidth={1.5}
                          strokeDasharray="5 3"
                          dot={{ r: 5, fill: SERIES_COLORS.juros, stroke: "var(--surface)", strokeWidth: 2 }}
                          activeDot={{ r: 7, fill: SERIES_COLORS.juros, stroke: "var(--surface)", strokeWidth: 2 }}
                        />
                      )}
                    </ComposedChart>
                  </ResponsiveContainer>
                </div>

                {/* Legend */}
                <div className="mt-3 flex flex-wrap gap-4">
                  {[
                    visibleSeries.has("patrimonio")        && [SERIES_COLORS.patrimonio,        "Patrimônio real (R$ de hoje)"],
                    visibleSeries.has("patrimonioNominal") && [SERIES_COLORS.patrimonioNominal, "Patrimônio nominal"],
                    visibleSeries.has("aportado")          && [SERIES_COLORS.aportado,          "Total aportado"],
                    visibleSeries.has("juros")             && [SERIES_COLORS.juros,             "Juros acumulados"],
                                                              [SERIES_COLORS.meta,              "Meta FI"],
                  ]
                    .filter(Boolean)
                    .map((entry) => {
                      const [color, label] = entry as [string, string];
                      return <LegendItem key={label} color={color}>{label}</LegendItem>;
                    })}
                </div>

                {/* Inflation companion chart */}
                <div className="mt-5 border-t border-[var(--border-color)] pt-4">
                  <div className="mb-2 flex items-baseline justify-between">
                    <div>
                      <p className="font-display text-[13px] font-bold tracking-[-0.01em] text-[var(--text)]">Curva de inflação acumulada</p>
                      <p className="text-[11px] text-[var(--text-sub)]">
                        Quanto custará R$ 100 de hoje em cada ano, com inflação de {inflation}% a.a.
                      </p>
                    </div>
                    {results.points.length > 0 && (
                      <span className="font-mono text-[12px] tabular-nums" style={{ color: SERIES_COLORS.inflation }}>
                        {results.points[results.points.length - 1].custoVidaPct.toFixed(0)}% no ano {results.points.length}
                      </span>
                    )}
                  </div>
                  <div style={{ height: 120 }}>
                    <ResponsiveContainer width="100%" height={120}>
                      <AreaChart data={results.points} margin={{ top: 4, right: 4, left: 0, bottom: 0 }}>
                        <defs>
                          <linearGradient id="ret_gradI" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%"  stopColor={SERIES_COLORS.inflation} stopOpacity={0.25} />
                            <stop offset="95%" stopColor={SERIES_COLORS.inflation} stopOpacity={0}    />
                          </linearGradient>
                        </defs>
                        <CartesianGrid {...CHART_GRID} />
                        <XAxis dataKey="label" tick={axisTick} axisLine={false} tickLine={false} interval="preserveStartEnd" />
                        <YAxis tick={axisTick} axisLine={false} tickLine={false} tickFormatter={(v) => `${v.toFixed(0)}%`} width={48} />
                        <Tooltip content={<InflationTooltip />} />
                        <ReferenceLine y={100} stroke="var(--text-sub)" strokeDasharray="3 3" strokeWidth={1} />
                        <Area
                          {...chartAnim(0)}
                          type="monotone"
                          dataKey="custoVidaPct"
                          name="Custo de vida"
                          stroke={SERIES_COLORS.inflation}
                          strokeWidth={2}
                          fill="url(#ret_gradI)"
                          dot={false}
                          activeDot={{ r: 5, fill: SERIES_COLORS.inflation, stroke: "var(--surface)", strokeWidth: 2 }}
                        />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </>
            ) : (
              <div className="flex flex-1 items-center justify-center py-16">
                <p className="text-[13px] text-[var(--text-sub)]">Preencha os parâmetros para ver a projeção</p>
              </div>
            )}
          </Card>

          {/* Methodology card */}
          <Card>
            <div className="mb-3 flex items-center gap-2">
              <Info size={14} className="shrink-0 text-[var(--brand-accent)]" />
              <p className="font-display text-[15px] font-bold tracking-[-0.01em] text-[var(--text)]">Metodologia — Regra dos 4% (ajustada à inflação)</p>
            </div>
            <div className="flex flex-col gap-3">
              {[
                {
                  title: "Como é calculado?",
                  body: results
                    ? `Patrimônio-alvo = Despesas anuais ÷ Taxa de retirada. A simulação usa o retorno real (retorno − inflação) para projetar tudo em poder de compra de hoje. Com ${withdrawalRate}% a.a. e R$ ${monthlyExpenses}/mês de gastos, o alvo é ${formatCurrency(results.fiTarget / 100)} e o retorno real efetivo é ${results.realReturnPct.toFixed(2)}% a.a.`
                    : "Patrimônio-alvo = Despesas anuais ÷ Taxa de retirada. A simulação usa o retorno real (retorno − inflação) para manter tudo em valores de hoje.",
                },
                {
                  title: "Patrimônio atual",
                  body: "Quanto você já acumulou hoje, somando reservas, investimentos e ativos líquidos. É o ponto de partida da curva.",
                },
                {
                  title: "Aporte mensal",
                  body: "Valor constante que você investe todo mês, em reais de hoje. O modelo assume que esse aporte se mantém no mesmo poder de compra (na prática, você ajustaria o valor nominal pela inflação a cada ano).",
                },
                {
                  title: "Retorno anual esperado",
                  body: "Rentabilidade nominal bruta esperada dos seus investimentos ao ano — antes de descontar a inflação. Ex.: 10% para uma carteira diversificada.",
                },
                {
                  title: "Inflação anual esperada",
                  body: "Quanto o custo de vida deve subir por ano. O simulador desconta a inflação do retorno (retorno real ≈ retorno − inflação) para que o patrimônio e a renda passiva projetada apareçam em R$ de hoje.",
                },
                {
                  title: "Taxa de retirada (Regra dos 4%)",
                  body: "Porcentagem do patrimônio que você saca por ano para viver. O estudo Trinity (1998) mostrou que sacar 4% a.a. sustenta o patrimônio por 30+ anos com alta probabilidade. Taxas menores (3–3,5%) aumentam a margem de segurança; maiores (5%+) reduzem a longevidade da carteira.",
                },
                {
                  title: "Despesas mensais alvo",
                  body: "Quanto você quer gastar por mês na aposentadoria, em R$ de hoje. Multiplicado por 12 e dividido pela taxa de retirada, define o patrimônio-alvo.",
                },
              ].map((item) => (
                <div key={item.title} className="rounded-[13px] border border-[var(--border-color)] bg-[var(--surface2)] p-3.5">
                  <p className="mb-1.5 text-[13px] font-medium text-[var(--text)]">{item.title}</p>
                  <p className="text-[12px] leading-relaxed text-[var(--text-sub)]">{item.body}</p>
                </div>
              ))}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
};

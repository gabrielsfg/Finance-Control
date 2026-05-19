"use client";

import { useState, useMemo, useRef, useEffect } from "react";
import {
  ResponsiveContainer, ComposedChart, Area, Line, XAxis, YAxis, Tooltip,
  CartesianGrid, ReferenceLine, AreaChart,
} from "recharts";
import { Info, ChevronDown, Check } from "lucide-react";
import { cn } from "@/lib/utils";
import { SectionHeader } from "@/components/shared/SectionHeader";
import { formatCurrency, formatCurrencyCompact } from "@/lib/utils/formatCurrency";

const inputCls = "border-border bg-surface2 text-text placeholder:text-text-muted w-full rounded-lg border h-9 px-3 text-[13px] outline-none focus:border-green/60 transition-colors";

const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="border-border bg-surface rounded-lg border px-3 py-2.5 shadow-md min-w-[210px]">
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

type SeriesId = "patrimonio" | "patrimonioNominal" | "aportado" | "juros";

const InflationTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  const v = payload[0].value as number;
  return (
    <div className="border-border bg-surface rounded-lg border px-3 py-2.5 shadow-md">
      <p className="text-text-muted mb-1 text-[11px]">{label}</p>
      <p className="font-money text-[12px]" style={{ color: "var(--orange)" }}>
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
  { id: "patrimonio",        label: "Patrimônio real (R$ de hoje)",          color: "var(--green)"  },
  { id: "patrimonioNominal", label: "Patrimônio nominal (com inflação)",     color: "var(--cyan)"   },
  { id: "aportado",          label: "Total aportado",                         color: "var(--yellow)" },
  { id: "juros",             label: "Juros acumulados (reais)",               color: "var(--blue)"   },
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
          "border-border bg-surface2 text-text-sub hover:text-text flex h-8 items-center gap-1.5 rounded-lg border px-3 text-[12px] font-medium transition-colors",
          selected.size !== SERIES_OPTIONS.length && "border-green/40 text-green",
        )}
      >
        <span>Séries · {selected.size}/{SERIES_OPTIONS.length}</span>
        <ChevronDown size={12} strokeWidth={2} className={cn("transition-transform", open && "rotate-180")} />
      </button>

      {open && (
        <div className="border-border bg-surface absolute right-0 top-10 z-50 flex min-w-[260px] flex-col gap-px rounded-xl border p-1.5 shadow-lg">
          {SERIES_OPTIONS.map(opt => {
            const checked = selected.has(opt.id);
            return (
              <button
                key={opt.id}
                onClick={() => toggle(opt.id)}
                className="flex items-center gap-2.5 rounded-lg px-2 py-2 text-left transition-colors hover:bg-surface2"
              >
                <span className={cn(
                  "flex h-4 w-4 shrink-0 items-center justify-center rounded border transition-colors",
                  checked ? "border-green bg-green/15 text-green" : "border-border text-transparent",
                )}>
                  <Check size={10} strokeWidth={3} />
                </span>
                <span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ backgroundColor: opt.color }} />
                <span className={cn("text-[12px]", checked ? "text-text font-medium" : "text-text-sub")}>
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
          <div className="border-border bg-surface rounded-xl border p-5">
            <SectionHeader title="Parâmetros" />
            <div className="flex flex-col gap-3 mt-4">
              <div>
                <label className="text-text-muted mb-1.5 block text-[12px]">Patrimônio atual (R$)</label>
                <input className={inputCls} value={currentPatrimony} onChange={(e) => setCurrentPatrimony(e.target.value)} placeholder="50000" />
              </div>
              <div>
                <label className="text-text-muted mb-1.5 block text-[12px]">Aporte mensal (R$)</label>
                <input className={inputCls} value={monthlyContrib} onChange={(e) => setMonthlyContrib(e.target.value)} placeholder="2000" />
              </div>
              <div>
                <label className="text-text-muted mb-1.5 block text-[12px]">Retorno anual esperado (% a.a.)</label>
                <input className={inputCls} value={annualReturn} onChange={(e) => setAnnualReturn(e.target.value)} placeholder="10" />
              </div>
              <div>
                <label className="text-text-muted mb-1.5 block text-[12px]">Inflação anual esperada (% a.a.)</label>
                <input className={inputCls} value={inflation} onChange={(e) => setInflation(e.target.value)} placeholder="4" />
              </div>
              <div>
                <label className="text-text-muted mb-1.5 block text-[12px]">Taxa de retirada (% a.a.)</label>
                <input className={inputCls} value={withdrawalRate} onChange={(e) => setWithdrawalRate(e.target.value)} placeholder="4" />
              </div>
              <div>
                <label className="text-text-muted mb-1.5 block text-[12px]">Despesas mensais alvo (R$)</label>
                <input className={inputCls} value={monthlyExpenses} onChange={(e) => setMonthlyExpenses(e.target.value)} placeholder="8000" />
              </div>
            </div>
          </div>

          {/* Result card — purple gradient like the design */}
          {results && (
            <div
              className="rounded-xl border p-5"
              style={{
                background: "linear-gradient(135deg, color-mix(in srgb, var(--purple) 14%, transparent), color-mix(in srgb, var(--purple) 6%, transparent))",
                borderColor: "color-mix(in srgb, var(--purple) 30%, transparent)",
              }}
            >
              <div className="text-[11px] font-semibold tracking-widest mb-3" style={{ color: "var(--purple)" }}>
                INDEPENDÊNCIA FINANCEIRA
              </div>

              {/* Main value: years to retire */}
              <p className="font-money text-[36px] font-bold text-text leading-none">
                {results.reached
                  ? `${results.years} anos`
                  : "Inatingível"}
              </p>
              {results.reached && results.monthsRem! > 0 && (
                <p className="text-text-muted text-[12px] mt-1">
                  e {results.monthsRem} {results.monthsRem === 1 ? "mês" : "meses"}
                </p>
              )}

              <div className="mt-4 flex flex-col gap-2.5">
                {[
                  { label: "Patrimônio alvo (FI)",   value: formatCurrency((results.fiTarget) / 100),           color: "var(--purple)" },
                  { label: "Renda passiva mensal",    value: formatCurrency(results.monthlyPassive / 100),        color: "var(--green)"  },
                  { label: "Renda atual do patrimônio", value: formatCurrency(results.currentMonthlyPassive / 100), color: "var(--text-sub)" },
                  { label: "Retorno real (desc. inflação)", value: `${results.realReturnPct.toFixed(2)}% a.a.`, color: "var(--orange)" },
                  { label: `Regra dos ${withdrawalRate}% ao ano`, value: `${withdrawalRate}% a.a.`,             color: "var(--blue)"   },
                ].map(({ label, value, color }) => (
                  <div key={label} className="flex justify-between text-[12px]">
                    <span className="text-text-muted">{label}</span>
                    <span className="font-money" style={{ color }}>{value}</span>
                  </div>
                ))}

                {/* Progress bar */}
                <div className="mt-1">
                  <div className="flex justify-between text-[11px] mb-1">
                    <span className="text-text-muted">Progresso atual</span>
                    <span className="font-money" style={{ color: "var(--purple)" }}>{results.progressPct.toFixed(1)}%</span>
                  </div>
                  <div className="h-2 w-full rounded-full overflow-hidden" style={{ backgroundColor: "color-mix(in srgb, var(--purple) 20%, transparent)" }}>
                    <div
                      className="h-full rounded-full transition-all"
                      style={{ width: `${results.progressPct}%`, backgroundColor: "var(--purple)" }}
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
          <div className="border-border bg-surface rounded-xl border p-5 flex flex-col">
            <div className="flex items-start justify-between gap-3">
              <SectionHeader title="Evolução Patrimonial" subtitle="Patrimônio real em R$ de hoje vs. nominal (R$ futuros)" />
              <SeriesMultiSelect selected={visibleSeries} onChange={setVisibleSeries} />
            </div>
            {results && results.points.length > 0 ? (
              <>
                <div className="mt-4 flex-1" style={{ minHeight: 280 }}>
                  <ResponsiveContainer width="100%" height={280}>
                    <ComposedChart data={results.points} margin={{ top: 4, right: 4, left: 0, bottom: 0 }}>
                      <defs>
                        <linearGradient id="ret_gradP" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%"  stopColor="var(--green)"  stopOpacity={0.2} />
                          <stop offset="95%" stopColor="var(--green)"  stopOpacity={0}   />
                        </linearGradient>
                        <linearGradient id="ret_gradN" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%"  stopColor="var(--cyan)"   stopOpacity={0.18} />
                          <stop offset="95%" stopColor="var(--cyan)"   stopOpacity={0}    />
                        </linearGradient>
                        <linearGradient id="ret_gradA" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%"  stopColor="var(--yellow)" stopOpacity={0.15} />
                          <stop offset="95%" stopColor="var(--yellow)" stopOpacity={0}    />
                        </linearGradient>
                      </defs>
                      <CartesianGrid stroke="var(--border-chart)" />
                      <XAxis dataKey="label" tick={{ fill: "var(--text-muted)", fontSize: 11, fontFamily: "DM Sans" }} axisLine={false} tickLine={false} interval="preserveStartEnd" />
                      <YAxis tick={{ fill: "var(--text-muted)", fontSize: 11, fontFamily: "JetBrains Mono" }} axisLine={false} tickLine={false} tickFormatter={(v) => formatCurrencyCompact(v / 100)} width={72} />
                      <Tooltip content={<CustomTooltip />} />
                      {/* Meta FI */}
                      <ReferenceLine
                        y={results.fiTarget}
                        stroke="var(--purple)"
                        strokeDasharray="5 3"
                        strokeWidth={1.5}
                        label={{ value: "Meta FI", fill: "var(--purple)", fontSize: 11, position: "insideTopRight" }}
                      />

                      {visibleSeries.has("aportado") && (
                        <Area
                          type="monotone"
                          dataKey="aportado"
                          name="Total aportado"
                          stroke="var(--yellow)"
                          strokeWidth={2}
                          fill="url(#ret_gradA)"
                          dot={{ r: 5, fill: "var(--yellow)", stroke: "var(--surface)", strokeWidth: 2 }}
                          activeDot={{ r: 7, fill: "var(--yellow)", stroke: "var(--surface)", strokeWidth: 2 }}
                        />
                      )}

                      {visibleSeries.has("patrimonioNominal") && (
                        <Area
                          type="monotone"
                          dataKey="patrimonioNominal"
                          name="Patrimônio nominal"
                          stroke="var(--cyan)"
                          strokeWidth={2}
                          strokeDasharray="4 2"
                          fill="url(#ret_gradN)"
                          dot={{ r: 5, fill: "var(--cyan)", stroke: "var(--surface)", strokeWidth: 2 }}
                          activeDot={{ r: 7, fill: "var(--cyan)", stroke: "var(--surface)", strokeWidth: 2 }}
                        />
                      )}

                      {visibleSeries.has("patrimonio") && (
                        <Area
                          type="monotone"
                          dataKey="patrimonio"
                          name="Patrimônio real"
                          stroke="var(--green)"
                          strokeWidth={2}
                          fill="url(#ret_gradP)"
                          dot={{ r: 5, fill: "var(--green)", stroke: "var(--surface)", strokeWidth: 2 }}
                          activeDot={{ r: 7, fill: "var(--green)", stroke: "var(--surface)", strokeWidth: 2 }}
                        />
                      )}

                      {visibleSeries.has("juros") && (
                        <Line
                          type="monotone"
                          dataKey="juros"
                          name="Juros acumulados"
                          stroke="var(--blue)"
                          strokeWidth={1.5}
                          strokeDasharray="5 3"
                          dot={{ r: 5, fill: "var(--blue)", stroke: "var(--surface)", strokeWidth: 2 }}
                          activeDot={{ r: 7, fill: "var(--blue)", stroke: "var(--surface)", strokeWidth: 2 }}
                        />
                      )}
                    </ComposedChart>
                  </ResponsiveContainer>
                </div>

                {/* Legend */}
                <div className="mt-3 flex flex-wrap gap-4">
                  {[
                    visibleSeries.has("patrimonio")        && ["var(--green)",  "Patrimônio real (R$ de hoje)"],
                    visibleSeries.has("patrimonioNominal") && ["var(--cyan)",   "Patrimônio nominal"],
                    visibleSeries.has("aportado")          && ["var(--yellow)", "Total aportado"],
                    visibleSeries.has("juros")             && ["var(--blue)",   "Juros acumulados"],
                                                              ["var(--purple)", "Meta FI"],
                  ]
                    .filter(Boolean)
                    .map((entry) => {
                      const [color, label] = entry as [string, string];
                      return (
                        <div key={label} className="flex items-center gap-1.5">
                          <div className="h-2.5 w-2.5 rounded-[2px]" style={{ backgroundColor: color }} />
                          <span className="text-text-muted text-[12px]">{label}</span>
                        </div>
                      );
                    })}
                </div>

                {/* Inflation companion chart */}
                <div className="border-border mt-5 border-t pt-4">
                  <div className="mb-2 flex items-baseline justify-between">
                    <div>
                      <p className="text-text text-[13px] font-semibold">Curva de inflação acumulada</p>
                      <p className="text-text-muted text-[11px]">
                        Quanto custará R$ 100 de hoje em cada ano, com inflação de {inflation}% a.a.
                      </p>
                    </div>
                    {results.points.length > 0 && (
                      <span className="font-money text-orange text-[12px]">
                        {results.points[results.points.length - 1].custoVidaPct.toFixed(0)}% no ano {results.points.length}
                      </span>
                    )}
                  </div>
                  <div style={{ height: 120 }}>
                    <ResponsiveContainer width="100%" height={120}>
                      <AreaChart data={results.points} margin={{ top: 4, right: 4, left: 0, bottom: 0 }}>
                        <defs>
                          <linearGradient id="ret_gradI" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%"  stopColor="var(--orange)" stopOpacity={0.25} />
                            <stop offset="95%" stopColor="var(--orange)" stopOpacity={0}    />
                          </linearGradient>
                        </defs>
                        <CartesianGrid stroke="var(--border-chart)" />
                        <XAxis dataKey="label" tick={{ fill: "var(--text-muted)", fontSize: 10, fontFamily: "DM Sans" }} axisLine={false} tickLine={false} interval="preserveStartEnd" />
                        <YAxis tick={{ fill: "var(--text-muted)", fontSize: 10, fontFamily: "JetBrains Mono" }} axisLine={false} tickLine={false} tickFormatter={(v) => `${v.toFixed(0)}%`} width={48} />
                        <Tooltip content={<InflationTooltip />} />
                        <ReferenceLine y={100} stroke="var(--text-muted)" strokeDasharray="3 3" strokeWidth={1} />
                        <Area
                          type="monotone"
                          dataKey="custoVidaPct"
                          name="Custo de vida"
                          stroke="var(--orange)"
                          strokeWidth={2}
                          fill="url(#ret_gradI)"
                          dot={false}
                          activeDot={{ r: 5, fill: "var(--orange)", stroke: "var(--surface)", strokeWidth: 2 }}
                        />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </>
            ) : (
              <div className="flex flex-1 items-center justify-center py-16">
                <p className="text-text-muted text-[13px]">Preencha os parâmetros para ver a projeção</p>
              </div>
            )}
          </div>

          {/* Methodology card */}
          <div className="border-border bg-surface rounded-xl border p-5">
            <div className="mb-3 flex items-center gap-2">
              <Info size={14} className="text-blue shrink-0" />
              <p className="text-text text-[13px] font-semibold">Metodologia — Regra dos 4% (ajustada à inflação)</p>
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
                <div key={item.title} className="rounded-lg border border-border bg-surface2 p-3.5">
                  <p className="text-text text-[13px] font-medium mb-1.5">{item.title}</p>
                  <p className="text-text-muted text-[12px] leading-relaxed">{item.body}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

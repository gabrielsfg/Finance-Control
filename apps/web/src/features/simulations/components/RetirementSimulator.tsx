"use client";

import { useState, useMemo } from "react";
import {
  ResponsiveContainer, ComposedChart, Area, Line, XAxis, YAxis, Tooltip,
  CartesianGrid, ReferenceLine,
} from "recharts";
import { Info } from "lucide-react";
import { SectionHeader } from "@/components/shared/SectionHeader";
import { formatCurrency, formatCurrencyCompact } from "@/lib/utils/formatCurrency";
import { cn } from "@/lib/utils";

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

type ChartPoint = {
  label: string;
  patrimonio: number;
  aportado: number;
  juros: number;
};

export const RetirementSimulator = () => {
  const [currentPatrimony, setCurrentPatrimony] = useState("50000");
  const [monthlyContrib,   setMonthlyContrib]   = useState("2000");
  const [annualReturn,     setAnnualReturn]      = useState("10");
  const [withdrawalRate,   setWithdrawalRate]    = useState("4");
  const [monthlyExpenses,  setMonthlyExpenses]   = useState("8000");

  const results = useMemo(() => {
    const P0  = parseFloat(currentPatrimony.replace(",", ".")) * 100 || 0;
    const mc  = parseFloat(monthlyContrib.replace(",",   ".")) * 100 || 0;
    const r   = (parseFloat(annualReturn.replace(",", ".")) || 0) / 100;
    const wr  = (parseFloat(withdrawalRate.replace(",",  ".")) || 4) / 100;
    const exp = parseFloat(monthlyExpenses.replace(",",  ".")) * 100 || 0;

    if (!r || !exp) return null;

    const annualExpenses = exp * 12;
    const fiTarget       = annualExpenses / wr;
    const monthlyRate    = (1 + r) ** (1 / 12) - 1;

    let patrimony = P0;
    let months    = 0;
    const MAX_MONTHS = 600;
    const points: ChartPoint[] = [];

    while (patrimony < fiTarget && months < MAX_MONTHS) {
      patrimony = patrimony * (1 + monthlyRate) + mc;
      months++;
      if (months % 12 === 0) {
        const yr       = months / 12;
        const aportado = P0 + mc * months;
        const juros    = patrimony - aportado;
        points.push({ label: `Ano ${yr}`, patrimonio: patrimony, aportado, juros: Math.max(0, juros) });
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
    };
  }, [currentPatrimony, monthlyContrib, annualReturn, withdrawalRate, monthlyExpenses]);

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
                <label className="text-text-muted mb-1.5 block text-[12px]">Retorno anual esperado (%)</label>
                <input className={inputCls} value={annualReturn} onChange={(e) => setAnnualReturn(e.target.value)} placeholder="10" />
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
            <SectionHeader title="Evolução Patrimonial" subtitle="Projeção até a independência financeira" />
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
                        <linearGradient id="ret_gradA" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%"  stopColor="var(--yellow)" stopOpacity={0.15} />
                          <stop offset="95%" stopColor="var(--yellow)" stopOpacity={0}    />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
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
                      {/* Despesas mensais como referência na renda passiva — NÃO faz sentido no mesmo eixo de patrimônio */}
                      {/* Total aportado (sem juros) */}
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
                      {/* Patrimônio total */}
                      <Area
                        type="monotone"
                        dataKey="patrimonio"
                        name="Patrimônio"
                        stroke="var(--green)"
                        strokeWidth={2}
                        fill="url(#ret_gradP)"
                        dot={{ r: 5, fill: "var(--green)", stroke: "var(--surface)", strokeWidth: 2 }}
                        activeDot={{ r: 7, fill: "var(--green)", stroke: "var(--surface)", strokeWidth: 2 }}
                      />
                      {/* Juros acumulados como linha */}
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
                    </ComposedChart>
                  </ResponsiveContainer>
                </div>

                {/* Legend */}
                <div className="mt-3 flex flex-wrap gap-4">
                  {[
                    ["var(--green)",  "Patrimônio total"],
                    ["var(--yellow)", "Total aportado"],
                    ["var(--blue)",   "Juros acumulados"],
                    ["var(--purple)", "Meta FI"],
                  ].map(([color, label]) => (
                    <div key={label} className="flex items-center gap-1.5">
                      <div className="h-2.5 w-2.5 rounded-[2px]" style={{ backgroundColor: color }} />
                      <span className="text-text-muted text-[12px]">{label}</span>
                    </div>
                  ))}
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
              <p className="text-text text-[13px] font-semibold">Metodologia — Regra dos 4%</p>
            </div>
            <div className="flex flex-col gap-3">
              {[
                {
                  title: "O que é a regra dos 4%?",
                  body: "Estudo Trinity (1998): retirar 4% do patrimônio ao ano sustenta a renda por 30+ anos com alta probabilidade, mesmo em períodos de recessão.",
                },
                {
                  title: "Como é calculado?",
                  body: results
                    ? `Patrimônio necessário = Despesas anuais ÷ Taxa de retirada. Com ${withdrawalRate}% ao ano e R$ ${monthlyExpenses}/mês de gastos, você precisa de ${formatCurrency(results.fiTarget / 100)}.`
                    : "Patrimônio necessário = Despesas anuais ÷ Taxa de retirada. Preencha os campos para ver o cálculo.",
                },
                {
                  title: "Seu aporte mensal importa",
                  body: results?.reached
                    ? `Aportando ${formatCurrency(parseFloat(monthlyContrib) * 100 / 100)}/mês à taxa de ${annualReturn}% a.a., você atinge a independência em ${results.years} anos.`
                    : "Aumente o aporte mensal ou a taxa de retorno para atingir a independência financeira dentro de 50 anos.",
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

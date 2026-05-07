"use client";

import { useState, useMemo } from "react";
import {
  ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip,
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
    <div className="border-border bg-surface rounded-lg border px-3 py-2 shadow-md min-w-[180px]">
      <p className="text-text-muted mb-1.5 text-[11px]">{label}</p>
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

type ChartPoint = {
  label: string;
  patrimonio: number;
  alvo: number;
};

export const RetirementSimulator = () => {
  const [currentPatrimony, setCurrentPatrimony] = useState("50000");
  const [monthlyContrib,   setMonthlyContrib]   = useState("2000");
  const [annualReturn,     setAnnualReturn]      = useState("10");
  const [withdrawalRate,   setWithdrawalRate]    = useState("4");
  const [monthlyExpenses,  setMonthlyExpenses]   = useState("8000");

  const results = useMemo(() => {
    const P0     = parseFloat(currentPatrimony.replace(",", ".")) * 100 || 0;
    const mc     = parseFloat(monthlyContrib.replace(",",   ".")) * 100 || 0;
    const r      = (parseFloat(annualReturn.replace(",", ".")) || 0) / 100;
    const wr     = (parseFloat(withdrawalRate.replace(",",  ".")) || 4) / 100;
    const exp    = parseFloat(monthlyExpenses.replace(",",  ".")) * 100 || 0;

    if (!r || !exp) return null;

    const annualExpenses   = exp * 12;
    const fiTarget         = annualExpenses / wr;           // patrimônio necessário para FI
    const monthlyRate      = (1 + r) ** (1 / 12) - 1;

    // How many months to reach fiTarget
    let patrimony = P0;
    let months    = 0;
    const MAX_MONTHS = 600;
    const points: ChartPoint[] = [];

    while (patrimony < fiTarget && months < MAX_MONTHS) {
      patrimony = patrimony * (1 + monthlyRate) + mc;
      months++;
      if (months % 12 === 0) {
        points.push({
          label: `Ano ${months / 12}`,
          patrimonio: patrimony,
          alvo:       fiTarget,
        });
      }
    }

    const years = months < MAX_MONTHS ? Math.floor(months / 12) : null;
    const monthsRem = months < MAX_MONTHS ? months % 12 : null;

    // Monthly passive income at FI target
    const monthlyPassive = (fiTarget * wr) / 12;

    return { fiTarget, years, monthsRem, monthlyPassive, points, reached: months < MAX_MONTHS };
  }, [currentPatrimony, monthlyContrib, annualReturn, withdrawalRate, monthlyExpenses]);

  return (
    <div className="border-border bg-surface rounded-xl border p-5">
      <SectionHeader title="Simulador de Aposentadoria" subtitle="Regra dos 4% — independência financeira" />

      {/* Inputs */}
      <div className="mb-5 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
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
          <label className="text-text-muted mb-1.5 block text-[12px]">Taxa de retirada (%)</label>
          <input className={inputCls} value={withdrawalRate} onChange={(e) => setWithdrawalRate(e.target.value)} placeholder="4" />
        </div>
        <div>
          <label className="text-text-muted mb-1.5 block text-[12px]">Despesas mensais alvo (R$)</label>
          <input className={inputCls} value={monthlyExpenses} onChange={(e) => setMonthlyExpenses(e.target.value)} placeholder="8000" />
        </div>
      </div>

      {results && (
        <>
          {/* KPI output cards */}
          <div className="bg-surface2 mb-5 grid grid-cols-2 gap-3 rounded-xl p-4 sm:grid-cols-4">
            <div>
              <p className="text-text-muted text-[11px]">Patrimônio para FI</p>
              <p className="font-money font-600 text-green text-[18px]">{formatCurrency(results.fiTarget / 100)}</p>
            </div>
            <div>
              <p className="text-text-muted text-[11px]">Tempo estimado</p>
              <p className={cn("font-money font-600 text-[18px]", results.reached ? "text-blue" : "text-orange")}>
                {results.reached
                  ? `${results.years}a ${results.monthsRem}m`
                  : "Não atingível"}
              </p>
            </div>
            <div>
              <p className="text-text-muted text-[11px]">Renda passiva mensal</p>
              <p className="font-money font-600 text-purple text-[18px]">{formatCurrency(results.monthlyPassive / 100)}</p>
            </div>
            <div>
              <p className="text-text-muted text-[11px]">Taxa de retirada</p>
              <p className="font-money font-600 text-cyan text-[18px]">{withdrawalRate}%</p>
            </div>
          </div>

          {/* Progress chart */}
          {results.points.length > 0 && (
            <>
              <p className="text-text-muted mb-3 text-[12px]">Evolução patrimonial até a independência financeira</p>
              <div style={{ height: 260 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={results.points} margin={{ top: 4, right: 4, left: 0, bottom: 0 }}>
                    <defs>
                      <linearGradient id="ret_gradP" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%"  stopColor="var(--green)" stopOpacity={0.2} />
                        <stop offset="95%" stopColor="var(--green)" stopOpacity={0}   />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                    <XAxis dataKey="label" tick={{ fill: "var(--text-muted)", fontSize: 11, fontFamily: "DM Sans" }} axisLine={false} tickLine={false} interval="preserveStartEnd" />
                    <YAxis tick={{ fill: "var(--text-muted)", fontSize: 11, fontFamily: "JetBrains Mono" }} axisLine={false} tickLine={false} tickFormatter={(v) => formatCurrencyCompact(v / 100)} width={72} />
                    <Tooltip content={<CustomTooltip />} />
                    <ReferenceLine y={results.fiTarget} stroke="var(--orange)" strokeDasharray="5 3" strokeWidth={1.5} label={{ value: "Alvo FI", fill: "var(--orange)", fontSize: 11, position: "insideTopRight" }} />
                    <Area type="monotone" dataKey="patrimonio" name="Patrimônio" stroke="var(--green)" strokeWidth={2} fill="url(#ret_gradP)" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </>
          )}
        </>
      )}

      {/* Methodology card */}
      <div className="mt-5 rounded-xl border border-blue/20 bg-blue/5 p-4">
        <div className="mb-2 flex items-center gap-2">
          <Info size={14} className="text-blue shrink-0" />
          <p className="text-text text-[13px] font-medium">Metodologia — Regra dos 4%</p>
        </div>
        <p className="text-text-muted text-[12px] leading-relaxed">
          A Regra dos 4% (Safe Withdrawal Rate) foi desenvolvida pelo estudo Trinity (1998). Ela sugere que um portfólio diversificado pode sustentar retiradas anuais de 4% do patrimônio inicial por pelo menos 30 anos com alta probabilidade de sucesso. O patrimônio necessário é calculado como: <span className="font-money text-text">despesas anuais ÷ taxa de retirada</span>. Uma taxa menor (ex: 3%) é mais conservadora e exige maior patrimônio.
        </p>
      </div>
    </div>
  );
};

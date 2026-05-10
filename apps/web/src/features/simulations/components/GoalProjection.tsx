"use client";

import { useState, useMemo, useRef, useEffect } from "react";
import { Clock, TrendingUp, Percent, ChevronDown, ChevronLeft, ChevronRight, Check } from "lucide-react";
import {
  ResponsiveContainer, ComposedChart, Area, Line, XAxis, YAxis, Tooltip,
  CartesianGrid, ReferenceLine,
} from "recharts";
import { SectionHeader } from "@/components/shared/SectionHeader";
import { formatCurrency, formatCurrencyCompact } from "@/lib/utils/formatCurrency";
import { cn } from "@/lib/utils";
import { simulateMonthly, aggregateAnnual } from "../utils/taxCalc";
import type { AssetCategory } from "@/lib/types/simulation";
import { ASSET_CATEGORY_LABELS } from "@/lib/types/simulation";

const inputCls = "border-border bg-surface2 text-text placeholder:text-text-muted w-full rounded-lg border h-9 px-3 text-[13px] outline-none focus:border-green/60 transition-colors";

// ── Dropdown customizado (mesmo padrão de CompoundInterestSimulator) ────────
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
        className="border-border bg-surface2 text-text flex h-9 w-full items-center justify-between gap-2 rounded-lg border px-3 text-[13px] transition-colors hover:border-green/40"
      >
        <span>{ASSET_CATEGORY_LABELS[value]}</span>
        <ChevronDown size={14} className={cn("text-text-muted transition-transform shrink-0", open && "rotate-180")} />
      </button>
      {open && (
        <div className="border-border bg-surface absolute left-0 top-10 z-50 flex flex-col gap-px rounded-xl border p-1.5 shadow-lg w-full min-w-[220px]">
          {(Object.entries(ASSET_CATEGORY_LABELS) as [AssetCategory, string][]).map(([k, v]) => (
            <button
              key={k}
              onClick={() => { onChange(k); setOpen(false); }}
              className="flex items-center justify-between gap-2 rounded-lg px-2.5 py-1.5 text-left text-[13px] transition-colors hover:bg-surface2"
            >
              <span className={cn("text-text-sub", value === k && "text-text")}>{v}</span>
              {value === k && <Check size={12} className="text-green shrink-0" />}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

// ── Tooltip ──────────────────────────────────────────────────────────────────
const CustomTooltip = ({ active, payload, label, goalCents }: any) => {
  if (!active || !payload?.length) return null;
  const gross = payload.find((p: any) => p.dataKey === "grossValue")?.value ?? 0;
  const pct = goalCents > 0 ? Math.min(100, (gross / goalCents) * 100).toFixed(1) : 0;
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
      <p className="text-text-muted mt-1.5 border-t border-border pt-1.5 text-[11px]">{pct}% da meta atingida</p>
    </div>
  );
};

// ── Cores das séries (mesmo padrão do CompoundInterestSimulator) ─────────────
const SERIES = {
  gross:   "var(--green)",
  net:     "var(--purple)",
  invested:"var(--yellow)",
} as const;

// ── Modo: calcular prazo ou calcular aporte ───────────────────────────────────
type GoalMode = "prazo" | "aporte";

export const GoalProjection = () => {
  const [mode, setMode]                     = useState<GoalMode>("prazo");
  const [goalAmount, setGoalAmount]         = useState("50000");
  const [currentSavings, setCurrentSavings] = useState("5000");
  const [monthlyContrib, setMonthlyContrib] = useState("1000");
  const [desiredMonths, setDesiredMonths]   = useState("36");
  const [annualRate, setAnnualRate]         = useState("10");
  const [assetCategory, setAssetCategory]   = useState<AssetCategory>("renda_fixa_bancaria");
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

  const result = useMemo(() => {
    const goal    = parseFloat(goalAmount.replace(",", ".")) * 100 || 0;
    const current = parseFloat(currentSavings.replace(",", ".")) * 100 || 0;
    const rate    = parseFloat(annualRate.replace(",", ".")) || 0;

    if (goal <= 0 || rate <= 0) return null;

    const monthlyRate = rate / 100 / 12;
    let months: number;
    let monthly: number;

    if (mode === "prazo") {
      monthly = parseFloat(monthlyContrib.replace(",", ".")) * 100 || 0;
      if (monthly <= 0) return null;
      let value = current;
      months = 0;
      while (value < goal && months < 1200) {
        value = value * (1 + monthlyRate) + monthly;
        months++;
      }
      if (months === 0) return null;
    } else {
      months = parseInt(desiredMonths) || 0;
      if (months <= 0) return null;
      // aporte necessário: (goal - current*(1+r)^n) / (((1+r)^n - 1)/r)
      const fv = Math.pow(1 + monthlyRate, months);
      monthly = Math.max(0, (goal - current * fv) / ((fv - 1) / monthlyRate));
    }

    const all    = simulateMonthly(current, monthly, rate, months, assetCategory);
    const last   = all[all.length - 1];
    const annual = aggregateAnnual(all);
    const useAnnual = months >= 36;
    const chart  = useAnnual ? annual : all;
    const progressPct = Math.min(100, (current / goal) * 100);

    return {
      months,
      years:           Math.floor(months / 12),
      remainingMonths: months % 12,
      monthly,
      goalCents: goal,
      current,
      all, annual, chart, useAnnual, last,
      progressPct,
    };
  }, [goalAmount, currentSavings, monthlyContrib, desiredMonths, annualRate, assetCategory, mode]);

  // Paginação da tabela mensal
  const allMonths   = result?.all ?? [];
  const totalItems  = allMonths.length;
  const totalPages  = Math.max(1, Math.ceil(totalItems / tablePageSize));
  const safePage    = Math.min(tablePage, totalPages);
  const tableFrom   = totalItems === 0 ? 0 : (safePage - 1) * tablePageSize + 1;
  const tableTo     = Math.min(safePage * tablePageSize, totalItems);
  const visibleRows = allMonths.slice(tableFrom - 1, tableTo);

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
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-[320px_1fr]">

        {/* ── Coluna esquerda: parâmetros + resultado ── */}
        <div className="flex flex-col gap-4">

          {/* Parâmetros */}
          <div className="border-border bg-surface rounded-xl border p-5">
            <SectionHeader title="Parâmetros" />

            {/* Mode toggle */}
            <div className="mt-4 flex rounded-lg overflow-hidden border border-border bg-surface2 p-0.5 gap-0.5 mb-4">
              {([["prazo", "⏱ Calcular prazo"], ["aporte", "💰 Calcular aporte"]] as [GoalMode, string][]).map(([m, lbl]) => (
                <button
                  key={m}
                  onClick={() => setMode(m)}
                  className={cn(
                    "flex-1 rounded-md py-1.5 text-[12px] font-medium transition-all",
                    mode === m ? "bg-green text-white shadow-sm" : "text-text-muted hover:text-text"
                  )}
                >
                  {lbl}
                </button>
              ))}
            </div>

            <div className="flex flex-col gap-3">
              <div>
                <label className="text-text-muted mb-1.5 block text-[12px]">Valor da meta (R$)</label>
                <input className={inputCls} value={goalAmount} onChange={(e) => setGoalAmount(e.target.value)} placeholder="50000" />
              </div>
              <div>
                <label className="text-text-muted mb-1.5 block text-[12px]">Já tenho (R$)</label>
                <input className={inputCls} value={currentSavings} onChange={(e) => setCurrentSavings(e.target.value)} placeholder="5000" />
              </div>
              <div>
                <label className="text-text-muted mb-1.5 block text-[12px]">Taxa anual (%)</label>
                <input className={inputCls} value={annualRate} onChange={(e) => setAnnualRate(e.target.value)} placeholder="10" />
              </div>

              {mode === "prazo" ? (
                <div>
                  <label className="text-text-muted mb-1.5 block text-[12px]">Aporte mensal (R$)</label>
                  <input className={inputCls} value={monthlyContrib} onChange={(e) => setMonthlyContrib(e.target.value)} placeholder="1000" />
                </div>
              ) : (
                <div>
                  <label className="text-text-muted mb-1.5 block text-[12px]">Prazo desejado (meses)</label>
                  <input className={inputCls} value={desiredMonths} onChange={(e) => setDesiredMonths(e.target.value)} placeholder="36" />
                </div>
              )}

              <div>
                <label className="text-text-muted mb-1.5 block text-[12px]">Tipo de ativo (para IR)</label>
                <AssetCategorySelect value={assetCategory} onChange={setAssetCategory} />
              </div>
            </div>
          </div>

          {/* Resultado */}
          {result ? (
            <div
              className="rounded-xl border p-5"
              style={{
                background: `linear-gradient(135deg, color-mix(in srgb, var(--green) 12%, transparent), color-mix(in srgb, var(--green) 5%, transparent))`,
                borderColor: "color-mix(in srgb, var(--green) 30%, transparent)",
              }}
            >
              <div className="text-[11px] font-semibold tracking-widest mb-3" style={{ color: "var(--green)" }}>
                {mode === "prazo" ? "PRAZO NECESSÁRIO" : "APORTE NECESSÁRIO"}
              </div>

              {/* Valor principal */}
              <p className="font-money text-[34px] font-bold text-text leading-none">
                {mode === "prazo"
                  ? result.years > 0
                    ? `${result.years} anos`
                    : `${result.remainingMonths} meses`
                  : formatCurrency(result.monthly / 100)}
              </p>
              {mode === "prazo" && result.years > 0 && result.remainingMonths > 0 && (
                <p className="text-text-muted text-[12px] mt-1">e {result.remainingMonths} {result.remainingMonths === 1 ? "mês" : "meses"} · {result.months} meses no total</p>
              )}
              {mode === "prazo" && result.years === 0 && (
                <p className="text-text-muted text-[12px] mt-1">{result.months} meses no total</p>
              )}
              {mode === "aporte" && (
                <p className="text-text-muted text-[12px] mt-1">por mês durante {result.months} meses ({result.years > 0 ? `${result.years}a ` : ""}{result.remainingMonths > 0 ? `${result.remainingMonths}m` : ""})</p>
              )}

              <div className="mt-4 flex flex-col gap-2.5">
                {[
                  { label: "Meta",              value: formatCurrency(result.goalCents / 100),       color: "var(--text-sub)"  },
                  { label: "Já guardado",        value: formatCurrency(result.current / 100),         color: "var(--text-sub)"  },
                  { label: "Total aportado",     value: formatCurrency(result.last.invested / 100),   color: "var(--yellow)"    },
                  { label: "Ganho líquido",      value: `+${formatCurrency(result.last.netGain / 100)}`, color: "var(--green)"  },
                  { label: "Imposto total",      value: formatCurrency(result.last.totalTax / 100),   color: "var(--orange)"    },
                ].map(({ label, value, color }) => (
                  <div key={label} className="flex justify-between text-[12px]">
                    <span className="text-text-muted">{label}</span>
                    <span className="font-money" style={{ color }}>{value}</span>
                  </div>
                ))}

                {/* Barra de progresso */}
                <div className="mt-1">
                  <div className="flex justify-between text-[11px] mb-1">
                    <span className="text-text-muted">Progresso atual</span>
                    <span className="font-money" style={{ color: "var(--green)" }}>{result.progressPct.toFixed(1)}%</span>
                  </div>
                  <div className="h-2 w-full rounded-full overflow-hidden" style={{ backgroundColor: "color-mix(in srgb, var(--green) 20%, transparent)" }}>
                    <div
                      className="h-full rounded-full transition-all"
                      style={{ width: `${result.progressPct}%`, backgroundColor: "var(--green)" }}
                    />
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="flex h-28 items-center justify-center rounded-xl border border-dashed border-border">
              <p className="text-text-muted text-[12px]">Preencha os campos para ver a projeção</p>
            </div>
          )}
        </div>

        {/* ── Coluna direita: gráfico + detalhamento ── */}
        <div className="flex flex-col gap-4">

          {/* Gráfico */}
          <div className="border-border bg-surface rounded-xl border p-5 flex flex-col">
            <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
              <SectionHeader title="Curva até a Meta" subtitle={result?.useAnnual ? "Agrupado por ano" : "Mensal"} />
            </div>

            {result ? (
              <>
                <div className="flex-1" style={{ minHeight: 260 }}>
                  <ResponsiveContainer width="100%" height={260}>
                    <ComposedChart data={result.chart} margin={{ top: 4, right: 4, left: 0, bottom: 0 }}>
                      <defs>
                        <linearGradient id="gp_gradGross" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%"  stopColor={SERIES.gross}    stopOpacity={0.2}  />
                          <stop offset="95%" stopColor={SERIES.gross}    stopOpacity={0}    />
                        </linearGradient>
                        <linearGradient id="gp_gradNet" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%"  stopColor={SERIES.net}      stopOpacity={0.15} />
                          <stop offset="95%" stopColor={SERIES.net}      stopOpacity={0}    />
                        </linearGradient>
                        <linearGradient id="gp_gradInv" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%"  stopColor={SERIES.invested} stopOpacity={0.12} />
                          <stop offset="95%" stopColor={SERIES.invested} stopOpacity={0}    />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                      <XAxis dataKey="shortLabel" tick={{ fill: "var(--text-muted)", fontSize: 11, fontFamily: "DM Sans" }} axisLine={false} tickLine={false} interval="preserveStartEnd" />
                      <YAxis tick={{ fill: "var(--text-muted)", fontSize: 11, fontFamily: "JetBrains Mono" }} axisLine={false} tickLine={false} tickFormatter={(v) => formatCurrencyCompact(v / 100)} width={72} />
                      <Tooltip content={<CustomTooltip goalCents={result.goalCents} />} />
                      <ReferenceLine
                        y={result.goalCents}
                        stroke="var(--orange)"
                        strokeDasharray="5 3"
                        strokeWidth={1.5}
                        label={{ value: "Meta", fill: "var(--orange)", fontSize: 11, position: "insideTopRight" }}
                      />
                      <Area type="monotone" dataKey="invested"   name="Investido"           stroke={SERIES.invested} strokeWidth={2}   fill="url(#gp_gradInv)"   dot={{ r: 5, fill: SERIES.invested, stroke: "var(--surface)", strokeWidth: 2 }} activeDot={{ r: 7, fill: SERIES.invested, stroke: "var(--surface)", strokeWidth: 2 }} />
                      <Area type="monotone" dataKey="grossValue" name="Patrimônio bruto"    stroke={SERIES.gross}    strokeWidth={2}   fill="url(#gp_gradGross)" dot={{ r: 5, fill: SERIES.gross,    stroke: "var(--surface)", strokeWidth: 2 }} activeDot={{ r: 7, fill: SERIES.gross,    stroke: "var(--surface)", strokeWidth: 2 }} />
                      <Line  type="monotone" dataKey="netValue"   name="Patrimônio líquido" stroke={SERIES.net}      strokeWidth={1.5} strokeDasharray="4 2"      dot={{ r: 5, fill: SERIES.net,      stroke: "var(--surface)", strokeWidth: 2 }} activeDot={{ r: 7, fill: SERIES.net,      stroke: "var(--surface)", strokeWidth: 2 }} />
                    </ComposedChart>
                  </ResponsiveContainer>
                </div>

                {/* Legenda */}
                <div className="mt-3 flex flex-wrap gap-4">
                  {[
                    [SERIES.gross,    "Patrimônio bruto"],
                    [SERIES.net,      "Patrimônio líquido"],
                    [SERIES.invested, "Investido"],
                    ["var(--orange)", "Meta"],
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

          {/* Fluxo financeiro completo */}
          {result && (
            <div className="border-border bg-surface rounded-xl border p-5">
              <div className="flex items-center gap-2 mb-4">
                <TrendingUp size={15} className="text-green shrink-0" />
                <p className="text-text text-[13px] font-semibold">Fluxo financeiro completo</p>
              </div>

              <div className="grid grid-cols-2 gap-x-6 gap-y-3 sm:grid-cols-4 text-[12px] mb-4">
                {[
                  { label: "Aporte inicial",         value: result.current,                                                  color: "var(--text-sub)"  },
                  { label: "Aportes mensais totais", value: result.last.invested - result.current,                           color: "var(--text-sub)"  },
                  { label: "Total aportado",          value: result.last.invested,                                            color: "var(--yellow)"    },
                  { label: "Patrimônio bruto",        value: result.last.grossValue,                                          color: "var(--text)"      },
                  { label: "Rendimento bruto",        value: result.last.grossGain,                                           color: "var(--green)"     },
                  { label: "IR a pagar",              value: result.last.irAmount,                                            color: "var(--orange)"    },
                  { label: "IOF a pagar",             value: result.last.iofAmount,                                           color: "var(--red)"       },
                  { label: "Patrimônio líquido",      value: result.last.netValue,                                            color: "var(--purple)"    },
                ].map(({ label, value, color }) => (
                  <div key={label}>
                    <p className="text-text-muted text-[11px] mb-0.5">{label}</p>
                    <p className="font-money font-600 text-[14px]" style={{ color }}>{formatCurrency(value / 100)}</p>
                  </div>
                ))}
              </div>

              <div className="border-t border-border pt-3 flex flex-wrap gap-x-6 gap-y-1.5 text-[12px]">
                <div className="flex items-center gap-2">
                  <Clock size={12} className="text-text-muted shrink-0" />
                  <span className="text-text-muted">Renda bruta no último mês:</span>
                  <span className="font-money text-text">{formatCurrency(result.last.monthlyGrossIncome / 100)}/mês</span>
                </div>
                <div className="flex items-center gap-2">
                  <Percent size={12} className="text-green shrink-0" />
                  <span className="text-text-muted">Renda líquida:</span>
                  <span className="font-money text-green">{formatCurrency(result.last.monthlyNetIncome / 100)}/mês</span>
                </div>
                <div className="flex items-center gap-2">
                  <TrendingUp size={12} className="text-text-muted shrink-0" />
                  <span className="text-text-muted">Alíquota IR:</span>
                  <span className="font-money text-orange">{(result.last.irRate * 100).toFixed(1)}% — {result.last.irRateLabel}</span>
                </div>
              </div>
            </div>
          )}

          {/* Detalhamento mensal paginado */}
          {result && allMonths.length > 0 && (
            <div className="border-border bg-surface rounded-xl border p-5">
              <div className="flex items-center justify-between mb-3">
                <SectionHeader title="Detalhamento por Mês" subtitle="Evolução mês a mês até a meta" />
                <span className="text-text-muted text-[11px]">{totalItems} meses projetados</span>
              </div>
              <div className="overflow-x-auto rounded-xl border border-border">
                <table className="w-full text-[12px] min-w-[560px]">
                  <thead>
                    <tr className="border-b border-border bg-surface2/60">
                      <th className="text-text-muted px-3 py-2.5 text-left font-medium">Mês</th>
                      <th className="text-text-muted px-3 py-2.5 text-right font-medium">Aportes acum.</th>
                      <th className="text-text-muted px-3 py-2.5 text-right font-medium">Rendimento/mês</th>
                      <th className="text-text-muted px-3 py-2.5 text-right font-medium">Patrimônio bruto</th>
                      <th className="text-text-muted px-3 py-2.5 text-right font-medium">IR acum.</th>
                      <th className="text-text-muted px-3 py-2.5 text-right font-medium">Patrimônio líquido</th>
                      <th className="text-text-muted px-3 py-2.5 text-right font-medium">% da meta</th>
                    </tr>
                  </thead>
                  <tbody>
                    {visibleRows.map((r) => {
                      const pct = Math.min(100, (r.grossValue / result.goalCents) * 100);
                      return (
                        <tr key={r.month} className="border-b border-border last:border-0 hover:bg-surface2/30 transition-colors">
                          <td className="px-3 py-2.5 font-medium text-text">{r.label}</td>
                          <td className="px-3 py-2.5 text-right font-money text-text-muted">{formatCurrency(r.invested / 100)}</td>
                          <td className="px-3 py-2.5 text-right font-money text-green">+{formatCurrency(r.monthlyGrossIncome / 100)}</td>
                          <td className="px-3 py-2.5 text-right font-money text-text">{formatCurrency(r.grossValue / 100)}</td>
                          <td className="px-3 py-2.5 text-right font-money text-orange">{formatCurrency(r.irAmount / 100)}</td>
                          <td className="px-3 py-2.5 text-right font-money text-purple">{formatCurrency(r.netValue / 100)}</td>
                          <td className="px-3 py-2.5 text-right">
                            <div className="flex items-center justify-end gap-2">
                              <div className="h-1.5 w-16 overflow-hidden rounded-full bg-surface2">
                                <div className="h-full rounded-full bg-green/70" style={{ width: `${pct}%` }} />
                              </div>
                              <span className={cn("font-mono text-[11px]", pct >= 100 ? "text-green font-semibold" : "text-text-muted")}>
                                {pct.toFixed(0)}%
                              </span>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* Paginação — mesmo padrão de TransactionsPagination */}
              <div className="mt-3 flex items-center justify-end gap-3">
                <p className="text-text-muted shrink-0 text-[13px]">
                  {totalItems === 0
                    ? "Nenhum mês"
                    : `${tableFrom}–${tableTo} de ${totalItems} mes${totalItems !== 1 ? "es" : ""}`}
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

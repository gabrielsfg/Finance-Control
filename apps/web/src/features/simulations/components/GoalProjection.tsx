"use client";

import { useState, useMemo, useRef, useEffect } from "react";
import { Clock, TrendingUp, Percent, ChevronDown, ChevronLeft, ChevronRight, Check } from "lucide-react";
import {
  ResponsiveContainer, ComposedChart, Area, Line, XAxis, YAxis, Tooltip,
  CartesianGrid, ReferenceLine,
} from "recharts";
import { Card, CardHead } from "@/components/shared/Card";
import { formatCurrency, formatCurrencyCompact } from "@/lib/utils/formatCurrency";
import { cn } from "@/lib/utils";
import { simulateMonthly, aggregateAnnual } from "../utils/taxCalc";
import type { AssetCategory } from "@/lib/types/simulation";
import { ASSET_CATEGORY_LABELS } from "@/lib/types/simulation";
import {
  CHART_GRID, axisTick, SERIES, FieldLabel, FieldShell, MoneyPrefix, UnitSuffix, fieldMono,
  SegRow, SegOption, LegendItem,
} from "./simShared";
import { chartAnim } from "@/lib/config/chartAnimation";

/** Tokenised `.field` input — mono, bordered, cobalt focus halo. */
const inputCls =
  "h-11 w-full rounded-[13px] border border-[var(--border-color)] bg-[var(--surface)] px-3.5 font-mono text-[14px] tabular-nums text-[var(--text)] outline-none transition-[border-color,box-shadow] placeholder:text-[var(--text-sub)]/60 focus:border-[var(--brand-cobalt)] focus:shadow-[0_0_0_3px_color-mix(in_srgb,var(--brand-cobalt)_12%,transparent)]";

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
        className="flex h-[42px] w-full items-center justify-between gap-2 rounded-[13px] border border-[var(--border-color)] bg-[var(--surface)] px-3.5 text-[14px] text-[var(--text)] transition-colors hover:border-[var(--brand-accent)]/50"
      >
        <span>{ASSET_CATEGORY_LABELS[value]}</span>
        <ChevronDown size={14} className={cn("text-[var(--text-sub)] transition-transform shrink-0", open && "rotate-180")} />
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

// ── Cores das séries ─────────────────────────────────────────────────────────
const GOAL_SERIES = {
  gross:    SERIES.moss,
  net:      SERIES.violet,
  invested: SERIES.gold,
} as const;

// ── Tooltip tokenizado com rodapé "% da meta atingida" (dinâmico por hover) ───
const GoalTooltip = ({ active, payload, label, goalCents }: any) => {
  if (!active || !payload?.length) return null;
  const gross = payload.find((p: any) => p.dataKey === "grossValue")?.value ?? 0;
  const pct = goalCents > 0 ? Math.min(100, (gross / goalCents) * 100).toFixed(1) : "0";
  return (
    <div
      className="min-w-[210px] rounded-[13px] border border-[var(--border-color)] bg-[var(--surface)] px-3 py-2.5"
      style={{ boxShadow: "var(--shadow-md)" }}
    >
      <p className="mb-2 font-mono text-[11px] uppercase tracking-[0.08em] text-[var(--text-sub)]">{label}</p>
      {payload.map((e: any) => (
        <div key={e.name} className="mb-0.5 flex justify-between gap-4">
          <span className="text-[12px]" style={{ color: e.stroke ?? e.color }}>{e.name}</span>
          <span className="font-mono text-[12px] tabular-nums" style={{ color: e.stroke ?? e.color }}>
            {formatCurrency(e.value / 100)}
          </span>
        </div>
      ))}
      <p className="mt-1.5 border-t border-[var(--border-color)] pt-1.5 text-[11px] text-[var(--text-sub)]">{pct}% da meta atingida</p>
    </div>
  );
};

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
          <Card>
            <CardHead title="Parâmetros" />

            {/* Mode toggle */}
            <SegRow className="mb-4">
              {([["prazo", "⏱ Calcular prazo"], ["aporte", "💰 Calcular aporte"]] as [GoalMode, string][]).map(([m, lbl]) => (
                <SegOption key={m} active={mode === m} onClick={() => setMode(m)}>
                  {lbl}
                </SegOption>
              ))}
            </SegRow>

            <div className="flex flex-col gap-3.5">
              <div>
                <FieldLabel>Valor da meta</FieldLabel>
                <FieldShell prefix={<MoneyPrefix />}>
                  <input className={fieldMono} value={goalAmount} onChange={(e) => setGoalAmount(e.target.value)} placeholder="50.000,00" inputMode="decimal" />
                </FieldShell>
              </div>
              <div>
                <FieldLabel>Já tenho</FieldLabel>
                <FieldShell prefix={<MoneyPrefix />}>
                  <input className={fieldMono} value={currentSavings} onChange={(e) => setCurrentSavings(e.target.value)} placeholder="5.000,00" inputMode="decimal" />
                </FieldShell>
              </div>
              <div>
                <FieldLabel>Taxa anual</FieldLabel>
                <FieldShell suffix={<UnitSuffix>%</UnitSuffix>}>
                  <input className={fieldMono} value={annualRate} onChange={(e) => setAnnualRate(e.target.value)} placeholder="10" inputMode="decimal" />
                </FieldShell>
              </div>

              {mode === "prazo" ? (
                <div>
                  <FieldLabel>Aporte mensal</FieldLabel>
                  <FieldShell prefix={<MoneyPrefix />}>
                    <input className={fieldMono} value={monthlyContrib} onChange={(e) => setMonthlyContrib(e.target.value)} placeholder="1.000,00" inputMode="decimal" />
                  </FieldShell>
                </div>
              ) : (
                <div>
                  <FieldLabel>Prazo desejado (meses)</FieldLabel>
                  <FieldShell suffix={<UnitSuffix>meses</UnitSuffix>}>
                    <input className={fieldMono} value={desiredMonths} onChange={(e) => setDesiredMonths(e.target.value)} placeholder="36" inputMode="numeric" />
                  </FieldShell>
                </div>
              )}

              <div>
                <FieldLabel>Tipo de ativo (para IR)</FieldLabel>
                <AssetCategorySelect value={assetCategory} onChange={setAssetCategory} />
              </div>
            </div>
          </Card>

          {/* Resultado */}
          {result ? (
            <div
              className="rounded-[20px] border p-5"
              style={{
                background: `linear-gradient(135deg, color-mix(in srgb, var(--moss) 14%, transparent), color-mix(in srgb, var(--moss) 5%, transparent))`,
                borderColor: "color-mix(in srgb, var(--moss) 30%, transparent)",
              }}
            >
              <div className="mb-3 font-mono text-[11px] uppercase tracking-[0.18em]" style={{ color: "var(--moss)" }}>
                {mode === "prazo" ? "Prazo necessário" : "Aporte necessário"}
              </div>

              {/* Valor principal */}
              <p className="font-mono text-[34px] font-bold leading-none tabular-nums text-[var(--text)]">
                {mode === "prazo"
                  ? result.years > 0
                    ? `${result.years} anos`
                    : `${result.remainingMonths} meses`
                  : formatCurrency(result.monthly / 100)}
              </p>
              {mode === "prazo" && result.years > 0 && result.remainingMonths > 0 && (
                <p className="mt-1 text-[12px] text-[var(--text-sub)]">e {result.remainingMonths} {result.remainingMonths === 1 ? "mês" : "meses"} · {result.months} meses no total</p>
              )}
              {mode === "prazo" && result.years === 0 && (
                <p className="mt-1 text-[12px] text-[var(--text-sub)]">{result.months} meses no total</p>
              )}
              {mode === "aporte" && (
                <p className="mt-1 text-[12px] text-[var(--text-sub)]">por mês durante {result.months} meses ({result.years > 0 ? `${result.years}a ` : ""}{result.remainingMonths > 0 ? `${result.remainingMonths}m` : ""})</p>
              )}

              <div className="mt-4 flex flex-col gap-2.5">
                {[
                  { label: "Meta",              value: formatCurrency(result.goalCents / 100),       color: "var(--text-sub)"  },
                  { label: "Já guardado",        value: formatCurrency(result.current / 100),         color: "var(--text-sub)"  },
                  { label: "Total aportado",     value: formatCurrency(result.last.invested / 100),   color: "var(--gold)"      },
                  { label: "Ganho líquido",      value: `+${formatCurrency(result.last.netGain / 100)}`, color: "var(--moss)"   },
                  { label: "Imposto total",      value: formatCurrency(result.last.totalTax / 100),   color: "var(--clay)"      },
                ].map(({ label, value, color }) => (
                  <div key={label} className="flex justify-between text-[12px]">
                    <span className="text-[var(--text-sub)]">{label}</span>
                    <span className="font-mono tabular-nums" style={{ color }}>{value}</span>
                  </div>
                ))}

                {/* Barra de progresso */}
                <div className="mt-1">
                  <div className="mb-1 flex justify-between text-[11px]">
                    <span className="text-[var(--text-sub)]">Progresso atual</span>
                    <span className="font-mono tabular-nums" style={{ color: "var(--moss)" }}>{result.progressPct.toFixed(1)}%</span>
                  </div>
                  <div className="h-2 w-full overflow-hidden rounded-full" style={{ backgroundColor: "color-mix(in srgb, var(--moss) 20%, transparent)" }}>
                    <div
                      className="h-full rounded-full transition-all"
                      style={{ width: `${result.progressPct}%`, backgroundColor: "var(--moss)" }}
                    />
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="flex h-28 items-center justify-center rounded-[20px] border border-dashed border-[var(--border-color)]">
              <p className="text-[12px] text-[var(--text-sub)]">Preencha os campos para ver a projeção</p>
            </div>
          )}
        </div>

        {/* ── Coluna direita: gráfico + detalhamento ── */}
        <div className="flex flex-col gap-4">

          {/* Gráfico */}
          <Card className="flex flex-col">
            <CardHead title="Curva até a meta" subtitle={result?.useAnnual ? "Agrupado por ano" : "Mensal"} />

            {result ? (
              <>
                <div className="flex-1" style={{ minHeight: 260 }}>
                  <ResponsiveContainer width="100%" height={260}>
                    <ComposedChart data={result.chart} margin={{ top: 4, right: 4, left: 0, bottom: 0 }}>
                      <defs>
                        <linearGradient id="gp_gradGross" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%"  stopColor={GOAL_SERIES.gross}    stopOpacity={0.2}  />
                          <stop offset="95%" stopColor={GOAL_SERIES.gross}    stopOpacity={0}    />
                        </linearGradient>
                        <linearGradient id="gp_gradNet" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%"  stopColor={GOAL_SERIES.net}      stopOpacity={0.15} />
                          <stop offset="95%" stopColor={GOAL_SERIES.net}      stopOpacity={0}    />
                        </linearGradient>
                        <linearGradient id="gp_gradInv" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%"  stopColor={GOAL_SERIES.invested} stopOpacity={0.12} />
                          <stop offset="95%" stopColor={GOAL_SERIES.invested} stopOpacity={0}    />
                        </linearGradient>
                      </defs>
                      <CartesianGrid {...CHART_GRID} />
                      <XAxis dataKey="shortLabel" tick={axisTick} axisLine={false} tickLine={false} interval="preserveStartEnd" />
                      <YAxis tick={axisTick} axisLine={false} tickLine={false} tickFormatter={(v) => formatCurrencyCompact(v / 100)} width={72} />
                      <Tooltip content={<GoalTooltip goalCents={result.goalCents} />} />
                      <ReferenceLine
                        y={result.goalCents}
                        stroke={SERIES.gold}
                        strokeDasharray="5 3"
                        strokeWidth={1.5}
                        label={{ value: "Meta", fill: SERIES.gold, fontSize: 11, position: "insideTopRight" }}
                      />
                      <Area {...chartAnim(0)} type="monotone" dataKey="invested"   name="Investido"           stroke={GOAL_SERIES.invested} strokeWidth={2}   fill="url(#gp_gradInv)"   dot={{ r: 5, fill: GOAL_SERIES.invested, stroke: "var(--surface)", strokeWidth: 2 }} activeDot={{ r: 5, fill: GOAL_SERIES.invested, stroke: "var(--surface)", strokeWidth: 2 }} />
                      <Area {...chartAnim(1)} type="monotone" dataKey="grossValue" name="Patrimônio bruto"    stroke={GOAL_SERIES.gross}    strokeWidth={2.5} fill="url(#gp_gradGross)" dot={{ r: 5, fill: GOAL_SERIES.gross,    stroke: "var(--surface)", strokeWidth: 2 }} activeDot={{ r: 5, fill: GOAL_SERIES.gross,    stroke: "var(--surface)", strokeWidth: 2 }} />
                      <Line {...chartAnim(2)}  type="monotone" dataKey="netValue"   name="Patrimônio líquido" stroke={GOAL_SERIES.net}      strokeWidth={2.5} strokeDasharray="4 2"      dot={{ r: 5, fill: GOAL_SERIES.net,      stroke: "var(--surface)", strokeWidth: 2 }} activeDot={{ r: 5, fill: GOAL_SERIES.net,      stroke: "var(--surface)", strokeWidth: 2 }} />
                    </ComposedChart>
                  </ResponsiveContainer>
                </div>

                {/* Legenda */}
                <div className="mt-3 flex flex-wrap gap-4">
                  <LegendItem color={GOAL_SERIES.gross}>Patrimônio bruto</LegendItem>
                  <LegendItem color={GOAL_SERIES.net}>Patrimônio líquido</LegendItem>
                  <LegendItem color={GOAL_SERIES.invested}>Investido</LegendItem>
                  <LegendItem color={SERIES.gold}>Meta</LegendItem>
                </div>
              </>
            ) : (
              <div className="flex flex-1 items-center justify-center py-16">
                <p className="text-[13px] text-[var(--text-sub)]">Preencha os parâmetros para ver a projeção</p>
              </div>
            )}
          </Card>

          {/* Fluxo financeiro completo */}
          {result && (
            <Card>
              <div className="mb-4 flex items-center gap-2">
                <TrendingUp size={15} className="shrink-0 text-[var(--moss)]" />
                <p className="font-display text-[15px] font-bold tracking-[-0.01em] text-[var(--text)]">Fluxo financeiro completo</p>
              </div>

              <div className="mb-4 grid grid-cols-2 gap-x-6 gap-y-3 text-[12px] sm:grid-cols-4">
                {[
                  { label: "Aporte inicial",         value: result.current,                                                  color: "var(--text-sub)"  },
                  { label: "Aportes mensais totais", value: result.last.invested - result.current,                           color: "var(--text-sub)"  },
                  { label: "Total aportado",          value: result.last.invested,                                            color: "var(--gold)"      },
                  { label: "Patrimônio bruto",        value: result.last.grossValue,                                          color: "var(--text)"      },
                  { label: "Rendimento bruto",        value: result.last.grossGain,                                           color: "var(--moss)"      },
                  { label: "IR a pagar",              value: result.last.irAmount,                                            color: "var(--gold)"      },
                  { label: "IOF a pagar",             value: result.last.iofAmount,                                           color: "var(--clay)"      },
                  { label: "Patrimônio líquido",      value: result.last.netValue,                                            color: "var(--brand-accent)" },
                ].map(({ label, value, color }) => (
                  <div key={label}>
                    <p className="mb-0.5 font-mono text-[11px] uppercase tracking-[0.1em] text-[var(--text-sub)]">{label}</p>
                    <p className="font-mono text-[14px] font-semibold tabular-nums" style={{ color }}>{formatCurrency(value / 100)}</p>
                  </div>
                ))}
              </div>

              <div className="flex flex-wrap gap-x-6 gap-y-1.5 border-t border-[var(--border-color)] pt-3 text-[12px]">
                <div className="flex items-center gap-2">
                  <Clock size={12} className="shrink-0 text-[var(--text-sub)]" />
                  <span className="text-[var(--text-sub)]">Renda bruta no último mês:</span>
                  <span className="font-mono tabular-nums text-[var(--text)]">{formatCurrency(result.last.monthlyGrossIncome / 100)}/mês</span>
                </div>
                <div className="flex items-center gap-2">
                  <Percent size={12} className="shrink-0 text-[var(--moss)]" />
                  <span className="text-[var(--text-sub)]">Renda líquida:</span>
                  <span className="font-mono tabular-nums text-[var(--moss)]">{formatCurrency(result.last.monthlyNetIncome / 100)}/mês</span>
                </div>
                <div className="flex items-center gap-2">
                  <TrendingUp size={12} className="shrink-0 text-[var(--text-sub)]" />
                  <span className="text-[var(--text-sub)]">Alíquota IR:</span>
                  <span className="font-mono tabular-nums text-[var(--gold)]">{(result.last.irRate * 100).toFixed(1)}% — {result.last.irRateLabel}</span>
                </div>
              </div>
            </Card>
          )}

          {/* Detalhamento mensal paginado */}
          {result && allMonths.length > 0 && (
            <Card>
              <div className="mb-3 flex items-center justify-between">
                <CardHead className="mb-0" title="Detalhamento por mês" subtitle="Evolução mês a mês até a meta" />
                <span className="font-mono text-[11px] tabular-nums text-[var(--text-sub)]">{totalItems} meses projetados</span>
              </div>
              <div className="overflow-x-auto rounded-[13px] border border-[var(--border-color)]">
                <table className="w-full min-w-[560px] text-[12px]">
                  <thead>
                    <tr className="border-b border-[var(--border-color)] bg-[var(--surface2)]">
                      <th className="px-3 py-2.5 text-left font-mono text-[10.5px] uppercase tracking-[0.12em] text-[var(--text-sub)]">Mês</th>
                      <th className="px-3 py-2.5 text-right font-mono text-[10.5px] uppercase tracking-[0.12em] text-[var(--text-sub)]">Aportes acum.</th>
                      <th className="px-3 py-2.5 text-right font-mono text-[10.5px] uppercase tracking-[0.12em] text-[var(--text-sub)]">Rendimento/mês</th>
                      <th className="px-3 py-2.5 text-right font-mono text-[10.5px] uppercase tracking-[0.12em] text-[var(--text-sub)]">Patrimônio bruto</th>
                      <th className="px-3 py-2.5 text-right font-mono text-[10.5px] uppercase tracking-[0.12em] text-[var(--text-sub)]">IR acum.</th>
                      <th className="px-3 py-2.5 text-right font-mono text-[10.5px] uppercase tracking-[0.12em] text-[var(--text-sub)]">Patrimônio líquido</th>
                      <th className="px-3 py-2.5 text-right font-mono text-[10.5px] uppercase tracking-[0.12em] text-[var(--text-sub)]">% da meta</th>
                    </tr>
                  </thead>
                  <tbody>
                    {visibleRows.map((r) => {
                      const pct = Math.min(100, (r.grossValue / result.goalCents) * 100);
                      return (
                        <tr key={r.month} className="border-b border-[var(--border-color)] transition-colors last:border-0 hover:bg-[var(--surface2)]">
                          <td className="px-3 py-2.5 font-medium text-[var(--text)]">{r.label}</td>
                          <td className="px-3 py-2.5 text-right font-mono tabular-nums text-[var(--text-sub)]">{formatCurrency(r.invested / 100)}</td>
                          <td className="px-3 py-2.5 text-right font-mono tabular-nums text-[var(--moss)]">+{formatCurrency(r.monthlyGrossIncome / 100)}</td>
                          <td className="px-3 py-2.5 text-right font-mono tabular-nums text-[var(--text)]">{formatCurrency(r.grossValue / 100)}</td>
                          <td className="px-3 py-2.5 text-right font-mono tabular-nums text-[var(--gold)]">{formatCurrency(r.irAmount / 100)}</td>
                          <td className="px-3 py-2.5 text-right font-mono tabular-nums text-[var(--brand-accent)]">{formatCurrency(r.netValue / 100)}</td>
                          <td className="px-3 py-2.5 text-right">
                            <div className="flex items-center justify-end gap-2">
                              <div className="h-1.5 w-16 overflow-hidden rounded-full bg-[var(--surface2)]">
                                <div className="h-full rounded-full" style={{ width: `${pct}%`, backgroundColor: "color-mix(in srgb, var(--moss) 70%, transparent)" }} />
                              </div>
                              <span className={cn("font-mono text-[11px] tabular-nums", pct >= 100 ? "font-semibold text-[var(--moss)]" : "text-[var(--text-sub)]")}>
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
                <p className="shrink-0 text-[13px] text-[var(--text-sub)]">
                  {totalItems === 0
                    ? "Nenhum mês"
                    : `${tableFrom}–${tableTo} de ${totalItems} mes${totalItems !== 1 ? "es" : ""}`}
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

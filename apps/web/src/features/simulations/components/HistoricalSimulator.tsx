"use client";

import { useState, useCallback } from "react";
import {
  ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip,
  CartesianGrid, Legend, ReferenceLine,
} from "recharts";
import { SectionHeader } from "@/components/shared/SectionHeader";
import { formatCurrency, formatCurrencyCompact } from "@/lib/utils/formatCurrency";
import { cn } from "@/lib/utils";
import { AlertCircle, TrendingUp, TrendingDown, Wallet, Calendar, Info } from "lucide-react";
import { useHistoricalSimulation } from "../hooks/useSimulation";
import type { Benchmark, HistoricalSimulationPoint } from "@/lib/types/simulation";
import { BENCHMARK_LABELS } from "@/lib/types/simulation";

const inputCls = "border-border bg-surface2 text-text placeholder:text-text-muted w-full rounded-lg border h-9 px-3 text-[13px] outline-none focus:border-green/60 transition-colors";
const selectCls = `${inputCls} cursor-pointer`;

const BENCHMARKS: Benchmark[] = ["CDI", "SELIC", "IPCA+6", "IPCA+5", "IPCA+4", "IBOVESPA", "IFIX", "SP500_BRL"];

const STUB_BENCHMARKS = new Set<Benchmark>(["IBOVESPA", "IFIX", "SP500_BRL"]);

// Pre-set periods
const PERIODS = [
  { label: "6 meses",   months: 6  },
  { label: "1 ano",     months: 12 },
  { label: "2 anos",    months: 24 },
  { label: "3 anos",    months: 36 },
  { label: "5 anos",    months: 60 },
  { label: "10 anos",   months: 120 },
];

function monthsAgo(n: number): string {
  const d = new Date();
  d.setMonth(d.getMonth() - n);
  return d.toISOString().slice(0, 7); // YYYY-MM
}

function toDateOnly(yearMonth: string): string {
  return `${yearMonth}-01`;
}

function todayDateOnly(): string {
  return new Date().toISOString().slice(0, 10);
}

const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="border-border bg-surface rounded-lg border px-3 py-2 shadow-md min-w-[160px]">
      <p className="text-text-muted mb-1.5 text-[11px]">{label}</p>
      {payload.map((e: any) => (
        <div key={e.name} className="flex justify-between gap-4">
          <span className="text-[12px]" style={{ color: e.stroke }}>{e.name}</span>
          <span className="font-money text-[12px]" style={{ color: e.stroke }}>
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

  const { mutate, data, isPending, isError } = useHistoricalSimulation();

  const startDate = useCustom && customStart
    ? toDateOnly(customStart)
    : toDateOnly(monthsAgo(selectedPeriod));

  const handleSimulate = useCallback(() => {
    const initialCents = Math.round(parseFloat(initialAmount.replace(",", ".")) * 100) || 0;
    const monthlyCents = Math.round(parseFloat(monthlyContrib.replace(",", ".")) * 100) || 0;

    mutate({
      benchmark,
      startDate,
      endDate: todayDateOnly(),
      initialAmount: initialCents,
      monthlyContribution: monthlyCents,
    });
  }, [benchmark, startDate, initialAmount, monthlyContrib, mutate]);

  const isStub = STUB_BENCHMARKS.has(benchmark);

  const gain = data ? data.finalValue - data.totalInvested : 0;
  const isPositive = gain >= 0;

  // Build chart data — show only every-other label if many points
  const chartData = data?.points ?? [];
  const labelStep = chartData.length > 36 ? 6 : chartData.length > 18 ? 3 : 1;

  return (
    <div className="border-border bg-surface rounded-xl border p-5">
      <SectionHeader
        title="Simulação Histórica"
        subtitle="E se eu tivesse investido desde o início?"
      />

      {/* Benchmark selection chips */}
      <div className="mb-4">
        <label className="text-text-muted mb-2 block text-[12px]">Benchmark</label>
        <div className="flex flex-wrap gap-1.5">
          {BENCHMARKS.map((b) => (
            <button
              key={b}
              onClick={() => setBenchmark(b)}
              className={cn(
                "rounded-lg px-3 py-1.5 text-[12px] font-medium transition-colors border",
                benchmark === b
                  ? "bg-green/15 text-green border-green/30"
                  : "text-text-muted border-border hover:text-text hover:border-border"
              )}
            >
              {BENCHMARK_LABELS[b]}
              {STUB_BENCHMARKS.has(b) && (
                <span className="ml-1 text-[10px] opacity-60">*</span>
              )}
            </button>
          ))}
        </div>
        {isStub && (
          <p className="text-text-muted mt-1.5 flex items-center gap-1 text-[11px]">
            <Info size={11} className="text-orange/70 shrink-0" />
            * Dados históricos reais serão integrados em breve. Usando média histórica estimada.
          </p>
        )}
      </div>

      <div className="grid grid-cols-2 gap-3 mb-4">
        <div>
          <label className="text-text-muted mb-1.5 block text-[12px]">Aporte inicial (R$)</label>
          <input
            className={inputCls}
            value={initialAmount}
            onChange={(e) => setInitialAmount(e.target.value)}
            placeholder="1000"
          />
        </div>
        <div>
          <label className="text-text-muted mb-1.5 block text-[12px]">Aporte mensal (R$)</label>
          <input
            className={inputCls}
            value={monthlyContrib}
            onChange={(e) => setMonthlyContrib(e.target.value)}
            placeholder="500"
          />
        </div>
      </div>

      {/* Period picker */}
      <div className="mb-4">
        <div className="mb-2 flex items-center justify-between">
          <label className="text-text-muted text-[12px]">Período</label>
          <button
            onClick={() => setUseCustom((p) => !p)}
            className="text-blue text-[11px] hover:underline"
          >
            {useCustom ? "Usar período pré-definido" : "Personalizar data"}
          </button>
        </div>

        {useCustom ? (
          <div className="flex items-center gap-2">
            <input
              type="month"
              className={inputCls}
              value={customStart}
              onChange={(e) => setCustomStart(e.target.value)}
              max={monthsAgo(1)}
            />
            <span className="text-text-muted text-[13px] shrink-0">até hoje</span>
          </div>
        ) : (
          <div className="flex flex-wrap gap-1.5">
            {PERIODS.map((p) => (
              <button
                key={p.months}
                onClick={() => setSelectedPeriod(p.months)}
                className={cn(
                  "rounded-lg border px-3 py-1.5 text-[12px] font-medium transition-colors",
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

      <button
        onClick={handleSimulate}
        disabled={isPending}
        className={cn(
          "mb-5 w-full rounded-lg py-2 text-[13px] font-medium transition-colors",
          isPending
            ? "bg-green/30 text-green/50 cursor-not-allowed"
            : "bg-green/15 text-green hover:bg-green/25"
        )}
      >
        {isPending ? "Calculando..." : "Simular"}
      </button>

      {isError && (
        <div className="mb-4 flex items-center gap-2 rounded-lg bg-red/10 px-3 py-2.5">
          <AlertCircle size={14} className="text-red shrink-0" />
          <p className="text-red text-[12px]">Não foi possível buscar os dados. Tente novamente.</p>
        </div>
      )}

      {data && (
        <>
          {data.dataNote && (
            <div className="mb-4 flex items-start gap-2 rounded-lg bg-orange/10 px-3 py-2.5">
              <Info size={13} className="text-orange shrink-0 mt-0.5" />
              <p className="text-orange text-[12px]">{data.dataNote}</p>
            </div>
          )}

          {/* KPI Cards */}
          <div className="bg-surface2 mb-4 grid grid-cols-2 gap-3 rounded-xl p-4 sm:grid-cols-4">
            <div>
              <div className="text-text-muted mb-1 flex items-center gap-1 text-[12px]">
                <Wallet size={12} /> Patrimônio final
              </div>
              <p className="font-money font-600 text-green text-[18px]">
                {formatCurrency(data.finalValue / 100)}
              </p>
            </div>
            <div>
              <div className="text-text-muted mb-1 flex items-center gap-1 text-[12px]">
                <Calendar size={12} /> Total investido
              </div>
              <p className="font-money font-600 text-text text-[18px]">
                {formatCurrency(data.totalInvested / 100)}
              </p>
            </div>
            <div>
              <div className="text-text-muted mb-1 flex items-center gap-1 text-[12px]">
                {isPositive ? <TrendingUp size={12} /> : <TrendingDown size={12} />} Rendimento total
              </div>
              <p className={cn("font-money font-600 text-[18px]", isPositive ? "text-green" : "text-red")}>
                {isPositive ? "+" : ""}{formatCurrency(gain / 100)}
              </p>
            </div>
            <div>
              <div className="text-text-muted mb-1 flex items-center gap-1 text-[12px]">
                <TrendingUp size={12} /> Retorno anualizado
              </div>
              <p className={cn("font-money font-600 text-[18px]", data.annualizedReturnPct >= 0 ? "text-blue" : "text-red")}>
                {data.annualizedReturnPct >= 0 ? "+" : ""}{data.annualizedReturnPct.toFixed(2)}% a.a.
              </p>
            </div>
          </div>

          {/* Chart */}
          <div style={{ minHeight: 240 }}>
            <ResponsiveContainer width="100%" height={240}>
              <LineChart data={chartData} margin={{ top: 4, right: 4, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                <XAxis
                  dataKey="label"
                  tick={{ fill: "var(--text-muted)", fontSize: 11, fontFamily: "DM Sans" }}
                  axisLine={false}
                  tickLine={false}
                  interval={labelStep - 1}
                />
                <YAxis
                  tick={{ fill: "var(--text-muted)", fontSize: 11, fontFamily: "JetBrains Mono" }}
                  axisLine={false}
                  tickLine={false}
                  tickFormatter={(v) => formatCurrencyCompact(v / 100)}
                  width={72}
                />
                <Tooltip content={<CustomTooltip />} />
                <ReferenceLine
                  y={chartData[0]?.invested ?? 0}
                  stroke="var(--border)"
                  strokeDasharray="4 4"
                />
                <Line
                  type="monotone"
                  dataKey="value"
                  name="Patrimônio"
                  stroke="var(--green)"
                  strokeWidth={2}
                  dot={false}
                />
                <Line
                  type="monotone"
                  dataKey="invested"
                  name="Investido"
                  stroke="var(--blue)"
                  strokeWidth={2}
                  dot={false}
                  strokeDasharray="5 3"
                />
              </LineChart>
            </ResponsiveContainer>
          </div>

          <div className="mt-3 flex gap-4">
            {[["var(--green)", "Patrimônio real"], ["var(--blue)", "Investido (aportes)"]].map(([color, label]) => (
              <div key={label} className="flex items-center gap-1.5">
                <div className="h-2.5 w-2.5 rounded-[2px]" style={{ backgroundColor: color }} />
                <span className="text-text-muted text-[13px]">{label}</span>
              </div>
            ))}
          </div>

          {/* Month-by-month mini table — last 6 months */}
          {chartData.length > 0 && (
            <div className="mt-4">
              <p className="text-text-muted mb-2 text-[12px]">Últimos meses</p>
              <div className="border-border overflow-hidden rounded-lg border">
                <table className="w-full text-[12px]">
                  <thead>
                    <tr className="border-border border-b">
                      <th className="text-text-muted px-3 py-2 text-left font-medium">Mês</th>
                      <th className="text-text-muted px-3 py-2 text-right font-medium">Retorno</th>
                      <th className="text-text-muted px-3 py-2 text-right font-medium">Patrimônio</th>
                      <th className="text-text-muted px-3 py-2 text-right font-medium">Rendimento</th>
                    </tr>
                  </thead>
                  <tbody>
                    {chartData.slice(-6).map((p: HistoricalSimulationPoint) => (
                      <tr key={`${p.year}-${p.month}`} className="border-border border-b last:border-0">
                        <td className="text-text px-3 py-2">{p.label}</td>
                        <td className={cn("px-3 py-2 text-right font-money", p.monthlyReturnPct >= 0 ? "text-green" : "text-red")}>
                          {p.monthlyReturnPct >= 0 ? "+" : ""}{p.monthlyReturnPct.toFixed(4)}%
                        </td>
                        <td className="text-text px-3 py-2 text-right font-money">
                          {formatCurrency(p.value / 100)}
                        </td>
                        <td className={cn("px-3 py-2 text-right font-money", p.interest >= 0 ? "text-green" : "text-red")}>
                          {p.interest >= 0 ? "+" : ""}{formatCurrency(p.interest / 100)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </>
      )}

      {!data && !isPending && (
        <div className="flex h-36 items-center justify-center rounded-xl bg-surface2">
          <p className="text-text-muted text-[13px]">Configure os parâmetros e clique em Simular</p>
        </div>
      )}
    </div>
  );
};

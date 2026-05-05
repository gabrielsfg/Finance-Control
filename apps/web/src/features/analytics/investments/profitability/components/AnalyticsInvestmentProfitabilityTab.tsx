"use client";

import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Legend,
} from "recharts";
import { SectionHeader } from "@/components/shared/SectionHeader";
import { ChartEmptyState } from "@/components/shared/ChartEmptyState";
import {
  useInvestmentProfitabilityTotals,
  useInvestmentAnnualReturns,
  useInvestmentProfitabilityVsCdi,
} from "@/features/analytics/hooks/useAnalytics";
import { cn } from "@/lib/utils";

const MONTH_LABELS = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"];

function formatBps(bps: number | null): string {
  if (bps === null) return "—";
  return (bps / 100).toFixed(2) + "%";
}

function formatPct(pct: number): string {
  return pct.toFixed(2) + "%";
}

function ProfitabilityCard({
  label,
  returnPct,
  vsCdiPct,
}: {
  label: string;
  returnPct: number;
  vsCdiPct: number;
}) {
  const isPositiveVsCdi = vsCdiPct >= 0;
  return (
    <div className="border-border bg-surface2 flex flex-col gap-1.5 rounded-xl border p-4">
      <p className="font-display font-700 text-text text-[16px]">{label}</p>
      <div>
        <p className="text-text-muted text-[12px]">Rentabilidade</p>
        <p className="font-money font-600 text-green text-[22px]">{formatPct(returnPct)}</p>
      </div>
      <p
        className={cn(
          "text-[12px] font-medium",
          isPositiveVsCdi ? "text-green" : "text-text-sub",
        )}
      >
        {isPositiveVsCdi ? "+" : ""}
        {formatPct(vsCdiPct)} {isPositiveVsCdi ? "acima" : "abaixo"} do CDI
      </p>
    </div>
  );
}

const VsCdiTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="border-border bg-surface rounded-lg border px-3 py-2 shadow-md">
      <p className="text-text-muted mb-1.5 text-[11px]">{label}</p>
      {payload.map((e: any) => (
        <p key={e.name} className="font-money text-[12px]" style={{ color: e.stroke }}>
          {e.name}: {e.value.toFixed(2)}%
        </p>
      ))}
    </div>
  );
};

export function AnalyticsInvestmentProfitabilityTab({ startDate, finishDate }: { startDate: string; finishDate: string }) {
  const totals = useInvestmentProfitabilityTotals(startDate, finishDate);
  const annualReturns = useInvestmentAnnualReturns(startDate, finishDate);
  const vsCdi = useInvestmentProfitabilityVsCdi(startDate, finishDate);

  const t = totals.data;
  const annualData = annualReturns.data;
  const rows = annualData?.rows ?? [];
  const monthlyCumulatives = annualData?.monthlyCumulatives ?? [];
  const grandTotal = annualData?.grandTotal ?? 0;
  const chartData = vsCdi.data ?? [];

  return (
    <div className="flex flex-col gap-5">
      {/* Totalizadores */}
      {t && (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          <ProfitabilityCard
            label="Rentabilidade total"
            returnPct={t.allTime.returnPct}
            vsCdiPct={t.allTime.vsCdiPct}
          />
          <ProfitabilityCard
            label="Últimos 12 meses"
            returnPct={t.last12Months.returnPct}
            vsCdiPct={t.last12Months.vsCdiPct}
          />
          <ProfitabilityCard
            label="Último mês"
            returnPct={t.lastMonth.returnPct}
            vsCdiPct={t.lastMonth.vsCdiPct}
          />
        </div>
      )}

      {/* Gráfico carteira vs CDI */}
      <div className="border-border bg-surface rounded-xl border p-5">
        <SectionHeader
          title="Carteira vs CDI"
          subtitle="Rentabilidade mensal da carteira comparada ao CDI"
        />
        {chartData.length === 0 ? (
          <ChartEmptyState message="Sem dados de rentabilidade no período" />
        ) : (
          <>
            <div style={{ height: 260 }}>
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData} margin={{ top: 4, right: 4, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                  <XAxis
                    dataKey="label"
                    tick={{ fill: "var(--text-muted)", fontSize: 12, fontFamily: "DM Sans" }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <YAxis
                    tick={{ fill: "var(--text-muted)", fontSize: 12, fontFamily: "JetBrains Mono" }}
                    axisLine={false}
                    tickLine={false}
                    tickFormatter={(v) => v.toFixed(2) + "%"}
                    width={58}
                  />
                  <Tooltip content={<VsCdiTooltip />} cursor={{ stroke: "var(--border)", strokeWidth: 1, strokeDasharray: "4 4" }} />
                  <Line
                    type="monotone"
                    dataKey="portfolioPct"
                    name="Carteira"
                    stroke="var(--green)"
                    strokeWidth={2}
                    dot={{ r: 3, fill: "var(--green)" }}
                    activeDot={{ r: 5 }}
                  />
                  <Line
                    type="monotone"
                    dataKey="cdiPct"
                    name="CDI"
                    stroke="var(--blue)"
                    strokeWidth={2}
                    strokeDasharray="5 3"
                    dot={{ r: 3, fill: "var(--blue)" }}
                    activeDot={{ r: 5 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
            <div className="mt-3 flex gap-4">
              <div className="flex items-center gap-1.5">
                <div className="h-2.5 w-2.5 rounded-[2px] bg-green" />
                <span className="text-text-muted text-[13px]">Carteira</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="h-2.5 w-2.5 rounded-[2px] bg-blue" />
                <span className="text-text-muted text-[13px]">CDI</span>
              </div>
            </div>
          </>
        )}
      </div>

      {/* Tabela de rentabilidade anual */}
      <div className="border-border bg-surface rounded-xl border p-5">
        <SectionHeader
          title="Rentabilidade por ano"
          subtitle="Retorno mensal e anual acumulado"
        />
        <div className="mt-4 overflow-x-auto">
          <table className="w-full min-w-[700px] text-[13px]">
            <thead>
              <tr className="border-border border-b">
                <th className="text-text-muted pb-2 pr-3 text-left font-medium">Ano</th>
                {MONTH_LABELS.map((m) => (
                  <th key={m} className="text-text-muted pb-2 px-1.5 text-right font-medium">
                    {m}
                  </th>
                ))}
                <th className="text-text-muted pb-2 pl-3 text-right font-medium">Total</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row, i) => (
                <tr
                  key={row.year}
                  className={cn(
                    "border-border border-b last:border-0",
                    i === rows.length - 1 && "font-500",
                  )}
                >
                  <td className="text-text py-2.5 pr-3 font-medium">{row.year}</td>
                  {row.months.map((m) => (
                    <td
                      key={m.month}
                      className={cn(
                        "font-money px-1.5 py-2.5 text-right tabular-nums",
                        m.returnBps === null
                          ? "text-text-muted"
                          : m.returnBps >= 0
                            ? "text-green"
                            : "text-red",
                      )}
                    >
                      {formatBps(m.returnBps)}
                    </td>
                  ))}
                  <td
                    className={cn(
                      "font-money pl-3 py-2.5 text-right font-600 tabular-nums",
                      row.annualReturnBps === null
                        ? "text-text-muted"
                        : row.annualReturnBps >= 0
                          ? "text-green"
                          : "text-red",
                    )}
                  >
                    {formatBps(row.annualReturnBps)}
                  </td>
                </tr>
              ))}
              {/* Linha de totais acumulados — pré-calculada pelo backend */}
              {rows.length > 0 && (
                <tr className="border-border border-t-2">
                  <td className="text-text py-2.5 pr-3 font-600">Total</td>
                  {monthlyCumulatives.map((val, idx) => (
                    <td
                      key={idx}
                      className={cn(
                        "font-money px-1.5 py-2.5 text-right font-600 tabular-nums",
                        val === null ? "text-text-muted" : val >= 0 ? "text-green" : "text-red",
                      )}
                    >
                      {formatBps(val)}
                    </td>
                  ))}
                  <td className={cn(
                    "font-money pl-3 py-2.5 text-right font-600 tabular-nums",
                    grandTotal >= 0 ? "text-green" : "text-red",
                  )}>
                    {formatBps(grandTotal)}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

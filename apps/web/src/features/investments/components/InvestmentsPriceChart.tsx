"use client";

import { useState, useMemo } from "react";
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, ReferenceLine,
} from "recharts";
import { Loader2 } from "lucide-react";
import { formatCurrency } from "@/lib/utils/formatCurrency";
import { formatPercentNeutral } from "@/lib/utils/formatNumber";
import { Card, CardHead } from "@/components/shared/Card";
import { PillSelect } from "@/components/shared/PillSelect";
import { useInvestmentPriceHistory } from "@/features/investments/hooks/useInvestments";
import type { Investment } from "@/lib/types/investments.types";
import { chartAnim } from "@/lib/config/chartAnimation";

const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-[13px] border border-[var(--border-color)] bg-[var(--surface)] px-3 py-2" style={{ boxShadow: "var(--shadow-md)" }}>
      <p className="mb-1 font-mono text-[11px] uppercase tracking-[0.1em] text-[var(--text-sub)]">{label}</p>
      <p className="font-mono text-[13px] font-medium tabular-nums text-[var(--text)]">
        {formatCurrency(payload[0].value / 100)}
      </p>
    </div>
  );
};

type Props = { investments: Investment[] };

export const InvestmentsPriceChart = ({ investments }: Props) => {
  const tickers = useMemo(() => investments.map((i) => i.ticker), [investments]);
  const [selected, setSelected] = useState<string>(tickers[0] ?? "");

  const investmentId = useMemo(
    () => investments.find((i) => i.ticker === selected)?.id ?? 0,
    [investments, selected],
  );

  const { data: history = [], isLoading } = useInvestmentPriceHistory(investmentId);

  const data = useMemo(() => {
    const slice = history.slice(-30);
    return slice.map((p) => {
      const [, month, day] = p.date.split("-");
      return { date: `${day}/${month}`, price: p.price };
    });
  }, [history]);

  const first      = data[0]?.price ?? 0;
  const last       = data[data.length - 1]?.price ?? 0;
  const isUp       = last >= first;
  const changePct  = first > 0 ? ((last - first) / first) * 100 : 0;
  const color      = isUp ? "var(--moss)" : "var(--clay)";

  const chip =
    !isLoading && data.length > 0 ? (
      <div className="flex items-center gap-2.5">
        <span className="shrink-0 font-mono text-[14px] tabular-nums text-[var(--text-sub)]">
          {formatCurrency(last / 100)}
        </span>
        <span
          className="shrink-0 rounded-full px-2 py-0.5 font-mono text-[12px] font-medium tabular-nums"
          style={{
            background: isUp ? "color-mix(in srgb, var(--moss) 14%, transparent)" : "color-mix(in srgb, var(--clay) 14%, transparent)",
            color: isUp ? "var(--moss)" : "var(--clay)",
          }}
        >
          {isUp ? "+ " : "− "}{formatPercentNeutral(Math.abs(changePct))}
        </span>
        <PillSelect
          options={tickers.map((t) => ({ value: t, label: t }))}
          value={selected}
          onChange={setSelected}
        />
      </div>
    ) : (
      <PillSelect
        options={tickers.map((t) => ({ value: t, label: t }))}
        value={selected}
        onChange={setSelected}
      />
    );

  if (tickers.length === 0) {
    return (
      <Card className="flex flex-col">
        <CardHead title="Variação de preço" subtitle="Histórico recente das posições" />
        <div className="flex flex-1 items-center justify-center py-10">
          <p className="text-[13px] text-[var(--text-sub)]">Nenhum ativo na carteira</p>
        </div>
      </Card>
    );
  }

  return (
    <Card className="flex flex-col">
      <CardHead title="Variação de preço" subtitle={`${selected} — últimos 30 dias`} right={chip} />

      {isLoading ? (
        <div className="flex flex-1 items-center justify-center" style={{ height: 220 }}>
          <Loader2 size={18} className="animate-spin text-[var(--brand-accent)]" />
        </div>
      ) : data.length === 0 ? (
        <div className="flex flex-1 items-center justify-center" style={{ height: 220 }}>
          <p className="max-w-[320px] text-center text-[13px] text-[var(--text-sub)]">
            Histórico ainda não disponível · será preenchido após o primeiro job da Brapi
          </p>
        </div>
      ) : (
        <div className="w-full" style={{ height: 220 }}>
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="investPriceGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={color} stopOpacity={0.22} />
                  <stop offset="100%" stopColor={color} stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid stroke="var(--border-color)" strokeDasharray="3 5" vertical={false} />
              <XAxis
                dataKey="date"
                tick={{ fill: "var(--text-sub)", fontSize: 10, fontFamily: "var(--font-mono, monospace)" }}
                axisLine={false}
                tickLine={false}
                interval={4}
              />
              <YAxis
                domain={["auto", "auto"]}
                tick={{ fill: "var(--text-sub)", fontSize: 10, fontFamily: "var(--font-mono, monospace)" }}
                tickFormatter={(v) => `R$${(v / 100).toFixed(0)}`}
                axisLine={false}
                tickLine={false}
                width={56}
              />
              <Tooltip content={<CustomTooltip />} />
              <ReferenceLine y={first} stroke="var(--border-color)" strokeDasharray="4 4" />
              <Area
                {...chartAnim(0)}
                type="monotone"
                dataKey="price"
                stroke={color}
                strokeWidth={2.5}
                fill="url(#investPriceGradient)"
                dot={false}
                activeDot={{ r: 5, fill: color, stroke: "var(--surface)", strokeWidth: 2 }}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      )}
    </Card>
  );
};

"use client";

import { useState, useMemo } from "react";
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, ReferenceLine,
} from "recharts";
import { Loader2 } from "lucide-react";
import { formatCurrency } from "@/lib/utils/formatCurrency";
import { PillSelect } from "@/components/shared/PillSelect";
import { cn } from "@/lib/utils";
import { useInvestmentPriceHistory } from "@/features/investments/hooks/useInvestments";
import type { Investment } from "@/lib/types/investments.types";

const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="border-border bg-surface rounded-lg border px-3 py-2 shadow-md">
      <p className="text-text-muted mb-1 text-[11px]">{label}</p>
      <p className="font-money text-text text-[13px] font-medium">
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

  const first = data[0]?.price ?? 0;
  const last  = data[data.length - 1]?.price ?? 0;
  const isUp  = last >= first;
  const changePct = first > 0 ? ((last - first) / first) * 100 : 0;
  const color = isUp ? "var(--green)" : "var(--red)";

  if (tickers.length === 0) {
    return (
      <div className="border-border bg-surface flex flex-col rounded-xl border p-5">
        <p className="font-display font-700 text-text text-[18px] tracking-tight">Variação de Preço</p>
        <div className="flex flex-1 items-center justify-center py-10">
          <p className="text-text-muted text-[13px]">Nenhum ativo na carteira</p>
        </div>
      </div>
    );
  }

  return (
    <div className="border-border bg-surface flex flex-col rounded-xl border p-5">
      <div className="mb-4 flex items-center justify-between gap-3">
        <div className="flex items-center gap-2.5 min-w-0">
          <h2 className="font-display font-700 text-text text-[18px] tracking-tight shrink-0">
            Variação de Preço
          </h2>
          {!isLoading && data.length > 0 && (
            <>
              <span className="font-money text-text-sub text-[14px] shrink-0">
                {formatCurrency(last / 100)}
              </span>
              <span className={cn(
                "font-mono text-[12px] font-medium px-2 py-0.5 rounded-full shrink-0",
                isUp ? "bg-green/10 text-green" : "bg-red/10 text-red",
              )}>
                {isUp ? "+" : ""}{changePct.toFixed(2)}%
              </span>
            </>
          )}
        </div>
        <PillSelect
          options={tickers.map((t) => ({ value: t, label: t }))}
          value={selected}
          onChange={setSelected}
        />
      </div>

      <p className="text-text-muted -mt-3 mb-3 text-[13px]">
        {selected} — últimos 30 dias
      </p>

      {isLoading ? (
        <div className="flex flex-1 items-center justify-center" style={{ height: 220 }}>
          <Loader2 size={18} className="text-green animate-spin" />
        </div>
      ) : data.length === 0 ? (
        <div className="flex flex-1 items-center justify-center" style={{ height: 220 }}>
          <p className="text-text-muted text-[13px]">
            Histórico ainda não disponível · será preenchido após o primeiro job da Brapi
          </p>
        </div>
      ) : (
        <div className="w-full" style={{ height: 220 }}>
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="priceGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={color} stopOpacity={0.22} />
                  <stop offset="100%" stopColor={color} stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid stroke="var(--border-chart)" vertical={true} />
              <XAxis
                dataKey="date"
                tick={{ fill: "var(--text-muted)", fontSize: 10, fontFamily: "DM Sans" }}
                axisLine={false}
                tickLine={false}
                interval={4}
              />
              <YAxis
                domain={["auto", "auto"]}
                tick={{ fill: "var(--text-muted)", fontSize: 10, fontFamily: "JetBrains Mono" }}
                tickFormatter={(v) => `R$${(v / 100).toFixed(0)}`}
                axisLine={false}
                tickLine={false}
                width={56}
              />
              <Tooltip content={<CustomTooltip />} />
              <ReferenceLine y={first} stroke="var(--border)" strokeDasharray="4 3" />
              <Area
                type="monotone"
                dataKey="price"
                stroke={color}
                strokeWidth={2}
                fill="url(#priceGradient)"
                dot={false}
                activeDot={{ r: 5, fill: color, stroke: "var(--surface)", strokeWidth: 2 }}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
};

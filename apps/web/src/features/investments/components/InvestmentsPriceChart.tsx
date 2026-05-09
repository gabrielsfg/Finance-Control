"use client";

import { useState, useMemo } from "react";
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, ReferenceLine,
} from "recharts";
import { formatCurrency } from "@/lib/utils/formatCurrency";
import { PillSelect } from "@/components/shared/PillSelect";
import { cn } from "@/lib/utils";
import type { Investment } from "@/lib/types/investments.types";

// ── Mock price history (30 days) ─────────────────────────────────────────────
// Keyed by ticker; values are closing prices in cents.
// Replace with Brapi API data when integration is done.
const MOCK_HISTORY: Record<string, number[]> = {
  PETR4:  [3412,3388,3401,3450,3423,3467,3490,3512,3478,3501,3534,3520,3488,3512,3560,3578,3545,3590,3612,3598,3634,3621,3650,3678,3645,3690,3712,3698,3724,3750],
  VALE3:  [6890,6920,6875,6910,6945,6930,6960,6985,6940,6970,7010,6990,7025,7050,7015,7040,7080,7060,7095,7120,7085,7110,7150,7130,7165,7190,7155,7180,7210,7240],
  ITUB4:  [3210,3225,3198,3240,3255,3232,3268,3280,3255,3275,3295,3270,3290,3310,3285,3305,3325,3300,3320,3345,3318,3338,3360,3335,3355,3378,3352,3372,3395,3420],
  BBDC4:  [1580,1595,1570,1610,1588,1625,1642,1618,1635,1658,1635,1652,1670,1648,1665,1685,1662,1680,1700,1678,1695,1715,1692,1710,1730,1708,1725,1745,1722,1750],
  WEGE3:  [4120,4145,4098,4160,4135,4178,4195,4210,4185,4205,4230,4208,4225,4248,4222,4242,4268,4245,4265,4288,4262,4282,4308,4285,4305,4330,4305,4328,4352,4380],
  DEFAULT:[1000,1010,1005,1015,1008,1020,1015,1025,1018,1030,1025,1035,1028,1040,1033,1045,1038,1050,1043,1055,1048,1060,1053,1065,1058,1070,1063,1075,1068,1080],
};

function getMockHistory(ticker: string): number[] {
  return MOCK_HISTORY[ticker] ?? MOCK_HISTORY.DEFAULT;
}

function buildChartData(prices: number[]) {
  const today = new Date();
  return prices.map((price, i) => {
    const d = new Date(today);
    d.setDate(d.getDate() - (prices.length - 1 - i));
    const label = `${String(d.getDate()).padStart(2, "0")}/${String(d.getMonth() + 1).padStart(2, "0")}`;
    return { date: label, price };
  });
}

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

  const prices    = getMockHistory(selected);
  const data      = buildChartData(prices);
  const first     = prices[0];
  const last      = prices[prices.length - 1];
  const isUp      = last >= first;
  const changePct = first > 0 ? ((last - first) / first) * 100 : 0;
  const color     = isUp ? "var(--green)" : "var(--red)";

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

      {/* Header row: título + preço atual + variação % + select */}
      <div className="mb-4 flex items-center justify-between gap-3">
        <div className="flex items-center gap-2.5 min-w-0">
          <h2 className="font-display font-700 text-text text-[18px] tracking-tight shrink-0">
            Variação de Preço
          </h2>
          <span className="font-money text-text-sub text-[14px] shrink-0">
            {formatCurrency(last / 100)}
          </span>
          <span className={cn(
            "font-mono text-[12px] font-medium px-2 py-0.5 rounded-full shrink-0",
            isUp ? "bg-green/10 text-green" : "bg-red/10 text-red",
          )}>
            {isUp ? "+" : ""}{changePct.toFixed(2)}%
          </span>
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

      <div className="w-full" style={{ height: 220 }}>
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id="priceGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={color} stopOpacity={0.22} />
                <stop offset="100%" stopColor={color} stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid stroke="var(--border)" strokeDasharray="3 3" vertical={true} />
            <XAxis
              dataKey="date"
              tick={{ fill: "var(--text-muted)", fontSize: 10, fontFamily: "DM Sans" }}
              axisLine={false}
              tickLine={false}
              interval={0}
              angle={-35}
              textAnchor="end"
              height={36}
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
              dot={{ r: 5, fill: color, stroke: "var(--surface)", strokeWidth: 2 }}
              activeDot={{ r: 7, fill: color, stroke: "var(--surface)", strokeWidth: 2 }}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      <p className="text-text-muted mt-2 text-center text-[10px]">
        Dados mockados · integração Brapi em breve
      </p>
    </div>
  );
};

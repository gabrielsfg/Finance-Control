"use client";

import {
  ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid,
} from "recharts";
import { SectionHeader } from "@/components/shared/SectionHeader";
import { formatCurrency, formatCurrencyCompact } from "@/lib/utils/formatCurrency";
import type { NetWorthPoint } from "@/lib/types/analytics.types";

const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="border-border bg-surface rounded-lg border px-3 py-2 shadow-md">
      <p className="text-text-muted mb-1.5 text-[11px]">{label}</p>
      {payload.map((e: any) => (
        <p key={e.name} className="font-money text-[12px]" style={{ color: e.stroke }}>
          {e.name}: {formatCurrency(e.value / 100)}
        </p>
      ))}
    </div>
  );
};

type Props = { data: NetWorthPoint[] };

export const AnalyticsNetWorthChart = ({ data }: Props) => {
  const latest = data[data.length - 1];

  return (
    <div className="border-border bg-surface rounded-xl border p-5">
      <SectionHeader title="Evolução Patrimonial" subtitle="Patrimônio líquido, ativos e passivos (últimos 7 meses)" />

      {latest && (
        <div className="bg-surface2 mb-5 grid grid-cols-3 gap-3 rounded-xl p-4">
          <div>
            <p className="text-text-muted text-[12px]">Patrimônio líquido</p>
            <p className="font-money font-600 text-green text-[18px]">{formatCurrency(latest.netWorth / 100)}</p>
          </div>
          <div>
            <p className="text-text-muted text-[12px]">Total de ativos</p>
            <p className="font-money font-600 text-text text-[18px]">{formatCurrency(latest.assets / 100)}</p>
          </div>
          <div>
            <p className="text-text-muted text-[12px]">Total de passivos</p>
            <p className="font-money font-600 text-red text-[18px]">{formatCurrency(latest.liabilities / 100)}</p>
          </div>
        </div>
      )}

      <div className="w-full" style={{ height: 280 }}>
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ top: 4, right: 4, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id="gradAssets" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="var(--blue)" stopOpacity={0.15} />
                <stop offset="95%" stopColor="var(--blue)" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="gradNetWorth" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="var(--green)" stopOpacity={0.2} />
                <stop offset="95%" stopColor="var(--green)" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="gradLiabilities" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="var(--red)" stopOpacity={0.15} />
                <stop offset="95%" stopColor="var(--red)" stopOpacity={0} />
              </linearGradient>
            </defs>
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
              tickFormatter={(v) => formatCurrencyCompact(v / 100)}
              width={70}
            />
            <Tooltip content={<CustomTooltip />} cursor={{ stroke: "var(--border)", strokeWidth: 1 }} />
            <Area type="monotone" dataKey="assets"      name="Ativos"              stroke="var(--blue)"  strokeWidth={2} fill="url(#gradAssets)" />
            <Area type="monotone" dataKey="netWorth"    name="Patrimônio líquido"  stroke="var(--green)" strokeWidth={2} fill="url(#gradNetWorth)" />
            <Area type="monotone" dataKey="liabilities" name="Passivos"            stroke="var(--red)"   strokeWidth={2} fill="url(#gradLiabilities)" strokeDasharray="4 3" />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      <div className="mt-3 flex gap-4">
        {[
          ["var(--blue)",  "Ativos"],
          ["var(--green)", "Patrimônio líquido"],
          ["var(--red)",   "Passivos"],
        ].map(([color, label]) => (
          <div key={label} className="flex items-center gap-1.5">
            <div className="h-2.5 w-2.5 rounded-[2px]" style={{ backgroundColor: color }} />
            <span className="text-text-muted text-[13px]">{label}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

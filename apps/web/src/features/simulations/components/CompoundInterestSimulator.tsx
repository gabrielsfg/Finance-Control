"use client";

import { useState, useMemo } from "react";
import {
  ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid,
} from "recharts";
import { SectionHeader } from "@/components/shared/SectionHeader";
import { formatCurrency, formatCurrencyCompact } from "@/lib/utils/formatCurrency";
import { cn } from "@/lib/utils";

type DataPoint = { month: number; label: string; total: number; invested: number; interest: number };

const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="border-border bg-surface rounded-lg border px-3 py-2 shadow-md">
      <p className="text-text-muted mb-1.5 text-[11px]">{label}</p>
      {payload.map((e: any) => (
        <p key={e.name} className="font-money text-[12px]" style={{ color: e.stroke ?? e.fill }}>
          {e.name}: {formatCurrency(e.value / 100)}
        </p>
      ))}
    </div>
  );
};

const inputCls = "border-border bg-surface2 text-text placeholder:text-text-muted w-full rounded-lg border h-9 px-3 text-[13px] outline-none focus:border-green/60 transition-colors";

export const CompoundInterestSimulator = () => {
  const [initialAmount, setInitialAmount] = useState("10000");
  const [monthlyContrib, setMonthlyContrib] = useState("500");
  const [annualRate, setAnnualRate] = useState("12");
  const [years, setYears] = useState("10");

  const data = useMemo<DataPoint[]>(() => {
    const initial = parseFloat(initialAmount.replace(",", ".")) * 100 || 0;
    const monthly = parseFloat(monthlyContrib.replace(",", ".")) * 100 || 0;
    const rate = parseFloat(annualRate.replace(",", ".")) / 100 / 12 || 0;
    const months = parseInt(years) * 12 || 0;

    const points: DataPoint[] = [];
    let total = initial;
    let invested = initial;

    for (let m = 1; m <= months; m++) {
      total = total * (1 + rate) + monthly;
      invested += monthly;
      if (m % 12 === 0 || m === months) {
        const yr = Math.floor(m / 12);
        points.push({
          month: m,
          label: `Ano ${yr}`,
          total: Math.round(total),
          invested: Math.round(invested),
          interest: Math.round(total - invested),
        });
      }
    }
    return points;
  }, [initialAmount, monthlyContrib, annualRate, years]);

  const last = data[data.length - 1];

  return (
    <div className="border-border bg-surface rounded-xl border p-5">
      <SectionHeader title="Juros Compostos" subtitle="Simulação de crescimento patrimonial" />

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 mb-6">
        <div>
          <label className="text-text-muted mb-1.5 block text-[12px]">Valor inicial (R$)</label>
          <input className={inputCls} value={initialAmount} onChange={(e) => setInitialAmount(e.target.value)} placeholder="10000" />
        </div>
        <div>
          <label className="text-text-muted mb-1.5 block text-[12px]">Aporte mensal (R$)</label>
          <input className={inputCls} value={monthlyContrib} onChange={(e) => setMonthlyContrib(e.target.value)} placeholder="500" />
        </div>
        <div>
          <label className="text-text-muted mb-1.5 block text-[12px]">Taxa anual (%)</label>
          <input className={inputCls} value={annualRate} onChange={(e) => setAnnualRate(e.target.value)} placeholder="12" />
        </div>
        <div>
          <label className="text-text-muted mb-1.5 block text-[12px]">Período (anos)</label>
          <input className={inputCls} value={years} onChange={(e) => setYears(e.target.value)} placeholder="10" />
        </div>
      </div>

      {last && (
        <div className="bg-surface2 mb-6 grid grid-cols-3 gap-3 rounded-xl p-4">
          <div>
            <p className="text-text-muted text-[12px]">Patrimônio final</p>
            <p className="font-money font-600 text-green text-[20px]">{formatCurrency(last.total / 100)}</p>
          </div>
          <div>
            <p className="text-text-muted text-[12px]">Total investido</p>
            <p className="font-money font-600 text-text text-[20px]">{formatCurrency(last.invested / 100)}</p>
          </div>
          <div>
            <p className="text-text-muted text-[12px]">Juros ganhos</p>
            <p className="font-money font-600 text-blue text-[20px]">{formatCurrency(last.interest / 100)}</p>
          </div>
        </div>
      )}

      <div style={{ minHeight: 220 }}>
        <ResponsiveContainer width="100%" height={220}>
          <AreaChart data={data} margin={{ top: 4, right: 4, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id="gradTotal" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="var(--green)" stopOpacity={0.2} />
                <stop offset="95%" stopColor="var(--green)" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="gradInvested" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="var(--blue)" stopOpacity={0.15} />
                <stop offset="95%" stopColor="var(--blue)" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
            <XAxis dataKey="label" tick={{ fill: "var(--text-muted)", fontSize: 12, fontFamily: "DM Sans" }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fill: "var(--text-muted)", fontSize: 12, fontFamily: "JetBrains Mono" }} axisLine={false} tickLine={false} tickFormatter={(v) => formatCurrencyCompact(v / 100)} width={70} />
            <Tooltip content={<CustomTooltip />} />
            <Area type="monotone" dataKey="total" name="Patrimônio" stroke="var(--green)" strokeWidth={2} fill="url(#gradTotal)" />
            <Area type="monotone" dataKey="invested" name="Investido" stroke="var(--blue)" strokeWidth={2} fill="url(#gradInvested)" />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      <div className="mt-3 flex gap-4">
        {[["var(--green)", "Patrimônio"], ["var(--blue)", "Investido"]].map(([color, label]) => (
          <div key={label} className="flex items-center gap-1.5">
            <div className="h-2.5 w-2.5 rounded-[2px]" style={{ backgroundColor: color }} />
            <span className="text-text-muted text-[13px]">{label}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

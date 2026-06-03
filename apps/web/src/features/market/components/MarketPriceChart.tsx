"use client";

import { useState, useMemo, useRef, useEffect } from "react";
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, ReferenceLine,
} from "recharts";
import { X } from "lucide-react";
import { DateRangePicker } from "@/components/shared/DateRangePicker";
import { formatCurrency } from "@/lib/utils/formatCurrency";
import { cn } from "@/lib/utils";
import type { PricePoint } from "@/lib/types/market.types";

type PresetPeriod = "1D" | "7D" | "15D" | "1M" | "3M" | "6M" | "1A" | "5A" | "10A" | "15A";
type Period = PresetPeriod | "custom";

const PRESETS: { label: PresetPeriod; days: number }[] = [
  { label: "1D",  days: 1   },
  { label: "7D",  days: 7   },
  { label: "15D", days: 15  },
  { label: "1M",  days: 22  },
  { label: "3M",  days: 66  },
  { label: "6M",  days: 132 },
  { label: "1A",  days: 252 },
  { label: "5A",  days: 1260 },
  { label: "10A", days: 2520 },
  { label: "15A", days: 3780 },
];

const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="border-border bg-surface rounded-lg border px-3 py-2 shadow-lg">
      <p className="text-text-muted mb-1 text-[11px]">{label}</p>
      <p className="font-money text-text text-[13px] font-medium">
        {formatCurrency(payload[0].value / 100)}
      </p>
    </div>
  );
};

type Props = { ticker: string; history: PricePoint[] };

export const MarketPriceChart = ({ ticker, history }: Props) => {
  const [period, setPeriod] = useState<Period>("1M");
  const [customFrom, setCustomFrom] = useState("");
  const [customTo, setCustomTo]     = useState("");
  const [showCalendar, setShowCalendar] = useState(false);
  const calendarRef = useRef<HTMLDivElement>(null);
  const toggleRef   = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!showCalendar) return;
    function handleClickOutside(e: MouseEvent) {
      const target = e.target as Node;
      if (calendarRef.current?.contains(target)) return;
      if (toggleRef.current?.contains(target)) return;
      setShowCalendar(false);
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [showCalendar]);

  const minDate = history.length > 0 ? history[0].date : "";
  const maxDate = history.length > 0 ? history[history.length - 1].date : "";

  const data = useMemo(() => {
    let slice: PricePoint[];

    if (period === "custom") {
      const from = customFrom || minDate;
      const to   = customTo   || maxDate;
      slice = history.filter((p) => p.date >= from && p.date <= to);
    } else if (period === "1D") {
      // Show yesterday → today: always 2 points so the chart draws a line
      slice = history.slice(-2);
    } else {
      const days = PRESETS.find((p) => p.label === period)?.days ?? 22;
      slice = history.slice(-days);
    }

    const totalPoints = slice.length;

    // For large ranges, sample to keep chart readable (max ~300 points)
    const step = totalPoints > 300 ? Math.ceil(totalPoints / 300) : 1;

    return slice
      .filter((_, i) => i % step === 0 || i === totalPoints - 1)
      .map((p) => {
        const [year, month, day] = p.date.split("-");
        const showYear = period === "5A" || period === "10A" || period === "15A" ||
                         (period === "custom" && customFrom && customTo &&
                          new Date(customTo).getFullYear() - new Date(customFrom).getFullYear() >= 2);
        const label = showYear ? `${month}/${year.slice(2)}` : `${day}/${month}`;
        return { date: label, fullDate: p.date, price: p.price };
      });
  }, [history, period, customFrom, customTo, minDate, maxDate]);

  if (history.length === 0) {
    return (
      <div className="border-border bg-surface flex items-center justify-center rounded-xl border p-5 h-[300px]">
        <p className="text-text-muted text-[13px]">Histórico de preço não disponível ainda.</p>
      </div>
    );
  }

  const first     = data[0]?.price ?? 0;
  const last      = data[data.length - 1]?.price ?? 0;
  const isUp      = last >= first;
  const color     = isUp ? "var(--green)" : "var(--red)";
  const changePct = first > 0 ? ((last - first) / first) * 100 : null;

  const tickInterval = Math.max(1, Math.floor(data.length / 6));

  const periodLabel = period === "custom"
    ? (customFrom && customTo ? `${customFrom.slice(8)}/${customFrom.slice(5,7)}/${customFrom.slice(0,4)} – ${customTo.slice(8)}/${customTo.slice(5,7)}/${customTo.slice(0,4)}` : "Personalizado")
    : period;

  return (
    <div className="border-border bg-surface rounded-xl border p-5">
      <div className="mb-4 flex flex-col gap-3">
        {/* Header row */}
        <div className="flex items-start justify-between gap-3">
          <div>
            <h3 className="font-display font-700 text-text text-[16px] tracking-tight">Histórico de Preço</h3>
            <div className="mt-0.5 flex items-center gap-2">
              <p className="text-text-muted text-[12px]">{ticker} — {periodLabel}</p>
              {changePct !== null && (
                <span
                  className="rounded-md px-1.5 py-0.5 text-[11px] font-medium font-mono"
                  style={{
                    color,
                    backgroundColor: isUp
                      ? "color-mix(in srgb, var(--green) 12%, transparent)"
                      : "color-mix(in srgb, var(--red) 12%, transparent)",
                  }}
                >
                  {isUp ? "+" : ""}{changePct.toFixed(2)}%
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Period buttons */}
        <div className="flex flex-wrap items-center gap-1">
          {PRESETS.map(({ label }) => (
            <button
              key={label}
              onClick={() => setPeriod(label)}
              className={cn(
                "h-7 rounded-lg px-2.5 text-[11px] font-medium transition-colors",
                period === label
                  ? "bg-green/15 text-green"
                  : "text-text-sub hover:bg-surface2 hover:text-text",
              )}
            >
              {label}
            </button>
          ))}

          {/* Custom period toggle */}
          <button
            ref={toggleRef}
            onClick={() => { setPeriod("custom"); setShowCalendar((v) => period === "custom" ? !v : true); }}
            className={cn(
              "h-7 rounded-lg px-2.5 text-[11px] font-medium transition-colors",
              period === "custom"
                ? "bg-green/15 text-green"
                : "text-text-sub hover:bg-surface2 hover:text-text",
            )}
          >
            Personalizado
          </button>
        </div>

        {/* Custom date picker */}
        {period === "custom" && showCalendar && (
          <div ref={calendarRef} className="border-border bg-surface2/40 w-full max-w-[300px] rounded-xl border p-3">
            <div className="mb-2 flex items-center justify-between">
              <span className="text-text text-[12px] font-medium">Período personalizado</span>
              <button
                onClick={() => setShowCalendar(false)}
                aria-label="Fechar calendário"
                className="text-text-muted hover:text-text flex h-6 w-6 items-center justify-center rounded-full transition-colors hover:bg-surface2"
              >
                <X size={14} />
              </button>
            </div>
            <DateRangePicker
              startDate={customFrom}
              finishDate={customTo}
              minDate={minDate}
              maxDate={maxDate}
              onChange={(start, finish) => { setCustomFrom(start); setCustomTo(finish); }}
            />
            {minDate && maxDate && (
              <p className="text-text-muted mt-2 text-center text-[11px]">
                Disponível: {minDate.slice(0, 4)} – {maxDate.slice(0, 4)}
              </p>
            )}
          </div>
        )}
      </div>

      <div style={{ height: 220 }}>
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id={`priceGradient-${ticker}`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={color} stopOpacity={0.2} />
                <stop offset="100%" stopColor={color} stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid stroke="var(--border-chart)" vertical={false} />
            <XAxis
              dataKey="date"
              tick={{ fill: "var(--text-muted)", fontSize: 10, fontFamily: "DM Sans" }}
              axisLine={false}
              tickLine={false}
              interval={tickInterval - 1}
            />
            <YAxis
              domain={["auto", "auto"]}
              tick={{ fill: "var(--text-muted)", fontSize: 10, fontFamily: "JetBrains Mono" }}
              tickFormatter={(v) => `R$${(v / 100).toFixed(0)}`}
              axisLine={false}
              tickLine={false}
              width={60}
            />
            <Tooltip content={<CustomTooltip />} />
            <ReferenceLine y={first} stroke="var(--border)" strokeDasharray="4 3" />
            <Area
              type="monotone"
              dataKey="price"
              stroke={color}
              strokeWidth={2}
              fill={`url(#priceGradient-${ticker})`}
              dot={false}
              activeDot={{ r: 5, fill: color, stroke: "var(--surface)", strokeWidth: 2 }}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

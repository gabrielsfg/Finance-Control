"use client";

import { useState, useMemo, useRef, useEffect } from "react";
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, ReferenceLine,
} from "recharts";
import { X } from "lucide-react";
import { Card } from "@/components/shared/Card";
import { Money } from "@/components/shared/Money";
import { DateRangePicker } from "@/components/shared/DateRangePicker";
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
    <div
      className="rounded-[13px] border border-[var(--border-color)] bg-[var(--surface)] px-3 py-2"
      style={{ boxShadow: "var(--shadow-sm)" }}
    >
      <p className="mb-1 font-mono text-[11px] tracking-[0.04em] text-[var(--text-sub)]">{label}</p>
      <Money cents={payload[0].value} className="text-[13px]" />
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
      <Card className="flex h-[300px] items-center justify-center">
        <p className="text-[13px] text-[var(--text-sub)]">Histórico de preço não disponível ainda.</p>
      </Card>
    );
  }

  const first     = data[0]?.price ?? 0;
  const last      = data[data.length - 1]?.price ?? 0;
  const isUp      = last >= first;
  const color     = isUp ? "var(--moss)" : "var(--clay)";
  const changePct = first > 0 ? ((last - first) / first) * 100 : null;

  const tickInterval = Math.max(1, Math.floor(data.length / 6));

  const periodLabel = period === "custom"
    ? (customFrom && customTo ? `${customFrom.slice(8)}/${customFrom.slice(5,7)}/${customFrom.slice(0,4)} – ${customTo.slice(8)}/${customTo.slice(5,7)}/${customTo.slice(0,4)}` : "Personalizado")
    : period;

  return (
    <Card>
      <div className="mb-4 flex flex-col gap-3">
        {/* Header row */}
        <div className="flex items-start justify-between gap-3">
          <div>
            <h3 className="font-display text-[17px] font-bold tracking-[-0.01em] text-[var(--text)]">Histórico de preço</h3>
            <div className="mt-0.5 flex items-center gap-2">
              <p className="font-mono text-[12px] tracking-[0.04em] text-[var(--text-sub)]">{ticker} — {periodLabel}</p>
              {changePct !== null && (
                <span
                  className="rounded-[9px] px-1.5 py-0.5 font-mono text-[11px] font-medium tabular-nums"
                  style={{
                    color,
                    background: isUp
                      ? "color-mix(in srgb, var(--moss) 12%, transparent)"
                      : "color-mix(in srgb, var(--clay) 12%, transparent)",
                  }}
                >
                  {isUp ? "+" : ""}{changePct.toFixed(2)}%
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Period buttons */}
        <div className="inline-flex flex-wrap items-center gap-[3px] rounded-[13px] border border-[var(--border-color)] bg-[var(--surface2)] p-[4px]">
          {PRESETS.map(({ label }) => (
            <button
              key={label}
              onClick={() => setPeriod(label)}
              className={cn(
                "rounded-[9px] px-2.5 py-1 font-mono text-[11px] font-medium tabular-nums transition-colors",
                period === label
                  ? "bg-[var(--surface)] text-[var(--text)] shadow-sm"
                  : "text-[var(--text-sub)] hover:text-[var(--text)]",
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
              "rounded-[9px] px-2.5 py-1 font-mono text-[11px] font-medium transition-colors",
              period === "custom"
                ? "bg-[var(--surface)] text-[var(--text)] shadow-sm"
                : "text-[var(--text-sub)] hover:text-[var(--text)]",
            )}
          >
            Personalizado
          </button>
        </div>

        {/* Custom date picker */}
        {period === "custom" && showCalendar && (
          <div ref={calendarRef} className="w-full max-w-[300px] rounded-[20px] border border-[var(--border-color)] bg-[var(--surface2)] p-3">
            <div className="mb-2 flex items-center justify-between">
              <span className="text-[12px] font-medium text-[var(--text)]">Período personalizado</span>
              <button
                onClick={() => setShowCalendar(false)}
                aria-label="Fechar calendário"
                className="flex h-6 w-6 items-center justify-center rounded-full text-[var(--text-sub)] transition-colors hover:bg-[var(--surface)] hover:text-[var(--text)]"
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
              <p className="mt-2 text-center font-mono text-[11px] text-[var(--text-sub)]">
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
            <CartesianGrid stroke="var(--border-color)" strokeDasharray="3 5" vertical={false} />
            <XAxis
              dataKey="date"
              tick={{ fill: "var(--text-sub)", fontSize: 10, fontFamily: "var(--font-mono, monospace)" }}
              axisLine={false}
              tickLine={false}
              interval={tickInterval - 1}
            />
            <YAxis
              domain={["auto", "auto"]}
              tick={{ fill: "var(--text-sub)", fontSize: 10, fontFamily: "var(--font-mono, monospace)" }}
              tickFormatter={(v) => `R$${(v / 100).toFixed(0)}`}
              axisLine={false}
              tickLine={false}
              width={60}
            />
            <Tooltip content={<CustomTooltip />} cursor={{ stroke: "var(--border-color)", strokeWidth: 1 }} />
            <ReferenceLine y={first} stroke="var(--border-color)" strokeDasharray="4 3" />
            <Area
              type="monotone"
              dataKey="price"
              stroke={color}
              strokeWidth={2.5}
              fill={`url(#priceGradient-${ticker})`}
              dot={false}
              activeDot={{ r: 5, fill: color, stroke: "var(--surface)", strokeWidth: 2 }}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </Card>
  );
};

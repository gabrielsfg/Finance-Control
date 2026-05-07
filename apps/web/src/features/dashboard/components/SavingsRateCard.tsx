"use client";

import { useEffect, useRef } from "react";
import { TrendingUp, ArrowUp } from "lucide-react";
import { Chart, registerables } from "chart.js";
import { formatPercent } from "@/lib/utils/formatNumber";

Chart.register(...registerables);

type Props = {
  savingsRate: number;
  savingsRateHistory?: number[];
  change?: number;
};

const DEFAULT_HISTORY = [41, 38, 21, 40, 45, 44, 51];

export const SavingsRateCard = ({
  savingsRate,
  savingsRateHistory = DEFAULT_HISTORY,
  change,
}: Props) => {
  const sparkRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (!sparkRef.current) return;
    const existing = Chart.getChart(sparkRef.current);
    if (existing) existing.destroy();

    new Chart(sparkRef.current.getContext("2d")!, {
      type: "line",
      data: {
        labels: savingsRateHistory.map((_, i) => `M${i + 1}`),
        datasets: [
          {
            data: savingsRateHistory,
            borderColor: "#00c98d",
            backgroundColor: "#00c98d25",
            fill: true,
            tension: 0.4,
            borderWidth: 2,
            pointRadius: 0,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: { legend: { display: false }, tooltip: { callbacks: { label: (c) => ` ${c.raw}%` } } },
        scales: { x: { display: false }, y: { display: false } },
      },
    });
  }, [savingsRateHistory]);

  const rawChange = change ?? (savingsRateHistory.length >= 2
    ? savingsRateHistory[savingsRateHistory.length - 1] - savingsRateHistory[savingsRateHistory.length - 2]
    : 0);
  const isPositive = rawChange >= 0;

  return (
    <div className="border-border bg-surface flex flex-col gap-2 rounded-xl border p-5">
      <div className="flex items-center justify-between">
        <span className="text-text-muted text-[12px] uppercase tracking-[0.04em]">
          Taxa de Poupança
        </span>
        <div className="bg-green/15 flex h-8 w-8 items-center justify-center rounded-[8px]">
          <TrendingUp size={15} strokeWidth={1.75} className="text-green" />
        </div>
      </div>

      <p className="font-money font-600 text-green text-[24px] tracking-tight leading-none">
        {savingsRate.toFixed(1)}%
      </p>

      <div className="h-9">
        <canvas ref={sparkRef} />
      </div>

      <div className="flex items-center gap-1">
        <ArrowUp
          size={12}
          className={isPositive ? "text-green" : "text-red rotate-180"}
        />
        <span className={`font-mono text-[11px] ${isPositive ? "text-green" : "text-red"}`}>
          {isPositive ? "+" : ""}{rawChange.toFixed(1)}pp
        </span>
        <span className="text-text-muted text-[11px]">vs. mês anterior</span>
      </div>
    </div>
  );
};

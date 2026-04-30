"use client";

import { useState, useMemo } from "react";
import { Target, TrendingUp, Clock } from "lucide-react";
import { SectionHeader } from "@/components/shared/SectionHeader";
import { formatCurrency } from "@/lib/utils/formatCurrency";

const inputCls = "border-border bg-surface2 text-text placeholder:text-text-muted w-full rounded-lg border h-9 px-3 text-[13px] outline-none focus:border-green/60 transition-colors";

export const GoalProjection = () => {
  const [goalAmount, setGoalAmount] = useState("50000");
  const [currentSavings, setCurrentSavings] = useState("5000");
  const [monthlyContrib, setMonthlyContrib] = useState("1000");
  const [annualRate, setAnnualRate] = useState("10");

  const result = useMemo(() => {
    const goal = parseFloat(goalAmount.replace(",", ".")) * 100 || 0;
    const current = parseFloat(currentSavings.replace(",", ".")) * 100 || 0;
    const monthly = parseFloat(monthlyContrib.replace(",", ".")) * 100 || 0;
    const rate = parseFloat(annualRate.replace(",", ".")) / 100 / 12 || 0;

    if (goal <= 0 || monthly <= 0) return null;

    let total = current;
    let months = 0;

    while (total < goal && months < 1200) {
      total = total * (1 + rate) + monthly;
      months++;
    }

    const years = Math.floor(months / 12);
    const remainingMonths = months % 12;
    const totalInvested = current + monthly * months;
    const interestEarned = total - totalInvested;

    return { months, years, remainingMonths, totalInvested, interestEarned, finalAmount: total };
  }, [goalAmount, currentSavings, monthlyContrib, annualRate]);

  return (
    <div className="border-border bg-surface rounded-xl border p-5">
      <SectionHeader title="Projeção de Meta" subtitle="Quanto tempo para atingir seu objetivo" />

      <div className="grid grid-cols-2 gap-3 mb-6">
        <div>
          <label className="text-text-muted mb-1.5 block text-[12px]">Meta (R$)</label>
          <input className={inputCls} value={goalAmount} onChange={(e) => setGoalAmount(e.target.value)} placeholder="50000" />
        </div>
        <div>
          <label className="text-text-muted mb-1.5 block text-[12px]">Guardado hoje (R$)</label>
          <input className={inputCls} value={currentSavings} onChange={(e) => setCurrentSavings(e.target.value)} placeholder="5000" />
        </div>
        <div>
          <label className="text-text-muted mb-1.5 block text-[12px]">Aporte mensal (R$)</label>
          <input className={inputCls} value={monthlyContrib} onChange={(e) => setMonthlyContrib(e.target.value)} placeholder="1000" />
        </div>
        <div>
          <label className="text-text-muted mb-1.5 block text-[12px]">Taxa anual (%)</label>
          <input className={inputCls} value={annualRate} onChange={(e) => setAnnualRate(e.target.value)} placeholder="10" />
        </div>
      </div>

      {result ? (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          <div className="border-border bg-surface2 rounded-xl border p-4">
            <div className="bg-green/10 mb-3 flex h-9 w-9 items-center justify-center rounded-[10px]">
              <Clock size={18} className="text-green" strokeWidth={1.75} />
            </div>
            <p className="font-display font-700 text-text text-[15px]">Tempo estimado</p>
            <p className="font-display font-700 text-text mt-1 text-[18px]">
              {result.years > 0 ? `${result.years}a ` : ""}{result.remainingMonths > 0 ? `${result.remainingMonths}m` : result.years === 0 ? "< 1 mês" : ""}
            </p>
            <p className="text-text-muted mt-0.5 text-[12px]">{result.months} meses no total</p>
          </div>
          <div className="border-border bg-surface2 rounded-xl border p-4">
            <div className="bg-blue/10 mb-3 flex h-9 w-9 items-center justify-center rounded-[10px]">
              <Target size={18} className="text-blue" strokeWidth={1.75} />
            </div>
            <p className="font-display font-700 text-text text-[15px]">Total investido</p>
            <p className="font-money font-700 text-text mt-1 text-[18px]">
              {formatCurrency(result.totalInvested / 100)}
            </p>
          </div>
          <div className="border-border bg-surface2 rounded-xl border p-4">
            <div className="bg-purple/10 mb-3 flex h-9 w-9 items-center justify-center rounded-[10px]">
              <TrendingUp size={18} className="text-purple" strokeWidth={1.75} />
            </div>
            <p className="font-display font-700 text-text text-[15px]">Juros ganhos</p>
            <p className="font-money font-700 text-green mt-1 text-[18px]">
              +{formatCurrency(result.interestEarned / 100)}
            </p>
          </div>
        </div>
      ) : (
        <div className="bg-surface2 flex h-24 items-center justify-center rounded-xl">
          <p className="text-text-muted text-[13px]">Preencha os campos para ver a projeção</p>
        </div>
      )}
    </div>
  );
};

"use client";

import { Zap, Check } from "lucide-react";

const PREMIUM_FEATURES = [
  "Insights de IA ilimitados",
  "Integração com B3 e corretoras",
  "Histórico ilimitado",
  "Simulações avançadas",
];

const FREE_LIMITS = [
  "Até 3 contas bancárias",
  "1 orçamento ativo",
  "Dashboard básico",
];

export const ProfilePlanCard = () => {
  const isPremium = false;

  if (isPremium) {
    return (
      <div className="rounded-2xl border border-purple/30 bg-gradient-to-br from-purple/15 to-purple/5 p-5">
        <div className="mb-1 flex items-center gap-1.5">
          <Zap size={13} className="text-purple" />
          <span className="text-[11px] font-semibold tracking-widest text-purple uppercase">
            Plano Premium
          </span>
        </div>
        <ul className="mt-3 flex flex-col gap-2">
          {PREMIUM_FEATURES.map((f) => (
            <li key={f} className="flex items-center gap-2">
              <Check size={12} className="text-purple shrink-0" />
              <span className="text-text-sub text-[13px]">{f}</span>
            </li>
          ))}
        </ul>
        <div className="border-border/50 mt-4 border-t pt-3">
          <p className="text-text-muted text-[11px]">Renovação em 15/05/2026 · R$ 29,90/mês</p>
        </div>
      </div>
    );
  }

  return (
    <div className="border-border bg-surface rounded-2xl border p-5">
      <div className="mb-1 flex items-center gap-1.5">
        <span className="text-[11px] font-semibold tracking-widest text-text-muted uppercase">
          Plano Free
        </span>
      </div>
      <ul className="mt-3 flex flex-col gap-2">
        {FREE_LIMITS.map((f) => (
          <li key={f} className="flex items-center gap-2">
            <Check size={12} className="text-text-muted shrink-0" />
            <span className="text-text-muted text-[13px]">{f}</span>
          </li>
        ))}
      </ul>
      <div className="border-border mt-4 border-t pt-4">
        <p className="text-text-muted mb-3 text-[12px]">
          Faça upgrade para desbloquear analytics avançado, simulações, AI Insights e muito mais.
        </p>
        <button className="from-purple to-blue w-full rounded-lg bg-gradient-to-r py-2.5 text-[13px] font-semibold text-white transition-opacity hover:opacity-90">
          <Zap size={13} className="mr-1.5 inline-block" />
          Fazer upgrade
        </button>
      </div>
    </div>
  );
};

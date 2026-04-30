"use client";

import { Zap, Check } from "lucide-react";
import { SectionHeader } from "@/components/shared/SectionHeader";
import type { UserProfile } from "@/lib/types/profile.types";

const FREE_FEATURES = [
  "Até 3 contas bancárias",
  "Transações ilimitadas",
  "1 orçamento ativo",
  "Dashboard básico",
];

const PREMIUM_FEATURES = [
  "Contas ilimitadas",
  "Orçamentos ilimitados",
  "Analytics avançado",
  "Simulações e projeções",
  "AI Daily Insight",
  "Exportação de dados",
];

type Props = { profile: UserProfile };

export const ProfilePlanCard = ({ profile }: Props) => {
  const isPremium = profile.plan === "Premium";

  return (
    <div className="border-border bg-surface rounded-xl border p-5">
      <SectionHeader title="Plano" />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        {/* Free */}
        <div className={`rounded-xl border p-4 ${!isPremium ? "border-green/40 bg-green/5" : "border-border bg-surface2"}`}>
          <div className="mb-3 flex items-center justify-between">
            <p className="font-display font-700 text-text text-[16px]">Free</p>
            {!isPremium && <span className="bg-green/15 text-green rounded-full px-2.5 py-0.5 text-[11px] font-medium">Atual</span>}
          </div>
          <p className="font-money font-700 text-text mb-3 text-[24px]">R$ 0<span className="text-text-muted text-[14px] font-normal">/mês</span></p>
          <ul className="flex flex-col gap-2">
            {FREE_FEATURES.map((f) => (
              <li key={f} className="flex items-center gap-2">
                <Check size={13} className="text-green shrink-0" />
                <span className="text-text-sub text-[13px]">{f}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Premium */}
        <div className={`rounded-xl border p-4 ${isPremium ? "border-purple/40 bg-purple/5" : "border-border bg-surface2"}`}>
          <div className="mb-3 flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <Zap size={15} className="text-purple" />
              <p className="font-display font-700 text-text text-[16px]">Premium</p>
            </div>
            {isPremium && <span className="bg-purple/15 text-purple rounded-full px-2.5 py-0.5 text-[11px] font-medium">Atual</span>}
          </div>
          <p className="font-money font-700 text-text mb-3 text-[24px]">R$ 19,90<span className="text-text-muted text-[14px] font-normal">/mês</span></p>
          <ul className="flex flex-col gap-2 mb-4">
            {PREMIUM_FEATURES.map((f) => (
              <li key={f} className="flex items-center gap-2">
                <Check size={13} className="text-purple shrink-0" />
                <span className="text-text-sub text-[13px]">{f}</span>
              </li>
            ))}
          </ul>
          {!isPremium && (
            <button className="w-full rounded-lg bg-gradient-to-r from-purple to-blue py-2 text-[13px] font-medium text-white transition-opacity hover:opacity-90">
              Fazer upgrade
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

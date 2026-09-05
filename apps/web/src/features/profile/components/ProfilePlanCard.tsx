"use client";

import { Check, Plus } from "lucide-react";
import { Card, CardHead, LedgerRule } from "@/components/shared/Card";
import { useProfile } from "@/features/profile/hooks/useProfile";
import { PremiumUpgradeButton } from "@/components/shared/PremiumNotice";
import { PREMIUM_FEATURES } from "@/lib/config/premium";

const FREE_FEATURES = ["Contas e categorias ilimitadas", "Análises dos últimos 12 meses"];

export const ProfilePlanCard = () => {
  const { data: profile } = useProfile();
  const isPremium = profile?.plan === "Premium";

  if (isPremium) {
    return (
      <Card>
        <CardHead title="Plano" />
        <div className="mb-1 flex items-center justify-between">
          <span className="font-display text-[18px] font-bold text-[var(--text)]">Premium</span>
          <span
            className="rounded-full px-[11px] py-[5px] font-mono text-[11px] tracking-[0.06em]"
            style={{ background: "color-mix(in srgb, var(--gold) 18%, transparent)", color: "var(--gold)" }}
          >
            Ativo
          </span>
        </div>
        <p className="m-0 mb-3.5 text-[13px] text-[var(--text-sub)]">
          Todos os recursos liberados nesta conta.
        </p>
        <LedgerRule />
        <div className="my-3.5 flex flex-col gap-2.5">
          {PREMIUM_FEATURES.map((f) => (
            <div key={f} className="flex items-center gap-2.5 text-[13.5px] text-[var(--text)]">
              <Check size={16} strokeWidth={2.4} className="shrink-0 text-[var(--moss)]" />
              {f}
            </div>
          ))}
        </div>
      </Card>
    );
  }

  return (
    <Card>
      <CardHead title="Plano" />

      <div className="mb-1 flex items-center justify-between">
        <span className="font-display text-[18px] font-bold text-[var(--text)]">Pessoal</span>
        <span className="font-mono text-[16px] tabular-nums text-[var(--text)]">
          <span className="text-[0.62em] text-[var(--text-sub)]">R$ </span>0
          <span className="text-[12px] text-[var(--text-sub)]">/mês</span>
        </span>
      </div>
      <p className="m-0 mb-3.5 text-[13px] text-[var(--text-sub)]">
        Contas, transações e relatórios essenciais — sem custo.
      </p>

      <LedgerRule />

      <div className="my-3.5 flex flex-col gap-2.5">
        {FREE_FEATURES.map((f) => (
          <div key={f} className="flex items-center gap-2.5 text-[13.5px] text-[var(--text)]">
            <Check size={16} strokeWidth={2.4} className="shrink-0 text-[var(--moss)]" />
            {f}
          </div>
        ))}
        <div className="flex items-center gap-2.5 text-[13.5px] text-[var(--text-sub)]">
          <Plus size={16} strokeWidth={2} className="shrink-0" />
          Insight diário com IA
          <span
            className="rounded-full px-2 py-0.5 font-mono text-[9.5px] tracking-[0.06em]"
            style={{ background: "color-mix(in srgb, var(--gold) 18%, transparent)", color: "var(--gold)" }}
          >
            Premium
          </span>
        </div>
      </div>

      <PremiumUpgradeButton className="mt-1" />
    </Card>
  );
};

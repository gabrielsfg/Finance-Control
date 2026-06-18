"use client";

import { Check, Plus } from "lucide-react";
import { Card, CardHead, LedgerRule } from "@/components/shared/Card";

const FREE_FEATURES = ["Contas e categorias ilimitadas", "Análises dos últimos 12 meses"];

const PREMIUM_FEATURES = [
  "Insights de IA ilimitados",
  "Integração com B3 e corretoras",
  "Histórico ilimitado",
  "Simulações avançadas",
];

export const ProfilePlanCard = () => {
  const isPremium = false;

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
          Renovação em 15/05/2026 · R$ 29,90/mês
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

      <button
        className="mt-1 inline-flex w-full items-center justify-center rounded-[13px] px-[18px] py-2.5 text-[14px] font-semibold text-white transition-transform hover:-translate-y-[1px]"
        style={{ background: "var(--brand-cobalt)", boxShadow: "0 12px 24px -12px rgba(31,60,224,0.7)" }}
      >
        Conhecer o Premium
      </button>
    </Card>
  );
};

"use client";

import { useState } from "react";
import { SlidersHorizontal } from "lucide-react";
import { Card, CardHead } from "@/components/shared/Card";
import { RiskProfileDrawer } from "@/features/insights/components/RiskProfileDrawer";
import { useRiskProfile } from "@/features/insights/hooks/useRiskProfile";
import type { RiskClassification } from "@/lib/types/insight.types";

const LABELS: Record<RiskClassification, string> = {
  Conservative: "Conservador",
  Moderate: "Moderado",
  Aggressive: "Arrojado",
};

export const ProfileRiskProfileCard = () => {
  const [open, setOpen] = useState(false);
  const { data: profile } = useRiskProfile();

  return (
    <>
      <Card>
        <CardHead title="Perfil de investidor" />

        {profile ? (
          <>
            <p className="text-[15px] font-semibold text-[var(--text)]">
              {LABELS[profile.classification]}
            </p>
            <p className="mt-1.5 text-[12.5px] leading-relaxed text-[var(--text-sub)]">
              {profile.classificationReason}
            </p>
          </>
        ) : (
          <p className="text-[12.5px] leading-relaxed text-[var(--text-sub)]">
            Quatro perguntas rápidas sobre prazo, tolerância a queda e experiência. Suas
            respostas servem só para descrever a carteira que você já tem — o aplicativo não
            recomenda investimentos.
          </p>
        )}

        <button
          onClick={() => setOpen(true)}
          className="mt-3.5 inline-flex w-full items-center justify-center gap-2 rounded-[13px] border border-[var(--text)] px-[18px] py-2.5 text-[14px] font-semibold text-[var(--text)] transition-colors hover:bg-[var(--text)] hover:text-[var(--bg)]"
        >
          <SlidersHorizontal size={15} />
          {profile ? "Refazer questionário" : "Responder questionário"}
        </button>
      </Card>

      <RiskProfileDrawer open={open} onClose={() => setOpen(false)} />
    </>
  );
};

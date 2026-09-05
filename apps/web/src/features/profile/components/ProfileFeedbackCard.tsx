"use client";

import { useState } from "react";
import { MessageSquarePlus } from "lucide-react";
import { Card, CardHead } from "@/components/shared/Card";
import { FeedbackDrawer } from "@/features/feedback/components/FeedbackDrawer";

export const ProfileFeedbackCard = () => {
  const [open, setOpen] = useState(false);

  return (
    <>
      <Card>
        <CardHead title="Fale com a gente" />

        <p className="text-[12.5px] leading-relaxed text-[var(--text-sub)]">
          Achou um problema ou tem uma ideia para o Quantia? Conte aqui. Cada relato vai
          direto para a fila de quem cuida do produto.
        </p>

        <button
          onClick={() => setOpen(true)}
          className="mt-3.5 inline-flex w-full items-center justify-center gap-2 rounded-[13px] border border-[var(--text)] px-[18px] py-2.5 text-[14px] font-semibold text-[var(--text)] transition-colors hover:bg-[var(--text)] hover:text-[var(--bg)]"
        >
          <MessageSquarePlus size={15} />
          Enviar feedback
        </button>
      </Card>

      <FeedbackDrawer open={open} onClose={() => setOpen(false)} />
    </>
  );
};

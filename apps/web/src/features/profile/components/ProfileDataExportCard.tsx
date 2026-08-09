"use client";

import { useState } from "react";
import { Download, FileJson, Loader2 } from "lucide-react";
import Link from "next/link";
import { Card, CardHead } from "@/components/shared/Card";
import { useExportData } from "@/features/profile/hooks/useProfile";

export const ProfileDataExportCard = () => {
  const [error, setError] = useState<string | null>(null);
  const { mutate: exportData, isPending } = useExportData();

  const handleExport = () => {
    setError(null);
    exportData(undefined, {
      onError: () => setError("Não foi possível gerar o arquivo agora. Tente novamente."),
    });
  };

  return (
    <Card>
      <CardHead title="Seus dados" />

      <div className="flex items-start gap-2.5">
        <FileJson size={15} strokeWidth={2.2} className="mt-0.5 shrink-0 text-[var(--text-sub)]" />
        <p className="text-[12.5px] leading-relaxed text-[var(--text-sub)]">
          Baixe tudo o que está guardado nesta conta em um único arquivo JSON: transações,
          contas, categorias, orçamentos, metas, investimentos e os documentos que você
          aceitou. Não inclui sua senha nem dados de sessão.
        </p>
      </div>

      <button
        onClick={handleExport}
        disabled={isPending}
        className="mt-3.5 inline-flex w-full items-center justify-center gap-2 rounded-[13px] border border-[var(--text)] px-[18px] py-2.5 text-[14px] font-semibold text-[var(--text)] transition-colors hover:bg-[var(--text)] hover:text-[var(--bg)] disabled:opacity-50"
      >
        {isPending ? <Loader2 size={15} className="animate-spin" /> : <Download size={15} />}
        {isPending ? "Preparando…" : "Baixar meus dados"}
      </button>

      {error && <p className="mt-2 text-[12px] text-[var(--clay)]">{error}</p>}

      <p className="mt-3.5 text-[11.5px] leading-relaxed text-[var(--text-muted)]">
        Saiba como tratamos seus dados na{" "}
        <Link href="/privacy" className="text-[var(--text-sub)] hover:underline">
          Política de Privacidade
        </Link>
        .
      </p>
    </Card>
  );
};

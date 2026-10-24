"use client";

import { useEffect } from "react";
import Link from "next/link";
import { CheckCircle2 } from "lucide-react";

/**
 * Where the bank sends the browser back after an Open Finance authorization opened
 * outside the widget (mostly on phones). The widget picks the result up by itself; this
 * page only closes the extra tab when it can, and says what to do when it cannot.
 */
export function OpenFinanceCallbackPage() {
  useEffect(() => {
    // Only a tab opened by script can close itself; elsewhere this is a no-op.
    const timer = window.setTimeout(() => window.close(), 1500);
    return () => window.clearTimeout(timer);
  }, []);

  return (
    <div className="flex min-h-[70vh] flex-col items-center justify-center gap-4 px-6 text-center">
      <CheckCircle2 size={36} className="text-green" />
      <div className="flex flex-col gap-1.5">
        <h1 className="font-display text-text text-[20px] font-semibold">Autorização concluída</h1>
        <p className="text-text-sub max-w-sm text-[14px] leading-relaxed">
          Você já pode fechar esta janela e voltar para a tela anterior. A conexão com o banco continua por lá.
        </p>
      </div>
      <Link href="/accounts" className="text-blue text-[14px] font-medium">
        Ir para Contas
      </Link>
    </div>
  );
}

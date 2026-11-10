"use client";

import { useState, type ReactNode } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ExternalLink, FileText, Loader2, LogOut } from "lucide-react";
import { BrandGlyph } from "@/components/shared/BrandMark";
import { Card } from "@/components/shared/Card";
import { useAuthStore } from "@/lib/stores/authStore";
import type { PendingLegalDocument } from "@/lib/types/legal.types";
import { formatDateFull } from "@/lib/utils/formatDate";
import {
  useAcceptLegalDocuments,
  usePendingLegalDocuments,
} from "../hooks/usePendingLegalDocuments";
import { legalDocumentHref } from "../utils/legalRoutes";

/**
 * Blocks the whole app while the signed-in user has not accepted the current version of
 * a legal document. Fails open on error — the check is a client courtesy and a broken
 * request must not lock a user out of their own data.
 *
 * Someone who does not accept the new version keeps the exits the Terms promise: the
 * subscription page (cancel) and the profile (export, delete the account) stay open.
 */
const PATHS_OPEN_WITHOUT_CONSENT = ["/subscription", "/profile"];

export function LegalConsentGate({ children }: { children: ReactNode }) {
  const { data: pending, isLoading } = usePendingLegalDocuments();
  const pathname = usePathname();

  if (PATHS_OPEN_WITHOUT_CONSENT.some((path) => pathname?.startsWith(path))) return <>{children}</>;

  if (isLoading) {
    return (
      <div className="bg-background flex h-full items-center justify-center">
        <Loader2 size={22} className="text-text-muted animate-spin" />
      </div>
    );
  }

  if (pending && pending.length > 0) return <LegalConsentScreen pending={pending} />;

  return <>{children}</>;
}

function headlineFor(pending: PendingLegalDocument[]): string {
  const types = new Set(pending.map((d) => d.type));
  if (types.has("TermsOfUse") && types.has("PrivacyPolicy"))
    return "Atualizamos nossos Termos de Uso e Política de Privacidade";
  if (types.has("TermsOfUse")) return "Atualizamos nossos Termos de Uso";
  return "Atualizamos nossa Política de Privacidade";
}

function LegalConsentScreen({ pending }: { pending: PendingLegalDocument[] }) {
  const [accepted, setAccepted] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const acceptMutation = useAcceptLegalDocuments();
  const logout = useAuthStore((s) => s.logout);

  const handleContinue = () => {
    setError(null);
    acceptMutation.mutate(
      { documents: pending.map((d) => ({ type: d.type, version: d.version })) },
      {
        onError: (err: unknown) => {
          const status = (err as { response?: { status: number } })?.response?.status;
          setAccepted(false);
          setError(
            status === 409
              ? "Os documentos foram atualizados novamente. Revise as versões atuais antes de continuar."
              : "Não foi possível registrar seu aceite agora. Tente novamente em instantes.",
          );
        },
      },
    );
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="legal-consent-title"
      className="bg-background fixed inset-0 z-[100] flex items-center justify-center overflow-y-auto px-4 py-10"
    >
      <Card className="w-full max-w-[520px]">
        <BrandGlyph size={36} className="mb-5" />

        <h1
          id="legal-consent-title"
          className="font-display text-text mb-2 text-[21px] leading-tight font-bold tracking-tight"
        >
          {headlineFor(pending)}
        </h1>
        <p className="text-text-sub mb-5 text-[13.5px] leading-relaxed">
          Para continuar usando o app, leia as novas versões abaixo e confirme o seu aceite.
        </p>

        <ul className="mb-5 flex flex-col gap-2">
          {pending.map((document) => (
            <li key={document.type}>
              <a
                href={legalDocumentHref(document.type, document.version)}
                target="_blank"
                rel="noopener noreferrer"
                className="border-border hover:border-green/60 bg-surface2 flex items-center gap-3 rounded-[12px] border px-4 py-3 transition-colors"
              >
                <FileText size={17} className="text-text-sub shrink-0" />
                <span className="min-w-0 flex-1">
                  <span className="text-text block text-[14px] font-semibold">
                    {document.title}
                  </span>
                  <span className="text-text-muted block text-[12px]">
                    Versão {document.version} · publicada em {formatDateFull(document.publishedAt)}
                  </span>
                </span>
                <ExternalLink size={15} className="text-text-muted shrink-0" />
              </a>
            </li>
          ))}
        </ul>

        <label className="mb-5 flex cursor-pointer items-start gap-2.5">
          <input
            type="checkbox"
            checked={accepted}
            onChange={(e) => setAccepted(e.target.checked)}
            className="accent-green border-border mt-0.5 size-[15px] shrink-0 cursor-pointer rounded-[4px]"
          />
          <span className="text-text-sub text-[13px] leading-relaxed">
            Li e aceito as novas versões
          </span>
        </label>

        {error && (
          <div className="border-red/30 bg-red/10 text-red mb-4 rounded-[8px] border px-4 py-3 text-[13px]">
            {error}
          </div>
        )}

        <div className="flex flex-col gap-2.5">
          <button
            type="button"
            onClick={handleContinue}
            disabled={!accepted || acceptMutation.isPending}
            className="flex items-center justify-center gap-2 rounded-[13px] bg-[var(--brand-cobalt)] px-4 py-2.5 text-[14px] font-semibold text-white disabled:opacity-50"
          >
            {acceptMutation.isPending && <Loader2 size={15} className="animate-spin" />}
            Continuar
          </button>
          <p className="text-text-muted text-center text-[12px] leading-relaxed">
            Não concorda? Você pode{" "}
            <Link href="/subscription" className="text-text-sub underline">
              cancelar a assinatura
            </Link>{" "}
            ou{" "}
            <Link href="/profile" className="text-text-sub underline">
              exportar seus dados e excluir a conta
            </Link>
            .
          </p>
          <button
            type="button"
            onClick={() => void logout("signedOut")}
            className="text-text-sub hover:text-text flex items-center justify-center gap-2 rounded-[13px] px-4 py-2.5 text-[13.5px] font-medium transition-colors"
          >
            <LogOut size={15} />
            Sair
          </button>
        </div>
      </Card>
    </div>
  );
}

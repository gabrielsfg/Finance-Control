"use client";

import { Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { ArrowLeft, Loader2 } from "lucide-react";
import { MarkdownContent } from "@/features/legal/components/MarkdownContent";
import { useLegalDocument } from "@/features/legal/hooks/useLegalDocument";
import type { LegalDocumentType } from "@/lib/types/legal.types";
import { formatDateFull } from "@/lib/utils/formatDate";

type LegalDocumentPageProps = {
  type: LegalDocumentType;
  title: string;
};

const LegalDocumentContent = ({ type, title }: LegalDocumentPageProps) => {
  const searchParams = useSearchParams();

  // ?v=1 opens an archived version instead of the current one, which is how a user
  // reads back what they accepted rather than what is published today.
  const requested = Number(searchParams.get("v"));
  const version = Number.isInteger(requested) && requested > 0 ? requested : undefined;

  const { data: document, isError } = useLegalDocument(type, version);

  return (
    <div className="mx-auto w-full max-w-[760px] px-6 py-10">
      <Link
        href="/login"
        className="text-text-sub hover:text-text mb-8 inline-flex items-center gap-1.5 text-[13px] transition-colors"
      >
        <ArrowLeft size={14} />
        Voltar
      </Link>

      <h1 className="font-display font-700 text-text text-[30px] tracking-tight">{title}</h1>

      {document && (
        <p className="text-text-muted mt-2 font-mono text-[11px] tracking-[0.08em] uppercase">
          Versão {document.version} · Publicada em {formatDateFull(document.publishedAt)}
        </p>
      )}

      {/* Chained rather than three independent flags: a query can sit idle — paused
          while the persisted cache restores, for one — and that combination would
          otherwise paint an empty page under the heading. */}
      <div className="border-border mt-8 border-t pt-8">
        {document ? (
          <MarkdownContent content={document.content} />
        ) : isError ? (
          <p className="text-text-sub text-[14px]">
            Não foi possível carregar este documento agora. Tente novamente em instantes.
          </p>
        ) : (
          <div className="text-text-sub flex items-center gap-2 text-[14px]">
            <Loader2 size={15} className="animate-spin" />
            Carregando…
          </div>
        )}
      </div>

      {document && (
        <p className="text-text-muted border-border mt-10 border-t pt-6 font-mono text-[11px] break-all">
          SHA-256: {document.contentHash}
        </p>
      )}
    </div>
  );
};

export const LegalDocumentPage = (props: LegalDocumentPageProps) => (
  // useSearchParams forces client-side rendering up to the nearest boundary, so the
  // boundary is here rather than around the whole route.
  <Suspense
    fallback={
      <div className="mx-auto w-full max-w-[760px] px-6 py-10">
        <h1 className="font-display font-700 text-text text-[30px] tracking-tight">
          {props.title}
        </h1>
      </div>
    }
  >
    <LegalDocumentContent {...props} />
  </Suspense>
);

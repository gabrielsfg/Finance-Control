"use client";

import { Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { ArrowLeft, Loader2, Printer } from "lucide-react";
import { MarkdownContent } from "@/features/legal/components/MarkdownContent";
import { useLegalDocument } from "@/features/legal/hooks/useLegalDocument";
import { useLegalDocumentVersions } from "@/features/legal/hooks/useLegalDocumentVersions";
import { legalDocumentHref } from "@/features/legal/utils/legalRoutes";
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
  const { data: versions } = useLegalDocumentVersions(type);

  const previousVersions = versions?.filter((v) => !v.isCurrent) ?? [];
  const isArchived =
    !!document && !!versions && versions.some((v) => v.isCurrent && v.version !== document.version);

  return (
    <div className="mx-auto w-full max-w-[760px] px-6 py-10">
      <Link
        href="/login"
        className="text-text-sub hover:text-text mb-8 inline-flex items-center gap-1.5 text-[13px] transition-colors print:hidden"
      >
        <ArrowLeft size={14} />
        Voltar
      </Link>

      <h1 className="font-display font-700 text-text text-[30px] tracking-tight">{title}</h1>

      {document && (
        <div className="mt-2 flex flex-wrap items-center justify-between gap-3">
          <p className="text-text-muted font-mono text-[11px] tracking-[0.08em] uppercase">
            Versão {document.version} · Publicada em {formatDateFull(document.publishedAt)}
          </p>
          {/* Printing is also how the document is saved: the browser's print dialog
              offers "Save as PDF", and the print styles strip everything but the text. */}
          <button
            type="button"
            onClick={() => window.print()}
            className="border-border text-text-sub hover:text-text inline-flex items-center gap-1.5 rounded-[9px] border px-3 py-1.5 text-[12.5px] transition-colors print:hidden"
          >
            <Printer size={14} />
            Imprimir / salvar PDF
          </button>
        </div>
      )}

      {isArchived && (
        <p className="border-border bg-surface2 text-text-sub mt-5 rounded-[10px] border px-4 py-3 text-[13px] print:hidden">
          Você está vendo uma versão anterior deste documento.{" "}
          <Link href={legalDocumentHref(type)} className="text-green hover:underline">
            Ver a versão em vigor
          </Link>
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

      {previousVersions.length > 0 && (
        <section className="border-border mt-10 border-t pt-6 print:hidden">
          <h2 className="font-display text-text mb-3 text-[16px] font-semibold">
            Versões anteriores
          </h2>
          <ul className="flex flex-col gap-1.5">
            {previousVersions.map((v) => (
              <li key={v.version} className="text-[13.5px]">
                {v.version === document?.version ? (
                  <span className="text-text">
                    Versão {v.version} · publicada em {formatDateFull(v.publishedAt)} (exibindo)
                  </span>
                ) : (
                  <Link
                    href={legalDocumentHref(type, v.version)}
                    className="text-green hover:underline"
                  >
                    Versão {v.version} · publicada em {formatDateFull(v.publishedAt)}
                  </Link>
                )}
              </li>
            ))}
          </ul>
        </section>
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

import type { LegalDocumentType } from "@/lib/types/legal.types";

const LEGAL_DOCUMENT_PATHS: Record<LegalDocumentType, string> = {
  TermsOfUse: "/terms",
  PrivacyPolicy: "/privacy",
};

/** Public page of a document; with `version`, the archived text of that exact version. */
export const legalDocumentHref = (type: LegalDocumentType, version?: number): string =>
  version ? `${LEGAL_DOCUMENT_PATHS[type]}?v=${version}` : LEGAL_DOCUMENT_PATHS[type];

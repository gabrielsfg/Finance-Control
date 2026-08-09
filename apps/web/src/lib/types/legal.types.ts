export type LegalDocumentType = "PrivacyPolicy" | "TermsOfUse";

export type LegalDocument = {
  type: LegalDocumentType;
  version: number;
  /** Markdown, exactly as published. */
  content: string;
  /** SHA-256 of the content — the same value recorded next to each acceptance. */
  contentHash: string;
  publishedAt: string;
};

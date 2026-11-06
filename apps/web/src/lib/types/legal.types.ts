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

/** A document whose current version the user has not accepted yet. */
export type PendingLegalDocument = {
  type: LegalDocumentType;
  version: number;
  title: string;
  publishedAt: string;
};

/** One published version of a document, without its text. */
export type LegalDocumentVersion = {
  version: number;
  publishedAt: string;
  contentHash: string;
  /** The newest version — the one in force. */
  isCurrent: boolean;
};

export type AcceptLegalDocumentsRequest = {
  documents: { type: LegalDocumentType; version: number }[];
};

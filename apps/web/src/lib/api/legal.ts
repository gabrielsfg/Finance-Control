import { api } from "./axios";
import type {
  AcceptLegalDocumentsRequest,
  LegalDocument,
  LegalDocumentType,
  LegalDocumentVersion,
  PendingLegalDocument,
} from "@/lib/types/legal.types";

export const legalApi = {
  /**
   * Without `version`, the current text. With it, the archived one — how someone
   * reads back the exact wording they accepted.
   */
  get: async (type: LegalDocumentType, version?: number): Promise<LegalDocument> => {
    const response = await api.get<LegalDocument>(`/legal/${type}`, {
      params: version ? { version } : undefined,
    });
    return response.data;
  },

  /** Every published version of a document, newest first. */
  getVersions: async (type: LegalDocumentType): Promise<LegalDocumentVersion[]> => {
    const response = await api.get<LegalDocumentVersion[]>(`/legal/${type}/versions`);
    return response.data;
  },

  /** Documents whose current version the signed-in user has not accepted yet. */
  getPending: async (): Promise<PendingLegalDocument[]> => {
    const response = await api.get<PendingLegalDocument[]>("/legal/pending");
    return response.data;
  },

  /** Accepts the exact versions shown; returns what is still pending (normally nothing). */
  accept: async (data: AcceptLegalDocumentsRequest): Promise<PendingLegalDocument[]> => {
    const response = await api.post<PendingLegalDocument[]>("/legal/accept", data);
    return response.data;
  },
};
